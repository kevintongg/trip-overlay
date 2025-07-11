import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateDistance } from '../utils/gps';
import { CONFIG, validateCoordinates } from '../utils/config';
import { logger } from '../utils/logger';
import { speedUpdateService } from '../utils/speedUpdateService';
import { useConnectionStore } from '../store/connectionStore';
import type { Coordinates } from '../types/config';
import type { LocationData } from '../types/rtirl';
import type { MovementMode } from '../types/trip';

// Core state structure - exact mirror of original appState
interface TripOverlayState {
  lastSaveTime: number;
  uiUpdateScheduled: boolean;
  uiUpdateTimeout: number | null;
  isConnected: boolean;
  useImperialUnits: boolean;
  originalTotalDistance: number;
  currentMode: MovementMode;
  modeSwitchTimeout: number | null;
  totalDistanceTraveled: number;
  todayDistanceTraveled: number;
  lastPosition: Coordinates | null;
  lastUpdateTime: number;
  startLocation: Coordinates | null;
  lastThrottleLogTime: number;
  lastLoggedSpeed: number | null;
  lastProgressLogTime: number;
  lastLoggedProgress: number | null;
  speedHistory: number[];
  positionHistory: Array<{ position: Coordinates; timestamp: number }>;
  lastModeChange: number;
  consistentModeReadings: number;
  lastProposedMode: MovementMode;
  stationaryCenter: Coordinates | null;
  modeChangeCounter: number;
  isInitialized: boolean;
}

// Initial state - matches original configuration
const createInitialState = (): TripOverlayState => ({
  lastSaveTime: 0,
  uiUpdateScheduled: false,
  uiUpdateTimeout: null,
  isConnected: false,
  useImperialUnits: false,
  originalTotalDistance: CONFIG.trip.totalDistanceKm,
  currentMode: 'STATIONARY',
  modeSwitchTimeout: null,
  totalDistanceTraveled: 0,
  todayDistanceTraveled: 0,
  lastPosition: null,
  lastUpdateTime: 0,
  startLocation: CONFIG.trip.useAutoStart
    ? null
    : CONFIG.trip.manualStartLocation,
  lastThrottleLogTime: 0,
  lastLoggedSpeed: null,
  lastProgressLogTime: 0,
  lastLoggedProgress: null,
  speedHistory: [],
  positionHistory: [],
  lastModeChange: 0,
  consistentModeReadings: 0,
  lastProposedMode: 'STATIONARY',
  stationaryCenter: null,
  modeChangeCounter: 0,
  isInitialized: false,
});

/**
 * Unified Trip Overlay Hook - Direct port of original vanilla JS logic
 * This hook manages all trip state and GPS processing in one place
 */
