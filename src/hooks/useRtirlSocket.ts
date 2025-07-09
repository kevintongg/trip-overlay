import { useEffect, useState, useRef } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { logger } from '../utils/logger';
import { CONFIG, validateCoordinates } from '../utils/config';
import type { Coordinates } from '../types/config';
import type { LocationData } from '../types/rtirl';

declare global {
  interface Window {
    RealtimeIRL?: {
      forStreamer: (
        _platform: string,
        _userId: string
      ) => {
        addLocationListener: (_callback: (_data: any) => void) => () => void;
      };
    };
  }
}

interface DemoState {
  updateCount: number;
  lat: number;
  lon: number;
  speed: number;
  mode: 'WALKING' | 'CYCLING' | 'STATIONARY';
}

// Check if demo mode is enabled
const isDemo =
  CONFIG.rtirl.demoMode ||
  new URLSearchParams(window.location.search).get('demo') === 'true';

export function useRtirlSocket() {
  const {
    setConnected,
    setPosition,
    setConnectionStatus,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    isConnected,
    lastPosition,
    connectionStatus,
    reconnectAttempts,
    isDashboardDemoActive,
  } = useConnectionStore();

  const [rtirl, setRtirl] = useState<any>(null);
  const intervalRef = useRef<number | undefined>(undefined);
  const initRef = useRef<boolean>(false);
  const demoStateRef = useRef<DemoState>({
    updateCount: 0,
    lat: 48.2082, // Vienna coordinates for demo
    lon: 16.3738,
    speed: 0,
    mode: 'STATIONARY',
  });

  // Handle location updates from RTIRL
  const handleLocationUpdate = (data: any) => {
    if (!data) {
      logger.warn('📍 Trip: Location is hidden or streamer is offline');
      setConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    // Debug: Log raw RTIRL data structure occasionally
    if (!isDemo && Math.random() < 0.1) {
      // 10% chance to log structure
      logger('🔍 RTIRL raw data structure:', JSON.stringify(data, null, 2));
    }

    // Handle both RTIRL format (nested location) and demo format (flat)
    const latitude = data.latitude || data.location?.latitude;
    const longitude = data.longitude || data.location?.longitude;

    if (latitude === undefined || longitude === undefined) {
      logger.warn('⚠️ Trip: Missing coordinates in location data:', data);
      return;
    }

    // Validate coordinates using centralized validation
    const coordinates: Coordinates = {
      lat: latitude,
      lon: longitude,
    };

    if (!validateCoordinates(coordinates)) {
      logger.warn('⚠️ Trip: Invalid GPS coordinates received:', data);
      return;
    }

    const isFirstConnection = !isConnected;
    if (isFirstConnection) {
      logger('✅ Trip: Streamer location is now live!');
    }

    // Handle speed data - GPS speed often comes in m/s, convert to km/h
    let speedKmh = 0;
    if (data.speed !== undefined && data.speed !== null) {
      if (data.source === 'demo') {
        // Demo data is already in km/h
        speedKmh = data.speed;
      } else {
        // Real GPS data from RTIRL/geolocation APIs is almost always in m/s
        // Convert m/s to km/h: multiply by 3.6
        speedKmh = Math.max(0, data.speed * 3.6);
      }
    }

    if (isDemo) {
      const state = demoStateRef.current;
      if (state.updateCount === 1 || state.updateCount % 5 === 0) {
        logger(
          `🎭 Demo update #${state.updateCount} - ${latitude.toFixed(4)}, ${longitude.toFixed(4)} @ ${speedKmh.toFixed(1)}km/h`
        );
      }
    } else {
      // Log location updates for non-demo mode
      logger(
        `📡 RTIRL: Location update - ${latitude.toFixed(6)}, ${longitude.toFixed(6)} | Speed: ${speedKmh.toFixed(1)} km/h | Accuracy: ${data.accuracy?.toFixed(1) || 'N/A'}m | Time: ${new Date().toLocaleTimeString()}`
      );
    }

    setPosition(coordinates);
    setConnected(true);
    setConnectionStatus('connected');
    resetReconnectAttempts();

    // Dispatch custom event for location update with full data (speed now in km/h)
    const locationData: LocationData = {
      latitude: latitude,
      longitude: longitude,
      accuracy: data.accuracy || 10,
      speed: speedKmh, // Now guaranteed to be in km/h
      timestamp: Date.now(),
      source: isDemo ? 'demo' : 'rtirl',
    };

    window.dispatchEvent(
      new CustomEvent('locationUpdate', { detail: locationData })
    );
  };

  // Demo mode implementation
  // NOTE: Demo mode is now handled by useDashboardDemo hook in the new React-first Dashboard
  // This legacy demo mode is only used for non-dashboard components (like TripOverlay)
  useEffect(() => {
    if (isDemo && !initRef.current) {
      initRef.current = true;
      logger('🎭 RTIRL Demo mode enabled, starting demo data');

      const generateDemoData = () => {
        // Check global flag before each demo update
        if (isDashboardDemoActive) {
          // Dashboard demo is active, stop this demo mode
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
          logger('🛑 RTIRL demo mode stopped - dashboard demo is active');
          return;
        }

        const state = demoStateRef.current;
        state.updateCount++;

        // Simulate movement with varying speed
        const speedVariation = Math.sin(state.updateCount * 0.1) * 5 + 15;
        state.speed = Math.max(0, speedVariation);

        // Move coordinates slightly (simulate cycling)
        const movement = 0.0001; // ~11 meters
        state.lat += (Math.random() - 0.5) * movement;
        state.lon += (Math.random() - 0.5) * movement;

        // Determine mode based on speed
        if (state.speed > 8) {
          state.mode = 'CYCLING';
        } else if (state.speed > 2) {
          state.mode = 'WALKING';
        } else {
          state.mode = 'STATIONARY';
        }

        handleLocationUpdate({
          latitude: state.lat,
          longitude: state.lon,
          accuracy: 5,
          speed: state.speed,
          source: 'demo',
        });
      };

      // Start demo data updates only if dashboard demo is not already active
      if (!isDashboardDemoActive) {
        intervalRef.current = window.setInterval(generateDemoData, 1000); // Match original 1s interval
        generateDemoData(); // Initial update
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      };
    }
  }, [isDemo, isDashboardDemoActive]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, []);

  // Monitor dashboard demo flag and stop RTIRL demo if needed
  useEffect(() => {
    if (!isDemo) {
      return;
    }

    const checkDashboardDemo = () => {
      if (isDashboardDemoActive && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        logger('🛑 RTIRL demo mode stopped - dashboard demo is active');
      }
    };

    // Check every 100ms for dashboard demo activation
    const monitorInterval = setInterval(checkDashboardDemo, 100);

    return () => {
      clearInterval(monitorInterval);
    };
  }, [isDemo, isDashboardDemoActive]);

  // RTIRL connection setup
  useEffect(() => {
    if (isDemo) {
      return;
    }

    if (initRef.current) {
      return;
    }

    initRef.current = true;

    // Check if RTIRL library is loaded
    if (
      !window.RealtimeIRL ||
      typeof window.RealtimeIRL.forStreamer !== 'function'
    ) {
      logger.error('❌ RTIRL library not loaded!');
      setConnectionStatus('error');
      return;
    }

    const initRtirl = async () => {
      try {
        logger('🔌 Connecting to RTIRL...');
        logger('📋 User ID:', CONFIG.rtirl.userId);

        setConnectionStatus('connecting');

        const streamer = window.RealtimeIRL!.forStreamer(
          'twitch',
          CONFIG.rtirl.userId
        );
        const locationListener = streamer.addLocationListener((data: any) => {
          handleLocationUpdate(data);
        });

        setRtirl({ streamer, locationListener });
        resetReconnectAttempts();

        logger('✅ RTIRL listener attached successfully');
      } catch (error) {
        logger.error('❌ Failed to connect to RTIRL:', error);
        setConnectionStatus('error');
        incrementReconnectAttempts();
      }
    };

    initRtirl();

    return () => {
      if (rtirl && rtirl.locationListener) {
        rtirl.locationListener(); // Remove listener
      }
    };
  }, [isDemo]);

  return {
    isConnected,
    lastPosition,
    connectionStatus,
    reconnectAttempts,
    isDemo,
    reconnect: () => {
      if (!isDemo) {
        logger('🔌 Attempting to reconnect...');
        setConnectionStatus('connecting');
        incrementReconnectAttempts();
      }
    },
  };
}
