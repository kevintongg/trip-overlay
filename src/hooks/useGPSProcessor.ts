import { useEffect, useRef, useCallback } from 'react';
import { useTripProgressStore } from '../store/tripStore';
import { calculateDistance } from '../utils/gps';
import { CONFIG, validateCoordinates } from '../utils/config';
import { logger } from '../utils/logger';
import { speedUpdateService } from '../utils/speedUpdateService';
import type { Coordinates } from '../types/config';
import type { LocationData } from '../types/rtirl';

interface GPSState {
  lastPosition: Coordinates | null;
  lastTimestamp: number;
  lastModeChange: number;
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING';
  modeSwitchTimeout: ReturnType<typeof setTimeout> | null;
  lastThrottleLogTime: number;
  lastProgressLogTime: number;
  lastLoggedProgress: number | null;
  startLocation: Coordinates | null;
}

/**
 * GPS Processing Hook - Converts raw GPS data to robust movement detection
 * Handles speed calculation, mode detection with stability, and store updates
 */
export function useGPSProcessor() {
  const { updateSpeed, setMoving, addDistance, setCurrentMode } = useTripProgressStore();

  const stateRef = useRef<GPSState>({
    lastPosition: null,
    lastTimestamp: 0,
    lastModeChange: 0,
    currentMode: 'STATIONARY',
    modeSwitchTimeout: null,
    lastThrottleLogTime: 0,
    lastProgressLogTime: 0,
    lastLoggedProgress: null,
    startLocation: CONFIG.trip.useAutoStart ? null : CONFIG.trip.manualStartLocation,
  });

  // Calculate speed from GPS positions using Haversine formula
  const _calculateSpeedFromGPS = useCallback(
    (pos1: Coordinates, pos2: Coordinates, timeDeltaMs: number): number => {
      if (timeDeltaMs <= 0) {
        return 0;
      }

      const distanceKm = calculateDistance(pos1, pos2);
      const timeHours = timeDeltaMs / (1000 * 60 * 60);
      return distanceKm / timeHours; // km/h
    },
    []
  );

  // Simple speed-based mode determination (matching original vanilla JS)
  const handleSpeedData = useCallback((speedKmh: number) => {
    if (typeof speedKmh !== 'number' || !isFinite(speedKmh)) {
      return;
    }

    const state = stateRef.current;
    const MOVEMENT_MODES = CONFIG.movement.modes;
    
    let newMode: 'STATIONARY' | 'WALKING' | 'CYCLING' = 'STATIONARY';
    if (speedKmh > MOVEMENT_MODES.WALKING.maxSpeed) {
      newMode = 'CYCLING';
    } else if (speedKmh > MOVEMENT_MODES.STATIONARY.maxSpeed) {
      newMode = 'WALKING';
    }

    if (newMode !== state.currentMode) {
      const isSlowingDown =
        (newMode === 'STATIONARY' && state.currentMode !== 'STATIONARY') ||
        (newMode === 'WALKING' && state.currentMode === 'CYCLING');

      logger(`🔄 GPS: Mode change detected: ${state.currentMode} → ${newMode} (speed: ${speedKmh.toFixed(1)} km/h, slowing: ${isSlowingDown})`);

      if (isSlowingDown) {
        // Apply delay when slowing down to prevent flickering
        if (!state.modeSwitchTimeout) {
          logger(`⏱️ GPS: Starting ${CONFIG.movement.modeSwitchDelay/1000}s delay for mode change to ${newMode}`);
          state.modeSwitchTimeout = setTimeout(() => {
            state.currentMode = newMode;
            setCurrentMode(newMode); // Update Zustand store
            state.modeSwitchTimeout = null;
            logger(`✅ GPS: Mode changed to ${newMode} after delay (speed: ${speedKmh.toFixed(1)} km/h)`);
          }, CONFIG.movement.modeSwitchDelay);
        } else {
          logger(`⏱️ GPS: Mode change delay already active, waiting...`);
        }
      } else {
        // Immediate mode change when speeding up
        if (state.modeSwitchTimeout) {
          clearTimeout(state.modeSwitchTimeout);
          state.modeSwitchTimeout = null;
          logger(`⚡ GPS: Cancelled delayed mode change, switching immediately`);
        }
        state.currentMode = newMode;
        setCurrentMode(newMode); // Update Zustand store
        logger(`✅ GPS: Mode changed to ${newMode} immediately (speed: ${speedKmh.toFixed(1)} km/h)`);
      }
    } else {
      // Same mode, clear any pending timeout
      if (state.modeSwitchTimeout) {
        clearTimeout(state.modeSwitchTimeout);
        state.modeSwitchTimeout = null;
        logger(`🚫 GPS: Cancelled mode change delay (speed settled at ${speedKmh.toFixed(1)} km/h in ${newMode})`);
      }
    }
  }, [setCurrentMode]);

  // Process location update - EXACT match to original vanilla JS logic
  const processLocationUpdate = useCallback(
    (data: LocationData) => {
      const now = Date.now();
      const state = stateRef.current;

      // 1. GPS THROTTLING (CRITICAL - missing from React version)
      const modeConfig = CONFIG.movement.modes[state.currentMode];
      if (now - state.lastTimestamp < modeConfig.gpsThrottle) {
        if (!state.lastThrottleLogTime || now - state.lastThrottleLogTime > 10000) {
          logger.warn('⏱️ Trip: Updates throttled (GPS throttling active)');
          state.lastThrottleLogTime = now;
        }
        return; // CRITICAL: Exit early if throttled
      }

      const previousUpdateTime = state.lastTimestamp;
      state.lastTimestamp = now;

      if (!data) {
        return;
      }

      // 2. Validate coordinates
      const currentPosition: Coordinates = {
        lat: data.latitude,
        lon: data.longitude,
      };

      if (!validateCoordinates(currentPosition)) {
        logger.warn('⚠️ Trip: Invalid GPS coordinates received:', currentPosition);
        return;
      }

      // 3. Handle auto-start location detection (CRITICAL - missing)
      if (CONFIG.trip.useAutoStart && !state.startLocation) {
        if (data.latitude === 0 && data.longitude === 0) {
          logger.warn('⚠️ Trip: Rejecting suspicious 0,0 coordinates for auto-start');
          return;
        }
        state.startLocation = currentPosition;
        state.lastPosition = currentPosition;
        logger(`✅ Trip: Auto-detected start location - ${state.startLocation.lat.toFixed(4)}, ${state.startLocation.lon.toFixed(4)}`);
        return; // CRITICAL: Exit after setting start location
      }

      // 4. CRITICAL CHECK: Need BOTH startLocation AND lastPosition
      if (!state.startLocation || !state.lastPosition) {
        state.lastPosition = currentPosition;
        updateSpeed(0);
        setMoving(false);
        logger('📍 GPS: Initial position set');
        return;
      }

      // 5. Speed calculation (exact match to original)
      const newDistance = calculateDistance(state.lastPosition, currentPosition);
      const timeDiff = Math.max(1, (now - previousUpdateTime) / 1000);
      
      const reportedSpeedMs = data.speed || 0; // meters per second from RTIRL
      const reportedSpeed = reportedSpeedMs * 3.6; // Convert m/s to km/h
      const calculatedSpeed = (newDistance / timeDiff) * 3600; // km/h
      const finalSpeed = Math.max(reportedSpeed, calculatedSpeed);

      // 6. Handle speed data and mode detection
      // Debug logging for movement detection issues
      if (Math.abs(finalSpeed) > 0.1) {
        logger(`🏃 GPS: Speed=${finalSpeed.toFixed(1)}km/h (reported=${reportedSpeed.toFixed(1)}, calculated=${calculatedSpeed.toFixed(1)}) | Current mode: ${state.currentMode}`);
      }
      handleSpeedData(finalSpeed);

      // 7. Store for dashboard compatibility (CRITICAL - missing)
      localStorage.setItem('tripOverlaySpeed', finalSpeed.toFixed(1));
      localStorage.setItem('tripOverlayMode', state.currentMode);
      speedUpdateService.updateSpeed(finalSpeed, state.currentMode);

      // 8. Distance validation using current mode
      const usedModeConfig = CONFIG.movement.modes[state.currentMode];
      const minMovementKm = usedModeConfig.minMovementM / 1000;

      if (newDistance < minMovementKm) {
        state.lastPosition = currentPosition;
        return; // Ignore noise
      }

      // 9. GPS jump detection
      const maxSpeedMs = usedModeConfig.maxSpeed / 3.6;
      const maxReasonableDistance = (timeDiff * maxSpeedMs) / 1000;

      if (newDistance > maxReasonableDistance * 1.5) {
        logger.warn(
          `⚠️ Trip: GPS jump detected in ${state.currentMode} mode: ${newDistance.toFixed(2)}km vs max ${maxReasonableDistance.toFixed(2)}km - ignoring`
        );
        state.lastPosition = currentPosition;
        return;
      }

      // 10. Add distance and smart progress logging (CRITICAL - missing smart logging)
      addDistance(newDistance);
      
      // Get current progress for smart logging
      const { totalTraveledKm, totalDistanceKm, units } = useTripProgressStore.getState();
      const progressPercent = Math.min((totalTraveledKm / totalDistanceKm) * 100, 100);
      
      // Smart logging like original (not every update!)
      const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
      const shouldLogProgress = !isDemoMode || 
        !state.lastProgressLogTime || 
        now - state.lastProgressLogTime > 15000 ||
        Math.floor(progressPercent) !== Math.floor(state.lastLoggedProgress || 0);

      if (shouldLogProgress) {
        const kmToMiles = 0.621371;
        const unitMultiplier = units === 'miles' ? kmToMiles : 1;
        const unitSuffix = units === 'miles' ? 'mi' : 'km';
        logger(
          `📈 Trip: Progress update - +${(newDistance * unitMultiplier).toFixed(4)}${unitSuffix} | Total: ${(totalTraveledKm * unitMultiplier).toFixed(4)}${unitSuffix} | ${progressPercent.toFixed(2)}% | Mode: ${state.currentMode}`
        );
        state.lastProgressLogTime = now;
        state.lastLoggedProgress = progressPercent;
      }

      // 11. Update store with processed values
      updateSpeed(finalSpeed);
      setMoving(finalSpeed > CONFIG.movement.modes.STATIONARY.maxSpeed);

      // 12. Update state for next calculation
      state.lastPosition = currentPosition;
    },
    [
      handleSpeedData,
      updateSpeed,
      setMoving,
      addDistance,
      setCurrentMode,
    ]
  );

  // Set up location update listener
  useEffect(() => {
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
      // Clean up timeout on unmount
      const timeout = stateRef.current.modeSwitchTimeout;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [processLocationUpdate]);

  return {
    getCurrentMode: () => stateRef.current.currentMode,
    getLastPosition: () => stateRef.current.lastPosition,
  };
}
