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
  speedHistory: number[];
  positionHistory: Array<{ position: Coordinates; timestamp: number }>;
}

/**
 * GPS Processing Hook - Converts raw GPS data to robust movement detection
 * Handles speed calculation, mode detection with stability, and store updates
 */
export function useGPSProcessor() {
  const { updateSpeed, setMoving, addDistance } = useTripProgressStore();

  const stateRef = useRef<GPSState>({
    lastPosition: null,
    lastTimestamp: 0,
    lastModeChange: 0,
    currentMode: 'STATIONARY',
    speedHistory: [],
    positionHistory: [],
  });

  // Calculate speed from GPS positions using Haversine formula
  const calculateSpeedFromGPS = useCallback(
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

  // Mode determination with hysteresis
  const determineMovementMode = useCallback(
    (speed: number, _currentMode: string) => {
      const WALKING_THRESHOLD = 0.5; // km/h - Much more sensitive for walking
      // Realistic speed thresholds for human movement
      if (speed > 8.0) { // 8.0 km/h = 4.9 mph - reasonable cycling threshold
        return 'CYCLING';
      } else if (speed > WALKING_THRESHOLD) {
        return 'WALKING';
      } else {
        return 'STATIONARY';
      }
    },
    []
  );

  // Process location update with robust speed calculation and filtering
  const processLocationUpdate = useCallback(
    (data: LocationData) => {
      const now = Date.now();
      const state = stateRef.current;

      // Validate coordinates first
      const newPosition: Coordinates = {
        lat: data.latitude,
        lon: data.longitude,
      };

      if (!validateCoordinates(newPosition)) {
        logger.warn('⚠️ GPS: Invalid coordinates, ignoring update:', data);
        return;
      }

      // Validate accuracy - reject poor GPS fixes (more aggressive filtering for walking)
      if (data.accuracy && data.accuracy > 20) {
        logger.warn(
          `⚠️ GPS: Poor accuracy (${data.accuracy}m), ignoring update`
        );
        return;
      }

      // For initial position or very long gaps, just set position without speed calculation
      if (!state.lastPosition || now - state.lastTimestamp > 30000) {
        state.lastPosition = newPosition;
        state.lastTimestamp = now;
        state.positionHistory = [{ position: newPosition, timestamp: now }];
        updateSpeed(0);
        setMoving(false);
        logger('📍 GPS: Initial position set');
        return;
      }

      const timeDelta = now - state.lastTimestamp;

      // Skip updates that are too frequent (< 1 second)
      if (timeDelta < 1000) {
        return;
      }

            // Calculate speed like original implementation (use both reported and calculated)
      const reportedSpeed = data.speed || 0;
      const calculatedSpeed = calculateSpeedFromGPS(
        state.lastPosition,
        newPosition,
        timeDelta
      );

      // Use the higher of reported vs calculated speed (like original)
      const finalSpeed = Math.max(reportedSpeed, calculatedSpeed);

      // Log debug info to help troubleshoot
      const distanceM = calculateDistance(state.lastPosition, newPosition) * 1000;
      const distanceKm = distanceM / 1000;
      const speedInfo = reportedSpeed > 0
        ? `RTIRL: ${reportedSpeed.toFixed(1)} km/h`
        : 'RTIRL: no speed data';
      logger(
        `🧮 GPS: Moved ${distanceM.toFixed(1)}m in ${(timeDelta/1000).toFixed(1)}s -> Calc: ${calculatedSpeed.toFixed(2)} km/h, Final: ${finalSpeed.toFixed(2)} km/h (${speedInfo})`
      );

            // Add to speed history for smoothing (longer history for better GPS noise filtering)
      state.speedHistory.push(finalSpeed);
      if (state.speedHistory.length > 10) {
        state.speedHistory.shift(); // Keep last 10 readings for better smoothing
      }

            // Aggressive speed smoothing to filter GPS noise
      let smoothedSpeed = finalSpeed;
      if (state.speedHistory.length >= 3) {
        // Use 25th percentile to be more conservative with speed spikes
        const sortedSpeeds = [...state.speedHistory].sort((a, b) => a - b);
        const percentile25Index = Math.floor(sortedSpeeds.length * 0.25);
        smoothedSpeed = sortedSpeeds[percentile25Index];

        // Log smoothing effect for debugging
        const rawSpeed = finalSpeed;
        const smoothingEffect = Math.abs(rawSpeed - smoothedSpeed);
        if (smoothingEffect > 2) { // Log significant smoothing
          logger(`🎯 GPS: Speed smoothed from ${rawSpeed.toFixed(1)} to ${smoothedSpeed.toFixed(1)} km/h (filtered noise)`);
        }
      }

      // Determine movement mode with hysteresis and time delay
      const newMode = determineMovementMode(smoothedSpeed, state.currentMode);

      // Apply mode switch delay to prevent rapid changes
      const modeChangeDelay = CONFIG.movement.modeSwitchDelay;
      if (newMode !== state.currentMode) {
        if (now - state.lastModeChange >= modeChangeDelay) {
          state.currentMode = newMode;
          state.lastModeChange = now;
          logger(
            `🔄 GPS: Mode changed to ${newMode} (speed: ${smoothedSpeed.toFixed(1)} km/h)`
          );
        } else {
          // Still in delay period, keep current mode
          const remainingDelay = Math.ceil(
            (modeChangeDelay - (now - state.lastModeChange)) / 1000
          );
          logger(`⏱️ GPS: Mode change delayed (${remainingDelay}s remaining)`);
        }
      }

      // Update position history for distance calculation
      state.positionHistory.push({ position: newPosition, timestamp: now });
      if (state.positionHistory.length > 10) {
        state.positionHistory.shift(); // Keep last 10 positions
      }

      // Apply sophisticated distance validation like original implementation
      const usedModeConfig = CONFIG.movement.modes[state.currentMode];
      const minMovementKm = usedModeConfig.minMovementM / 1000;

      // Check minimum movement threshold
      if (distanceKm >= minMovementKm) {
        // Calculate maximum reasonable distance for this time period and mode
        const maxSpeedMs = usedModeConfig.maxSpeed / 3.6; // Convert to m/s
        const maxReasonableDistance = (timeDelta / 1000 * maxSpeedMs) / 1000; // km

        // GPS jump detection - reject unrealistic distances
        if (distanceKm > maxReasonableDistance * 1.5) {
          logger.warn(
            `⚠️ GPS: Jump detected in ${state.currentMode} mode: ${distanceKm.toFixed(4)}km vs max ${maxReasonableDistance.toFixed(4)}km - ignoring`
          );
        } else {
          // Only add distance if we're moving (above stationary threshold)
          if (smoothedSpeed > CONFIG.movement.modes.STATIONARY.maxSpeed) {
            addDistance(distanceKm);
            logger(`✅ GPS: Added ${distanceKm.toFixed(4)} km to trip (speed: ${smoothedSpeed.toFixed(1)} km/h, mode: ${state.currentMode})`);
          }
        }
      }

      // Update store with processed values
      updateSpeed(smoothedSpeed);
      setMoving(smoothedSpeed > CONFIG.movement.modes.STATIONARY.maxSpeed);

      // Update state for next calculation
      state.lastPosition = newPosition;
      state.lastTimestamp = now;

      // Store mode in localStorage for dashboard compatibility using optimized service
      speedUpdateService.updateSpeed(smoothedSpeed, state.currentMode);

      // Log periodic updates
      if (state.positionHistory.length % 10 === 0) {
        logger(
          `📊 GPS: Speed ${smoothedSpeed.toFixed(1)} km/h, Mode: ${state.currentMode}, History: ${state.speedHistory.length} readings`
        );
      }
    },
    [calculateSpeedFromGPS, determineMovementMode, updateSpeed, setMoving]
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
    };
  }, []); // Remove dependencies to prevent stale closures

  return {
    getCurrentMode: () => stateRef.current.currentMode,
    getSpeedHistory: () => stateRef.current.speedHistory,
    getLastPosition: () => stateRef.current.lastPosition,
  };
}
