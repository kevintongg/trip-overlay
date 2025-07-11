import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';

export interface SpeedDisplay {
  speedKmh: string;
  speedMph: string;
  currentSpeed: number;
  currentMode: string;
  clearSpeedDisplay: () => void;
}

/**
 * Speed Display Hook
 * Handles speed data from localStorage and provides formatted display values
 * Maintains exact compatibility with original speed logic
 */
export function useSpeedDisplay(): SpeedDisplay {
  const [speedMph, setSpeedMph] = useState('--');
  const [speedKmh, setSpeedKmh] = useState('--');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentMode, setCurrentMode] = useState('STATIONARY');

  // Throttling ref to prevent spam
  const lastLogTime = useRef<{ [key: string]: number }>({});

  // Throttled logger function (extracted from original)
  const throttledLog = useCallback(
    (key: string, throttleMs: number, message: string, ...args: unknown[]) => {
      const now = Date.now();
      if (now - (lastLogTime.current[key] || 0) > throttleMs) {
        lastLogTime.current[key] = now;
        logger(message, ...args);
      }
    },
    []
  );

  // Clear speed display storage (like vanilla JS clearSpeedDisplayStorage)
  const clearSpeedDisplay = useCallback(() => {
    localStorage.removeItem('tripOverlaySpeed');
    localStorage.removeItem('tripOverlayMode');
    setCurrentSpeed(0);
    setCurrentMode('STATIONARY');
    setSpeedKmh('--');
    setSpeedMph('--');
    
    throttledLog(
      'speed',
      3000,
      '🚴 Dashboard: Speed display cleared (location hidden or offline)'
    );
  }, [throttledLog]);

  // Read speed from localStorage (extracted from original)
  const updateSpeedFromStorage = useCallback(() => {
    const speedStr = localStorage.getItem('tripOverlaySpeed');
    const mode = localStorage.getItem('tripOverlayMode') || 'STATIONARY';

    // If no speed data exists (cleared or never set), show '--'
    if (!speedStr) {
      setCurrentSpeed(0);
      setCurrentMode('STATIONARY');
      setSpeedKmh('--');
      setSpeedMph('--');

      throttledLog(
        'speed',
        3000,
        '🚴 Dashboard: No speed data - displaying default values'
      );
      return;
    }

    const speed = parseFloat(speedStr) || 0;

    // Only log when there's an actual change to prevent spam
    if (mode !== currentMode || Math.abs(speed - currentSpeed) > 0.1) {
      throttledLog(
        'speed',
        3000,
        `🚴 Dashboard: Speed from localStorage - ${speed.toFixed(1)} km/h, mode: ${mode}`
      );
    }

    setCurrentSpeed(speed);
    setCurrentMode(mode);

    if (speed > 0) {
      setSpeedKmh(speed.toFixed(1));
      setSpeedMph((speed * 0.621371).toFixed(1));
    } else {
      setSpeedKmh('0.0');
      setSpeedMph('0.0');
    }
  }, [throttledLog, currentMode, currentSpeed]);

  // Set up localStorage monitoring (extracted from original)
  useEffect(() => {
    // Update speed immediately
    updateSpeedFromStorage();

    // Listen for localStorage changes (when trip-progress updates the speed)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'tripOverlaySpeed' || event.key === 'tripOverlayMode') {
        updateSpeedFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also poll localStorage periodically as fallback (in case storage events don't fire)
    const pollInterval = setInterval(updateSpeedFromStorage, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [updateSpeedFromStorage]);

  return {
    speedKmh,
    speedMph,
    currentSpeed,
    currentMode,
    clearSpeedDisplay, // Expose for location hidden scenarios
  };
}
