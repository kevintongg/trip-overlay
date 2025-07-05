// RTIRL Integration Module
// Centralized RTIRL connection and location data handling

import { CONFIG, isDemoMode } from './config.js';
import { logger } from './logger.js';

// RTIRL state management
const rtirtState = {
  isConnected: false,
  lastPosition: null,
  locationListener: null,
  callbacks: new Set(),
  demoTimer: null,
  demoModeActive: false,
};

// Location data structure
export const createLocationUpdate = (data, source = 'rtirl') => ({
  latitude: data.latitude,
  longitude: data.longitude,
  accuracy: data.accuracy,
  speed: data.speed || data.kmh,
  timestamp: Date.now(),
  source,
});

// Initialize RTIRL connection
export const initRTIRL = (options = {}) => {
  const {
    onLocationUpdate = null,
    onConnectionChange = null,
    moduleName = 'RTIRL',
  } = options;

  if (onLocationUpdate) {
    rtirtState.callbacks.add(onLocationUpdate);
  }

  if (isDemoMode()) {
    logger(`🎭 ${moduleName}: Demo mode enabled, starting demo data`);
    startDemoMode(moduleName);
    return { success: true, demo: true };
  }

  if (!window.RealtimeIRL) {
    logger.error(`❌ ${moduleName}: RTIRL library not loaded!`);
    if (onConnectionChange) {
      onConnectionChange(false, 'Library not loaded');
    }
    return { success: false, error: 'Library not loaded' };
  }

  try {
    logger(`🔌 ${moduleName}: Connecting to RTIRL...`);
    logger(`📋 ${moduleName}: User ID:`, CONFIG.rtirl.userId);

    const streamer = RealtimeIRL.forStreamer('twitch', CONFIG.rtirl.userId);

    // Create location handler that distributes to all callbacks
    const locationHandler = data => {
      handleLocationData(data, moduleName);
    };

    rtirtState.locationListener = streamer.addLocationListener(locationHandler);

    logger(`✅ ${moduleName}: RTIRL listener attached successfully`);

    if (onConnectionChange) {
      onConnectionChange(true, 'Connecting...');
    }

    return { success: true, demo: false };
  } catch (error) {
    logger.error(`❌ ${moduleName}: Failed to connect to RTIRL:`, error);
    if (onConnectionChange) {
      onConnectionChange(false, 'Connection failed');
    }
    return { success: false, error: error.message };
  }
};

// Handle incoming location data and distribute to callbacks
const handleLocationData = (data, moduleName = 'RTIRL') => {
  if (!data) {
    if (rtirtState.isConnected) {
      logger.warn(
        `📍 ${moduleName}: Location is hidden or streamer is offline`
      );
      rtirtState.isConnected = false;
      notifyCallbacks(null, 'hidden');
    }
    return;
  }

  // Log connection status change
  if (!rtirtState.isConnected) {
    logger(`✅ ${moduleName}: Streamer location is now live!`);
    rtirtState.isConnected = true;
  }

  // Update state
  rtirtState.lastPosition = {
    lat: data.latitude,
    lon: data.longitude,
  };

  // Create standardized location update
  const locationUpdate = createLocationUpdate(data);

  const accuracyStr =
    typeof data.accuracy === 'number' && data.accuracy !== null
      ? ` (accuracy: ${data.accuracy}m)`
      : '';
  logger(
    `📡 ${moduleName}: Location received - ${data.latitude?.toFixed(4) || 'N/A'}, ${data.longitude?.toFixed(4) || 'N/A'}${accuracyStr}`
  );

  // Distribute to all registered callbacks
  notifyCallbacks(locationUpdate, 'update');
};

// Notify all registered callbacks
const notifyCallbacks = (locationUpdate, type) => {
  rtirtState.callbacks.forEach(callback => {
    try {
      callback(locationUpdate, type);
    } catch (error) {
      logger.error('Error in RTIRL callback:', error);
    }
  });
};

// Register a callback for location updates
export const addLocationCallback = callback => {
  rtirtState.callbacks.add(callback);
  return () => rtirtState.callbacks.delete(callback); // Return unsubscribe function
};

// Remove a callback
export const removeLocationCallback = callback => {
  return rtirtState.callbacks.delete(callback);
};

// Get current connection state
export const getConnectionState = () => ({
  isConnected: rtirtState.isConnected,
  lastPosition: rtirtState.lastPosition,
  isDemoMode: rtirtState.demoModeActive,
});

// Demo mode implementation
const startDemoMode = (moduleName = 'RTIRL') => {
  rtirtState.demoModeActive = true;
  let demoLat = 48.209; // Vienna
  let demoLon = 16.3531;
  let demoSpeed = 0;
  let speedDirection = 1;

  let updateCount = 0;

  const generateDemoData = () => {
    // Simulate movement
    demoLat += (Math.random() - 0.5) * 0.0001;
    demoLon += (Math.random() - 0.5) * 0.0001;

    // Vary speed for different movement modes
    demoSpeed += (Math.random() - 0.5) * 5 * speedDirection;
    demoSpeed = Math.max(0, Math.min(40, demoSpeed));

    if (demoSpeed <= 1 || demoSpeed >= 35) {
      speedDirection *= -1;
    }

    const demoData = {
      latitude: demoLat,
      longitude: demoLon,
      accuracy: 10 + Math.random() * 5,
      speed: demoSpeed,
      kmh: demoSpeed,
    };

    // Only log every 5th update to reduce console spam
    updateCount++;
    if (updateCount === 1 || updateCount % 5 === 0) {
      logger(
        `🎭 ${moduleName}: Demo update #${updateCount} - ${demoLat.toFixed(4)}, ${demoLon.toFixed(4)} @ ${demoSpeed.toFixed(1)}km/h`
      );
    }

    handleLocationData(demoData, moduleName);
  };

  // Start demo data generation
  generateDemoData(); // Immediate first update
  rtirtState.demoTimer = setInterval(generateDemoData, 10000); // Reduced from 3s to 10s
};

// Stop demo mode
export const stopDemoMode = () => {
  if (rtirtState.demoTimer) {
    clearInterval(rtirtState.demoTimer);
    rtirtState.demoTimer = null;
  }
  rtirtState.demoModeActive = false;
};

// Cleanup function
export const cleanup = () => {
  if (rtirtState.locationListener) {
    rtirtState.locationListener();
    rtirtState.locationListener = null;
  }

  stopDemoMode();
  rtirtState.callbacks.clear();
  rtirtState.isConnected = false;
  rtirtState.lastPosition = null;
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