export function useTripOverlay() {
  const [state, setState] = useState<TripOverlayState>(createInitialState);
  const stateRef = useRef<TripOverlayState>(state);

  // Get connection state for status reporting
  const connectionState = useConnectionStore();

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Debounced save function - exact port from original
  const debouncedSave = useCallback(() => {
    const now = Date.now();
    if (
      now - stateRef.current.lastSaveTime <
      CONFIG.performance.saveDebounceDelay
    ) {
      return;
    }

    const currentDate = new Date().toDateString();
    const saveData = {
      totalDistanceTraveled: stateRef.current.totalDistanceTraveled,
      todayDistanceTraveled: stateRef.current.todayDistanceTraveled,
      date: currentDate,
      lastActiveTime: new Date().toISOString(),
      useImperialUnits: stateRef.current.useImperialUnits,
      totalDistance: stateRef.current.originalTotalDistance,
      currentMode: stateRef.current.currentMode,
      autoStartLocation:
        CONFIG.trip.useAutoStart && stateRef.current.startLocation
          ? stateRef.current.startLocation
          : null,
    };

    localStorage.setItem('trip-overlay-data', JSON.stringify(saveData));
    setState(prev => ({ ...prev, lastSaveTime: now }));
  }, []);

  // Movement detection using original responsive logic for live streaming
  const determineMovementMode = useCallback(
    (speed: number, _currentMode: MovementMode): MovementMode => {
      // Use original config thresholds
      const STATIONARY_THRESHOLD = CONFIG.movement.modes.STATIONARY.maxSpeed;
      const WALKING_THRESHOLD = CONFIG.movement.modes.WALKING.maxSpeed;

      // Immediate switching like original for responsiveness
      if (speed > WALKING_THRESHOLD) {
        return 'CYCLING';
      } else if (speed > STATIONARY_THRESHOLD) {
        return 'WALKING';
      } else {
        return 'STATIONARY';
      }
    },
    []
  );

  // Speed calculation - exact port from original
  const calculateSpeedFromGPS = useCallback(
    (pos1: Coordinates, pos2: Coordinates, timeDeltaMs: number): number => {
      if (timeDeltaMs <= 0) return 0;
      const distanceKm = calculateDistance(pos1, pos2);
      const timeHours = timeDeltaMs / (1000 * 60 * 60);
      return distanceKm / timeHours;
    },
    []
  );

  // Enhanced GPS processing with comprehensive bug fixes
  const processLocationUpdate = useCallback(
    (data: LocationData) => {
      const now = Date.now();
      const currentState = stateRef.current;

      // Log ALL RTIRL updates for stream debugging
      logger(
        `📡 RTIRL: Location update - ${data.latitude?.toFixed(6)}, ${data.longitude?.toFixed(6)} | Speed: ${data.speed?.toFixed(1) || 'N/A'} km/h | Accuracy: ${data.accuracy?.toFixed(1) || 'N/A'}m | Time: ${new Date(now).toLocaleTimeString()}`
      );

      // Validate coordinates
      const newPosition: Coordinates = {
        lat: data.latitude,
        lon: data.longitude,
      };

      if (!validateCoordinates(newPosition)) {
        logger.warn('⚠️ GPS: Invalid coordinates, ignoring update:', data);
        return;
      }

      // Stricter accuracy validation
      if (data.accuracy && data.accuracy > 15) {
        logger.warn(
          `⚠️ GPS: Poor accuracy (${data.accuracy}m), ignoring update`
        );
        return;
      }

      // Handle initial position
      if (
        !currentState.lastPosition ||
        now - currentState.lastUpdateTime > 30000
      ) {
        setState(prev => ({
          ...prev,
          lastPosition: newPosition,
          lastUpdateTime: now,
          positionHistory: [{ position: newPosition, timestamp: now }],
          stationaryCenter: newPosition, // Set initial stationary center
          consistentModeReadings: 0,
          lastProposedMode: 'STATIONARY',
        }));

        // Update the ref immediately to prevent subsequent updates from being treated as initial
        stateRef.current = {
          ...stateRef.current,
          lastPosition: newPosition,
          lastUpdateTime: now,
        };

        logger('📍 GPS: Initial position set');
        logger(
          `✅ RTIRL: Streamer location is now live! - ${newPosition.lat.toFixed(4)}, ${newPosition.lon.toFixed(4)}`
        );
        return;
      }

      const timeDelta = now - currentState.lastUpdateTime;
      if (timeDelta < 1000) return; // Skip too frequent updates

      // Calculate distance and speed
      const distanceKm = calculateDistance(
        currentState.lastPosition,
        newPosition
      );
      const distanceM = distanceKm * 1000;
      const reportedSpeed = data.speed || 0;
      const calculatedSpeed = calculateSpeedFromGPS(
        currentState.lastPosition,
        newPosition,
        timeDelta
      );
      // Original speed calculation logic - simple and reliable
      const finalSpeed = Math.max(reportedSpeed, calculatedSpeed);

      // Add detailed speed calculation logging like original
      if (currentState.speedHistory.length === 0) {
        logger(
          `🧮 Trip: Initial speed check - Reported: ${reportedSpeed.toFixed(1)} km/h, Calculated: ${calculatedSpeed.toFixed(1)} km/h -> Using: ${finalSpeed.toFixed(1)} km/h`
        );
      }

      // GPS drift detection for stationary mode
      const STATIONARY_DRIFT_THRESHOLD = 8; // meters
      let isGPSDrift = false;

      if (currentState.stationaryCenter) {
        const driftDistance =
          calculateDistance(currentState.stationaryCenter, newPosition) * 1000;
        // Only consider drift if BOTH distance is small AND speed is low
        if (driftDistance < STATIONARY_DRIFT_THRESHOLD && finalSpeed < 2.0) {
          isGPSDrift = true;
          logger(
            `🎯 GPS: Drift detected - ${driftDistance.toFixed(1)}m from stationary center`
          );
        } else if (finalSpeed >= 2.0) {
          // Clear stationary center if speed indicates real movement
          logger(
            '🏃 GPS: Clearing stationary center - significant speed detected'
          );
        }
      }

      // Update speed history
      const newSpeedHistory = [...currentState.speedHistory, finalSpeed];
      if (newSpeedHistory.length > 10) {
        newSpeedHistory.shift();
      }

      // Use original vanilla JS logic - no smoothing, just use the calculated speed
      const smoothedSpeed = finalSpeed;

      // Movement mode detection - calculate what mode the speed suggests
      const speedBasedMode: MovementMode = (() => {
        const STATIONARY_THRESHOLD = CONFIG.movement.modes.STATIONARY.maxSpeed;
        const WALKING_THRESHOLD = CONFIG.movement.modes.WALKING.maxSpeed;

        if (smoothedSpeed > WALKING_THRESHOLD) {
          return 'CYCLING';
        } else if (smoothedSpeed > STATIONARY_THRESHOLD) {
          return 'WALKING';
        } else {
          return 'STATIONARY';
        }
      })();

      // Immediate mode switching like original for responsiveness
      let actualMode: MovementMode = speedBasedMode;
      if (speedBasedMode !== currentState.currentMode) {
        const previousMode = currentState.currentMode;
        // Match original logging format
        logger(`MODE CHANGE: ${previousMode} → ${actualMode}`);
        logger(`🏃‍♂️ Movement mode changed to: ${actualMode}`);
        logger(
          `🔄 GPS: Mode changed to ${actualMode} (speed: ${smoothedSpeed.toFixed(1)} km/h)`
        );
      }

      // Update or reset stationary center
      let newStationaryCenter = currentState.stationaryCenter;
      if (actualMode === 'STATIONARY') {
        if (!newStationaryCenter || smoothedSpeed < 1.0) {
          newStationaryCenter = newPosition;
          logger('📌 GPS: Updated stationary center');
        }
      } else if (
        actualMode === 'WALKING' ||
        actualMode === 'CYCLING' ||
        smoothedSpeed > 3.0
      ) {
        // Clear stationary center when moving or significant speed detected
        newStationaryCenter = null;
        logger('🏃 GPS: Cleared stationary center - moving');
      }

      // Enhanced distance validation and accumulation
      let newTotalTraveled = currentState.totalDistanceTraveled;
      let newTodayTraveled = currentState.todayDistanceTraveled;

      // Only accumulate distance if:
      // 1. Not GPS drift
      // 2. Not in stationary mode
      // 3. Speed is above meaningful threshold
      // 4. Distance is reasonable
      if (!isGPSDrift && actualMode !== 'STATIONARY' && smoothedSpeed > 1.0) {
        const usedModeConfig = CONFIG.movement.modes[actualMode];
        const minMovementKm = usedModeConfig.minMovementM / 1000;

        if (distanceKm >= minMovementKm) {
          // Calculate maximum reasonable distance for time period and mode
          const maxSpeedMs = usedModeConfig.maxSpeed / 3.6;
          const maxReasonableDistance =
            ((timeDelta / 1000) * maxSpeedMs) / 1000;

          if (distanceKm <= maxReasonableDistance * 1.5) {
            newTotalTraveled += distanceKm;
            newTodayTraveled += distanceKm;

            // Match original comprehensive logging format
            const progressPercent =
              state.originalTotalDistance > 0
                ? (newTotalTraveled / state.originalTotalDistance) * 100
                : 0;
            const unitMultiplier = state.useImperialUnits ? 0.621371 : 1;
            const units = state.useImperialUnits ? 'mi' : 'km';

            logger(
              `✅ GPS: Added ${distanceKm.toFixed(4)} km to trip (speed: ${smoothedSpeed.toFixed(1)} km/h, mode: ${actualMode})`
            );
            logger(
              `📈 Trip: Progress update - +${(distanceKm * unitMultiplier).toFixed(4)}${units} | Total: ${(newTotalTraveled * unitMultiplier).toFixed(4)}${units} | ${progressPercent.toFixed(2)}% | Mode: ${actualMode}`
            );
          } else {
            logger.warn(
              `⚠️ GPS: Jump detected - ignoring ${distanceKm.toFixed(4)}km (max: ${maxReasonableDistance.toFixed(4)}km)`
            );
            logger.warn(
              `⚠️ Trip: GPS jump detected in ${actualMode} mode: ${distanceKm.toFixed(2)}km vs max ${maxReasonableDistance.toFixed(2)}km - ignoring`
            );
          }
        } else {
          logger(
            `📏 GPS: Movement too small - ${distanceKm.toFixed(4)}km (min: ${minMovementKm.toFixed(4)}km)`
          );
        }
      } else if (isGPSDrift) {
        logger(`🎯 GPS: Ignoring drift movement - ${distanceM.toFixed(1)}m`);
      }

      // Update state with all the fixes
      setState(prev => ({
        ...prev,
        lastPosition: newPosition,
        lastUpdateTime: now,
        currentMode: actualMode,
        lastModeChange:
          actualMode !== prev.currentMode ? now : prev.lastModeChange,
        totalDistanceTraveled: newTotalTraveled,
        todayDistanceTraveled: newTodayTraveled,
        speedHistory: newSpeedHistory,
        positionHistory: [
          ...prev.positionHistory,
          { position: newPosition, timestamp: now },
        ].slice(-10),
        consistentModeReadings: 0,
        lastProposedMode: actualMode,
        stationaryCenter: newStationaryCenter,
        // Force re-render by updating a counter when mode changes
        modeChangeCounter:
          actualMode !== prev.currentMode
            ? (prev.modeChangeCounter || 0) + 1
            : prev.modeChangeCounter || 0,
      }));

      // Update localStorage for dashboard compatibility
      speedUpdateService.updateSpeed(smoothedSpeed, actualMode);

      // Save progress immediately for distance updates to prevent data loss
      const immediateData = {
        totalDistanceTraveled: newTotalTraveled,
        todayDistanceTraveled: newTodayTraveled,
        date: new Date().toDateString(),
        lastActiveTime: new Date().toISOString(),
        useImperialUnits: currentState.useImperialUnits,
        totalDistance: currentState.originalTotalDistance,
        currentMode: actualMode,
        autoStartLocation:
          CONFIG.trip.useAutoStart && currentState.startLocation
            ? currentState.startLocation
            : null,
      };
      localStorage.setItem('trip-overlay-data', JSON.stringify(immediateData));

      // Comprehensive logging
      logger(
        `🧮 GPS: ${distanceM.toFixed(1)}m in ${(timeDelta / 1000).toFixed(1)}s -> Speed: ${smoothedSpeed.toFixed(1)} km/h, Mode: ${actualMode} ${isGPSDrift ? '[DRIFT]' : ''}`
      );
    },
    [
      calculateSpeedFromGPS,
      state.originalTotalDistance,
      state.useImperialUnits,
    ]
  );

  // Console commands - exact port from original
  const addDistance = useCallback((km: number) => {
    const distance = parseFloat(km.toString());
    if (isFinite(distance)) {
      setState(prev => {
        const newState = {
          ...prev,
          totalDistanceTraveled: Math.max(
            0,
            prev.totalDistanceTraveled + distance
          ),
          todayDistanceTraveled: Math.max(
            0,
            prev.todayDistanceTraveled + distance
          ),
          lastSaveTime: 0, // Force immediate save
        };

        // Immediate save with new values
        setTimeout(() => {
          const saveData = {
            totalDistanceTraveled: newState.totalDistanceTraveled,
            todayDistanceTraveled: newState.todayDistanceTraveled,
            date: new Date().toDateString(),
            lastActiveTime: new Date().toISOString(),
            useImperialUnits: newState.useImperialUnits,
            totalDistance: newState.originalTotalDistance,
            autoStartLocation:
              CONFIG.trip.useAutoStart && newState.startLocation
                ? newState.startLocation
                : null,
          };
          localStorage.setItem('trip-overlay-data', JSON.stringify(saveData));
          logger('💾 Immediate save completed');
        }, 0);

        return newState;
      });

      const action = distance >= 0 ? 'Added' : 'Adjusted';
      logger(`CONSOLE: ${action} ${Math.abs(distance)}km`);
    }
  }, []);

  const setDistance = useCallback(
    (km: number) => {
      const distance = parseFloat(km.toString());
      if (isFinite(distance) && distance >= 0) {
        setState(prev => ({
          ...prev,
          totalDistanceTraveled: distance,
          todayDistanceTraveled: distance,
        }));
        debouncedSave();
        logger(`CONSOLE: Set distance to ${distance}km`);
      }
    },
    [debouncedSave]
  );

  const jumpToProgress = useCallback(
    (percent: number) => {
      const percentage = parseFloat(percent.toString());
      if (isFinite(percentage) && percentage >= 0 && percentage <= 100) {
        const targetDistance = (percentage / 100) * state.originalTotalDistance;
        setState(prev => ({
          ...prev,
          totalDistanceTraveled: Math.max(
            prev.totalDistanceTraveled,
            targetDistance
          ),
        }));
        debouncedSave();
        logger(
          `CONSOLE: Jumped to ${percentage}% (${targetDistance.toFixed(2)}km)`
        );
      }
    },
    [state.originalTotalDistance, debouncedSave]
  );

  const resetTripProgress = useCallback(() => {
    setState(prev => ({
      ...prev,
      totalDistanceTraveled: 0,
      todayDistanceTraveled: 0,
    }));
    debouncedSave();
    logger('CONSOLE: Trip progress reset');
  }, [debouncedSave]);

  const resetTodayDistance = useCallback(() => {
    setState(prev => ({
      ...prev,
      todayDistanceTraveled: 0,
    }));
    debouncedSave();
    logger('CONSOLE: Today distance reset');
  }, [debouncedSave]);

  const convertToMiles = useCallback(() => {
    setState(prev => ({ ...prev, useImperialUnits: true }));
    debouncedSave();
    logger('CONSOLE: Converted to miles');
  }, [debouncedSave]);

  const convertToKilometers = useCallback(() => {
    setState(prev => ({ ...prev, useImperialUnits: false }));
    debouncedSave();
    logger('CONSOLE: Converted to kilometers');
  }, [debouncedSave]);

  const setTotalDistance = useCallback(
    (km: number) => {
      const distance = parseFloat(km.toString());
      if (isFinite(distance) && distance > 0) {
        setState(prev => ({
          ...prev,
          originalTotalDistance: distance,
        }));
        debouncedSave();
        logger(`CONSOLE: Set total distance to ${distance}km`);
      }
    },
    [debouncedSave]
  );

  const setTodayDistance = useCallback(
    (km: number) => {
      const distance = parseFloat(km.toString());
      if (isFinite(distance) && distance >= 0) {
        setState(prev => ({
          ...prev,
          todayDistanceTraveled: distance,
        }));
        debouncedSave();
        logger(`CONSOLE: Set today's distance to ${distance}km`);
      }
    },
    [debouncedSave]
  );

  const setTotalTraveled = useCallback(
    (km: number) => {
      const distance = parseFloat(km.toString());
      if (isFinite(distance) && distance >= 0) {
        setState(prev => ({
          ...prev,
          totalDistanceTraveled: distance,
        }));
        debouncedSave();
        logger(`CONSOLE: Set total traveled distance to ${distance}km`);
      }
    },
    [debouncedSave]
  );

  const importTripData = useCallback(
    (jsonString: string) => {
      try {
        const data = JSON.parse(jsonString);
        setState(prev => ({
          ...prev,
          totalDistanceTraveled: data.totalDistanceTraveled || 0,
          todayDistanceTraveled: data.todayDistanceTraveled || 0,
          useImperialUnits: data.useImperialUnits || false,
          originalTotalDistance:
            data.totalDistance || CONFIG.trip.totalDistanceKm,
        }));
        debouncedSave();
        logger('CONSOLE: Trip data imported successfully');
      } catch (error) {
        logger.error('CONSOLE: Failed to import trip data:', error);
      }
    },
    [debouncedSave]
  );

  // Load persisted data on mount with daily reset logic
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trip-overlay-data');
      if (saved) {
        const data = JSON.parse(saved);

        // Check if we should reset today's distance (original logic)
        const shouldResetToday = (() => {
          const now = new Date();
          const savedDate = data.date;
          const lastActiveTime = data.lastActiveTime;

          if (!savedDate || savedDate === now.toDateString()) {
            return false;
          }

          if (lastActiveTime) {
            const hoursSinceLastActive =
              (now.getTime() - new Date(lastActiveTime).getTime()) /
              (1000 * 60 * 60);
            if (hoursSinceLastActive < 6) {
              return false;
            }
          }

          return true;
        })();

        setState(prev => ({
          ...prev,
          totalDistanceTraveled: data.totalDistanceTraveled || 0,
          todayDistanceTraveled: shouldResetToday
            ? 0
            : data.todayDistanceTraveled || 0,
          useImperialUnits: data.useImperialUnits || false,
          originalTotalDistance:
            data.totalDistance || CONFIG.trip.totalDistanceKm,
          currentMode: data.currentMode || 'STATIONARY',
          isInitialized: true,
        }));

        if (shouldResetToday) {
          logger('Daily distance reset - new travel day detected');
        }
      } else {
        // No saved data - mark as initialized
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    } catch (error) {
      logger.error('Failed to load persisted data:', error);
      // Even if loading fails, mark as initialized so URL parameters can run
      setState(prev => ({ ...prev, isInitialized: true }));
    }
  }, []);

  // Set up location update listener with original logging
  useEffect(() => {
    // Log initialization like original
    logger('⚙️ Trip: Movement detection enabled');
    logger(
      `📡 Trip: GPS throttling - STATIONARY:${CONFIG.movement.modes.STATIONARY.gpsThrottle}ms, WALKING:${CONFIG.movement.modes.WALKING.gpsThrottle}ms, CYCLING:${CONFIG.movement.modes.CYCLING.gpsThrottle}ms`
    );

    const handleLocationUpdate = (event: CustomEvent<LocationData>) => {
      processLocationUpdate(event.detail);
    };

    window.addEventListener(
      'locationUpdate',
      handleLocationUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        'locationUpdate',
        handleLocationUpdate as EventListener
      );
    };
  }, [processLocationUpdate]);

  // Ensure data is saved before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const saveData = {
        totalDistanceTraveled: stateRef.current.totalDistanceTraveled,
        todayDistanceTraveled: stateRef.current.todayDistanceTraveled,
        date: new Date().toDateString(),
        lastActiveTime: new Date().toISOString(),
        useImperialUnits: stateRef.current.useImperialUnits,
        totalDistance: stateRef.current.originalTotalDistance,
        currentMode: stateRef.current.currentMode,
        autoStartLocation:
          CONFIG.trip.useAutoStart && stateRef.current.startLocation
            ? stateRef.current.startLocation
            : null,
      };
      localStorage.setItem('trip-overlay-data', JSON.stringify(saveData));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Calculated values for display
  const progressPercent =
    state.originalTotalDistance > 0
      ? Math.min(
          100,
          (state.totalDistanceTraveled / state.originalTotalDistance) * 100
        )
      : 0;

  const remainingDistance = Math.max(
    0,
    state.originalTotalDistance - state.totalDistanceTraveled
  );

  const kmToMiles = 0.621371;
  const unitMultiplier = state.useImperialUnits ? kmToMiles : 1;
  const unitSuffix = state.useImperialUnits ? 'mi' : 'km';

  return {
    // State values
    traveledDistance: state.totalDistanceTraveled * unitMultiplier,
    todayDistance: state.todayDistanceTraveled * unitMultiplier,
    remainingDistance: remainingDistance * unitMultiplier,
    progressPercent,
    currentMode: state.currentMode,
    useImperialUnits: state.useImperialUnits,
    unitSuffix,
    modeChangeCounter: state.modeChangeCounter, // Force re-render on mode changes
    isInitialized: state.isInitialized,

    // Console commands
    addDistance,
    setDistance,
    jumpToProgress,
    resetTripProgress,
    resetTodayDistance,
    convertToMiles,
    convertToKilometers,
    setTotalDistance,
    setTodayDistance,
    setTotalTraveled,
    importTripData,

    // Status - human readable for streaming
    getStatus: () => {
      // Check demo mode and RTIRL status
      const isDemoMode =
        CONFIG.rtirl.demoMode ||
        new URLSearchParams(window.location.search).get('demo') === 'true';
      const hasRTIRLLib = typeof window.RealtimeIRL !== 'undefined';

      // RTIRL connection status
      let rtirlStatus = '❌ Disconnected';
      if (isDemoMode) {
        rtirlStatus = '🎭 Demo Mode Active';
      } else if (!hasRTIRLLib) {
        rtirlStatus = '❌ Library Not Loaded';
      } else if (!CONFIG.rtirl.userId) {
        rtirlStatus = '⚠️ User ID Missing';
      } else {
        switch (connectionState.connectionStatus) {
          case 'connected':
            rtirlStatus = '✅ Connected';
            break;
          case 'connecting':
            rtirlStatus = '🔌 Connecting...';
            break;
          case 'disconnected':
            rtirlStatus = '❌ Disconnected';
            break;
          case 'error':
            rtirlStatus = '💥 Error';
            break;
          default:
            rtirlStatus = '❓ Unknown';
        }
      }

      const statusReport = `
🔍 TRIP OVERLAY STATUS:

🌐 RTIRL Connection:
   Status: ${rtirlStatus}
   User ID: ${CONFIG.rtirl.userId || 'Not Set'}
   Library: ${hasRTIRLLib ? 'Loaded' : 'Missing'}
   Demo Mode: ${isDemoMode ? 'Active' : 'Disabled'}
   Reconnect Attempts: ${connectionState.reconnectAttempts || 0}

📊 Trip Progress:
   Distance Traveled: ${(state.totalDistanceTraveled * unitMultiplier).toFixed(2)} ${unitSuffix}
   Today's Distance: ${(state.todayDistanceTraveled * unitMultiplier).toFixed(2)} ${unitSuffix}
   Remaining Distance: ${(remainingDistance * unitMultiplier).toFixed(2)} ${unitSuffix}
   Progress: ${progressPercent.toFixed(1)}%
   Total Trip Distance: ${(state.originalTotalDistance * unitMultiplier).toFixed(1)} ${unitSuffix}

🚀 Movement Status:
   Current Mode: ${state.currentMode}
   Speed History: ${state.speedHistory.length} readings
   Last Speed: ${state.speedHistory.length > 0 ? state.speedHistory[state.speedHistory.length - 1].toFixed(1) : '0.0'} km/h
   Moving: ${state.currentMode !== 'STATIONARY' && state.speedHistory.length > 0 && state.speedHistory[state.speedHistory.length - 1] > CONFIG.movement.modes.STATIONARY.maxSpeed ? 'Yes' : 'No'}

📍 GPS Status:
   Last Position: ${state.lastPosition ? `${state.lastPosition.lat.toFixed(4)}, ${state.lastPosition.lon.toFixed(4)}` : 'None'}
   RTIRL Last Position: ${connectionState.lastPosition ? `${connectionState.lastPosition.lat.toFixed(4)}, ${connectionState.lastPosition.lon.toFixed(4)}` : 'None'}
   Position History: ${state.positionHistory.length} points
   Last Update: ${state.lastUpdateTime > 0 ? new Date(state.lastUpdateTime).toLocaleTimeString() : 'Never'}

⚙️ Settings:
   Units: ${state.useImperialUnits ? 'Imperial (miles)' : 'Metric (km)'}
   Start Location: ${state.startLocation ? `${state.startLocation.lat.toFixed(4)}, ${state.startLocation.lon.toFixed(4)}` : 'Auto-detect'}

💾 Data Status:
   Last Save: ${state.lastSaveTime > 0 ? new Date(state.lastSaveTime).toLocaleTimeString() : 'Never'}
   Connected: ${connectionState.isConnected ? 'Yes' : 'No'}

💡 Quick Commands:
   - addDistance(km) to add distance
   - setDistance(km) to set total
   - jumpToProgress(%) to jump to percentage
   - resetTodayDistance() to reset today
   - checkRtirlConnection() for connection details
   - showConsoleCommands() for full help
      `;

      console.log(statusReport);

      // Also return the object for programmatic access
      return {
        ...state,
        progressPercent,
        remainingDistance,
        displayUnits: unitSuffix,
        formatted: statusReport,
        rtirl: {
          connected: connectionState.isConnected,
          status: connectionState.connectionStatus,
          userId: CONFIG.rtirl.userId,
          libraryLoaded: hasRTIRLLib,
          demoMode: isDemoMode,
          reconnectAttempts: connectionState.reconnectAttempts,
          lastPosition: connectionState.lastPosition,
        },
      };
    },
  };
}
