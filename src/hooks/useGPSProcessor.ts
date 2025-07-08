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
  const { updateSpeed, setMoving } = useTripProgressStore();

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
      const WALKING_THRESHOLD = 2; // km/h
      // Speed thresholds with hysteresis to prevent rapid mode switching
      if (speed > 8) {
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

      // Validate accuracy - reject poor GPS fixes
      if (data.accuracy && data.accuracy > 50) {
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

      let calculatedSpeed = 0;

      // Use GPS speed if available and reliable (for demo and high-quality GPS)
      if (
        data.speed !== undefined &&
        data.speed !== null &&
        data.source === 'demo'
      ) {
        calculatedSpeed = data.speed;
      } else {
        // Calculate speed from position changes for real GPS
        calculatedSpeed = calculateSpeedFromGPS(
          state.lastPosition,
          newPosition,
          timeDelta
        );
      }

      // Add to speed history for smoothing
      state.speedHistory.push(calculatedSpeed);
      if (state.speedHistory.length > 5) {
        state.speedHistory.shift(); // Keep last 5 readings
      }

      // Smooth speed using median (more robust than average for GPS)
      const sortedSpeeds = [...state.speedHistory].sort((a, b) => a - b);
      const medianIndex = Math.floor(sortedSpeeds.length / 2);
      const smoothedSpeed =
        sortedSpeeds.length % 2 === 0
          ? (sortedSpeeds[medianIndex - 1] + sortedSpeeds[medianIndex]) / 2
          : sortedSpeeds[medianIndex];

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
