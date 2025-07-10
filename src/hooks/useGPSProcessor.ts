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
  modeSwitchTimeout: NodeJS.Timeout | null;
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
    modeSwitchTimeout: null,
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

  // Simple speed-based mode determination (matching original vanilla JS)
  const handleSpeedData = useCallback((speedKmh: number) => {
    if (typeof speedKmh !== 'number' || !isFinite(speedKmh)) {
      return;
    }

    const state = stateRef.current;
    const MOVEMENT_MODES = CONFIG.movement.modes;
    
    let newMode: 'STATIONARY' | 'WALKING' | 'CYCLING' = 'STATIONARY';
    if (speedKmh > MOVEMENT_MODES.CYCLING.maxSpeed) {
      newMode = 'CYCLING';
    } else if (speedKmh > MOVEMENT_MODES.WALKING.maxSpeed) {
      newMode = 'CYCLING';
    } else if (speedKmh > MOVEMENT_MODES.STATIONARY.maxSpeed) {
      newMode = 'WALKING';
    }

    if (newMode !== state.currentMode) {
      const isSlowingDown =
        (newMode === 'STATIONARY' && state.currentMode !== 'STATIONARY') ||
        (newMode === 'WALKING' && state.currentMode === 'CYCLING');

      if (isSlowingDown) {
        // Apply delay when slowing down to prevent flickering
        if (!state.modeSwitchTimeout) {
          state.modeSwitchTimeout = setTimeout(() => {
            state.currentMode = newMode;
            state.modeSwitchTimeout = null;
            logger(`🔄 GPS: Mode changed to ${newMode} (speed: ${speedKmh.toFixed(1)} km/h)`);
          }, CONFIG.movement.modeSwitchDelay);
        }
      } else {
        // Immediate mode change when speeding up
        clearTimeout(state.modeSwitchTimeout);
        state.modeSwitchTimeout = null;
        state.currentMode = newMode;
        logger(`🔄 GPS: Mode changed to ${newMode} (speed: ${speedKmh.toFixed(1)} km/h)`);
      }
    }
  }, []);

  // Process location update (simplified to match original vanilla JS)
  const processLocationUpdate = useCallback(
    (data: LocationData) => {
      const now = Date.now();
      const state = stateRef.current;

      // Validate coordinates first
      const currentPosition: Coordinates = {
        lat: data.latitude,
        lon: data.longitude,
      };

      if (!validateCoordinates(currentPosition)) {
        logger.warn('⚠️ GPS: Invalid coordinates, ignoring update:', data);
        return;
      }

      // For initial position or very long gaps, just set position without speed calculation
      if (!state.lastPosition || now - state.lastTimestamp > 30000) {
        state.lastPosition = currentPosition;
        state.lastTimestamp = now;
        updateSpeed(0);
        setMoving(false);
        logger('📍 GPS: Initial position set');
        return;
      }

      const timeDiff = Math.max(1, (now - state.lastTimestamp) / 1000);

      // Calculate distance and speed (matching original vanilla JS)
      const newDistance = calculateDistance(state.lastPosition, currentPosition);
      const reportedSpeed = data.speed || 0;
      const calculatedSpeed = (newDistance / timeDiff) * 3600; // km/h
      const finalSpeed = Math.max(reportedSpeed, calculatedSpeed);

      // Handle speed data and mode detection
      handleSpeedData(finalSpeed);

      // Store for dashboard compatibility
      speedUpdateService.updateSpeed(finalSpeed, state.currentMode);

      // Distance validation (matching original)
      const usedModeConfig = CONFIG.movement.modes[state.currentMode];
      const minMovementKm = usedModeConfig.minMovementM / 1000;

      if (newDistance < minMovementKm) {
        // Update state for next calculation
        state.lastPosition = currentPosition;
        state.lastTimestamp = now;
        return; // Ignore noise
      }

      // GPS jump detection
      const maxSpeedMs = usedModeConfig.maxSpeed / 3.6;
      const maxReasonableDistance = (timeDiff * maxSpeedMs) / 1000;

      if (newDistance > maxReasonableDistance * 1.5) {
        logger.warn(
          `⚠️ GPS: Jump detected in ${state.currentMode} mode: ${newDistance.toFixed(4)}km vs max ${maxReasonableDistance.toFixed(4)}km - ignoring`
        );
      } else {
        // Add distance to trip
        addDistance(newDistance);
        logger(
          `✅ GPS: Added ${newDistance.toFixed(4)} km to trip (speed: ${finalSpeed.toFixed(1)} km/h, mode: ${state.currentMode})`
        );
      }

      // Update store with processed values
      updateSpeed(finalSpeed);
      setMoving(finalSpeed > CONFIG.movement.modes.STATIONARY.maxSpeed);

      // Update state for next calculation
      state.lastPosition = currentPosition;
      state.lastTimestamp = now;
    },
    [
      calculateSpeedFromGPS,
      handleSpeedData,
      updateSpeed,
      setMoving,
      addDistance,
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
      if (stateRef.current.modeSwitchTimeout) {
        clearTimeout(stateRef.current.modeSwitchTimeout);
      }
    };
  }, [processLocationUpdate]);

  return {
    getCurrentMode: () => stateRef.current.currentMode,
    getLastPosition: () => stateRef.current.lastPosition,
  };
}
