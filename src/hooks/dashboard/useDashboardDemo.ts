import { useEffect, useCallback, useRef } from 'react';
import { logger } from '../../utils/logger';
import { useConnectionStore } from '../../store/connectionStore';
import { speedUpdateService } from '../../utils/speedUpdateService';
import type { DashboardConfig } from './useDashboardConfig';

/**
 * Dashboard Demo Mode Hook
 * Handles demo mode simulation with Vienna coordinates and speed variation
 * Maintains exact compatibility with original demo logic
 */
export function useDashboardDemo(config: DashboardConfig): void {
  const { setDashboardDemoActive } = useConnectionStore();

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

  // Demo mode implementation (extracted from original)
  useEffect(() => {
    if (!config.demo) {
      // If demo mode is OFF but we have demo data persisting, clean it up
      const hasPersistedDemoData =
        localStorage.getItem('tripOverlaySpeed') ||
        localStorage.getItem('tripOverlayMode');

      if (hasPersistedDemoData) {
        // Clear demo speed data using optimized service
        speedUpdateService.clearSpeedData();

        logger('🧹 Cleaned up persisted demo data from localStorage');
      }

      // Ensure global flag is cleared when not in demo mode
      setDashboardDemoActive(false);
      return;
    }

    // Set global flag to prevent useRtirlSocket demo mode
    setDashboardDemoActive(true);

    throttledLog(
      'demo',
      1000,
      '🎭 Dashboard: Starting demo mode with Vienna coordinates'
    );

    let updateCount = 0;
    const demoState = {
      lat: 48.2082, // Vienna coordinates - kept static for weather API efficiency
      lon: 16.3738,
      speed: 15.5,
    };

    const demoInterval = setInterval(() => {
      updateCount++;

      // Simulate varying speed
      const speedVariation = Math.sin(updateCount * 0.1) * 5 + 15;
      demoState.speed = Math.max(0, speedVariation);

      // Move coordinates slightly (simulate cycling)
      // NOTE: Keep movement small and rounded to prevent weather API cache busting
      const movement = 0.0001; // ~11 meters
      const latMovement = (Math.random() - 0.5) * movement;
      const lonMovement = (Math.random() - 0.5) * movement;

      // Round to 3 decimal places to prevent excessive weather API calls
      demoState.lat = Math.round((48.2082 + latMovement) * 1000) / 1000;
      demoState.lon = Math.round((16.3738 + lonMovement) * 1000) / 1000;

      // Store demo speed using optimized service
      speedUpdateService.updateSpeed(demoState.speed, 'CYCLING');

      // Dispatch location update event
      const locationData = {
        latitude: demoState.lat,
        longitude: demoState.lon,
        accuracy: 5,
        speed: demoState.speed,
        timestamp: Date.now(),
        source: 'demo',
      };

      window.dispatchEvent(
        new CustomEvent('locationUpdate', { detail: locationData })
      );

      if (updateCount === 1 || updateCount % 10 === 0) {
        throttledLog(
          'demo',
          5000,
          `🎭 Demo update #${updateCount} - ${demoState.lat.toFixed(4)}, ${demoState.lon.toFixed(4)} @ ${demoState.speed.toFixed(1)}km/h`
        );
      }
    }, 1000);

    return () => {
      clearInterval(demoInterval);
      // Clear the global flag when demo mode stops
      setDashboardDemoActive(false);

      // Clear demo speed data using optimized service
      speedUpdateService.clearSpeedData();

      logger('🛑 Demo mode stopped - cleared speed data');
    };
  }, [config.demo, throttledLog, setDashboardDemoActive]);
}
