// --- CONFIGURATION ---
// SMART MOVEMENT DETECTION:
// This script automatically detects movement type based on speed.
// No manual configuration (like WALKING_MODE) is needed.

// Import centralized configuration and RTIRL module
import {
  CONFIG,
  getURLParam,
  isDemoMode,
  validateDistance,
  validateCoordinates,
  sanitizeUIValue,
} from '../utils/config.js';
import { calculateDistance } from '../utils/gps.js';
import { initRTIRL, addLocationCallback } from '../utils/rtirl.js';
import { logger } from '../utils/logger.js';

// Get configuration from centralized config
const MOVEMENT_MODES = CONFIG.movement.modes;
const MODE_SWITCH_DELAY = CONFIG.movement.modeSwitchDelay;
const UI_UPDATE_DEBOUNCE = CONFIG.performance.uiUpdateDebounce;
const SAVE_DEBOUNCE_DELAY = CONFIG.performance.saveDebounceDelay;
const USE_AUTO_START = CONFIG.trip.useAutoStart;
const MANUAL_START_LOCATION = CONFIG.trip.manualStartLocation;

const appState = {
  lastSaveTime: 0,
  uiUpdateScheduled: false,
  uiUpdateTimeout: null,
  isConnected: false,
  useImperialUnits: false,
  originalTotalDistance: CONFIG.trip.totalDistanceKm,
  currentMode: 'STATIONARY',
  modeSwitchTimeout: null,
  demoTimer: null,
  totalDistanceTraveled: 0,
  todayDistanceTraveled: 0,
  lastPosition: null,
  lastUpdateTime: 0,
  startLocation: USE_AUTO_START ? null : MANUAL_START_LOCATION,
  // Logging throttle state
  lastThrottleLogTime: 0,
  lastLoggedSpeed: null,
  lastProgressLogTime: 0,
  lastLoggedProgress: null,
};

const domElements = {
  traveled: null,
  remaining: null,
  today: null,
  progressBar: null,
  avatar: null,
  controlPanel: null,
  feedback: null,
};

function initializeDOMCache() {
  domElements.traveled = document.getElementById('distance-traveled');
  domElements.remaining = document.getElementById('distance-remaining');
  domElements.today = document.getElementById('distance-today');
  domElements.progressBar = document.getElementById('progress-bar-traveled');
  domElements.avatar = document.getElementById('avatar');
  domElements.controlPanel = document.getElementById('control-panel');
  domElements.feedback = document.getElementById('action-feedback');
}

function updateDisplayElements() {
  if (appState.uiUpdateTimeout) {
    clearTimeout(appState.uiUpdateTimeout);
  }

  appState.uiUpdateTimeout = setTimeout(() => {
    if (appState.uiUpdateScheduled) {
      return;
    }

    appState.uiUpdateScheduled = true;
    requestAnimationFrame(() => {
      const distanceRemaining = Math.max(
        0,
        appState.originalTotalDistance - appState.totalDistanceTraveled
      );
      const progressPercent =
        appState.originalTotalDistance > 0
          ? Math.min(
              100,
              (appState.totalDistanceTraveled /
                appState.originalTotalDistance) *
                100
            )
          : 0;

      const kmToMiles = 0.621371;
      const unitMultiplier = appState.useImperialUnits ? kmToMiles : 1;
      const unitSuffix = appState.useImperialUnits ? ' mi' : ' km';

      if (domElements.traveled) {
        domElements.traveled.textContent =
          (
            sanitizeUIValue(appState.totalDistanceTraveled) * unitMultiplier
          ).toFixed(2) + unitSuffix;
      }
      if (domElements.remaining) {
        domElements.remaining.textContent =
          (sanitizeUIValue(distanceRemaining) * unitMultiplier).toFixed(2) +
          unitSuffix;
      }
      if (domElements.today) {
        domElements.today.textContent =
          (
            sanitizeUIValue(appState.todayDistanceTraveled) * unitMultiplier
          ).toFixed(2) + unitSuffix;
      }
      if (domElements.progressBar) {
        domElements.progressBar.style.width = `${progressPercent}%`;
      }
      if (domElements.avatar) {
        domElements.avatar.style.left = `${progressPercent}%`;
      }
      // Set % completion text
      const percentEl = document.getElementById('progress-percent');
      if (percentEl) {
        percentEl.textContent = `${progressPercent.toFixed(1)}%`;
      }

      appState.uiUpdateScheduled = false;
      appState.uiUpdateTimeout = null;
    });
  }, UI_UPDATE_DEBOUNCE);
}

function connectToRtirl() {
  logger('⚙️ Trip: Movement detection enabled');
  logger(
    `📡 Trip: GPS throttling - STATIONARY:${MOVEMENT_MODES.STATIONARY.gpsThrottle}ms, WALKING:${MOVEMENT_MODES.WALKING.gpsThrottle}ms, CYCLING:${MOVEMENT_MODES.CYCLING.gpsThrottle}ms`
  );

  // Register callback for location updates
  addLocationCallback((locationUpdate, type) => {
    if (type === 'hidden') {
      if (appState.isConnected) {
        logger.warn('📍 Trip: Location is hidden or streamer is offline');
        showFeedback('🔌 RTIRL location hidden', 'warning');
      }
      appState.isConnected = false;
      return;
    }

    if (locationUpdate) {
      handleRtirtData(locationUpdate);
    }
  });

  // Initialize RTIRL connection
  const result = initRTIRL({
    moduleName: 'Trip',
    onConnectionChange: (connected, status) => {
      if (connected) {
        showFeedback('🔌 Connecting to RTIRL...', 'warning');
      } else {
        showFeedback(`❌ ${status || 'RTIRL connection failed'}`, 'error');
      }
    },
  });

  if (!result.success && !result.demo) {
    showFeedback(`❌ ${result.error || 'RTIRL connection failed'}`, 'error');
  }
}

const debouncedSave = (() => {
  let timeoutId;
  return function () {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      savePersistedData();
      appState.lastSaveTime = Date.now();
    }, SAVE_DEBOUNCE_DELAY);
  };
})();

function handleSpeedData(speedKmh) {
  if (typeof speedKmh !== 'number' || !isFinite(speedKmh)) {
    return;
  }

  let newMode = 'STATIONARY';
  if (speedKmh > MOVEMENT_MODES.CYCLING.maxSpeed) {
    newMode = 'CYCLING'; // Or a 'VEHICLE' mode if defined
  } else if (speedKmh > MOVEMENT_MODES.WALKING.maxSpeed) {
    newMode = 'CYCLING';
  } else if (speedKmh > MOVEMENT_MODES.STATIONARY.maxSpeed) {
    newMode = 'WALKING';
  }

  if (newMode !== appState.currentMode) {
    const isSlowingDown =
      (newMode === 'STATIONARY' && appState.currentMode !== 'STATIONARY') ||
      (newMode === 'WALKING' && appState.currentMode === 'CYCLING');

    if (isSlowingDown) {
      if (!appState.modeSwitchTimeout) {
        appState.modeSwitchTimeout = setTimeout(() => {
          setMovementMode(newMode);
          appState.modeSwitchTimeout = null;
        }, MODE_SWITCH_DELAY);
      }
    } else {
      clearTimeout(appState.modeSwitchTimeout);
      appState.modeSwitchTimeout = null;
      setMovementMode(newMode);
    }
  } else {
    clearTimeout(appState.modeSwitchTimeout);
    appState.modeSwitchTimeout = null;
  }
}

function setMovementMode(mode) {
  if (appState.currentMode === mode) {
    return;
  }

  // Log mode change
  logger(`MODE CHANGE: ${appState.currentMode} → ${mode}`);

  appState.currentMode = mode;
  const modeConfig = MOVEMENT_MODES[mode];

  if (domElements.avatar) {
    // Compare only the path/filename, not the full URL
    const currentAvatar = domElements.avatar.src.split('/').slice(-2).join('/');
    const newAvatar = modeConfig.avatar;
    if (currentAvatar !== newAvatar) {
      domElements.avatar.src = newAvatar;
      logger(`AVATAR UPDATE: Set to ${mode} avatar (${modeConfig.avatar})`);
    }
  }

  logger(`🏃‍♂️ Movement mode changed to: ${mode}`);
  showFeedback(`Mode: ${mode}`, 'info', 2000);
}

function handleRtirtData(locationUpdate) {
  const now = Date.now();
  const modeConfig = MOVEMENT_MODES[appState.currentMode];

  if (now - appState.lastUpdateTime < modeConfig.gpsThrottle) {
    if (
      !appState.lastThrottleLogTime ||
      now - appState.lastThrottleLogTime > 10000
    ) {
      logger.warn('⏱️ Trip: Updates throttled (GPS throttling active)');
      appState.lastThrottleLogTime = now;
    }
    return;
  }

  const previousUpdateTime = appState.lastUpdateTime;
  appState.lastUpdateTime = now;

  if (!locationUpdate) {
    return;
  }

  const isFirstConnection = !appState.isConnected;
  if (!appState.isConnected) {
    logger('✅ Trip: Streamer location is now live!');
    showFeedback('✅ Streamer is live!', 'success');
    appState.isConnected = true;
  }

  const currentPosition = {
    lat: locationUpdate.latitude,
    lon: locationUpdate.longitude,
  };

  if (!validateCoordinates(currentPosition)) {
    logger.warn('⚠️ Trip: Invalid GPS coordinates received:', currentPosition);
    return;
  }

  if (USE_AUTO_START && !appState.startLocation) {
    if (locationUpdate.latitude === 0 && locationUpdate.longitude === 0) {
      logger.warn(
        '⚠️ Trip: Rejecting suspicious 0,0 coordinates for auto-start'
      );
      return;
    }
    appState.startLocation = currentPosition;
    appState.lastPosition = currentPosition;
    logger(
      `✅ Trip: Auto-detected start location - ${appState.startLocation.lat.toFixed(4)}, ${appState.startLocation.lon.toFixed(4)}`
    );
    debouncedSave();
    return;
  }

  if (appState.startLocation && appState.lastPosition) {
    const newDistance = calculateDistance(
      appState.lastPosition,
      currentPosition
    );
    const timeDiff = Math.max(1, (now - previousUpdateTime) / 1000);

    // --- Simplified Speed Calculation ---
    const reportedSpeed = locationUpdate.speed || 0;
    const calculatedSpeed = (newDistance / timeDiff) * 3600; // km/h
    const finalSpeed = Math.max(reportedSpeed, calculatedSpeed);
    appState.currentSpeedKmh = finalSpeed; // Expose calculated speed

    if (isFirstConnection) {
      logger(
        `📡 Trip: Location received - ${locationUpdate.latitude?.toFixed(4)}, ${locationUpdate.longitude?.toFixed(4)}`
      );
      logger(
        `🧮 Trip: Initial speed check - Reported: ${reportedSpeed.toFixed(1)} km/h, Calculated: ${calculatedSpeed.toFixed(1)} km/h -> Using: ${finalSpeed.toFixed(1)} km/h`
      );
    }

    handleSpeedData(finalSpeed);
    localStorage.setItem('tripOverlaySpeed', finalSpeed.toFixed(1));
    localStorage.setItem('tripOverlayMode', appState.currentMode);

    const usedModeConfig = MOVEMENT_MODES[appState.currentMode];
    const minMovementKm = usedModeConfig.minMovementM / 1000;

    if (newDistance < minMovementKm) {
      return; // Ignore noise
    }

    const maxSpeedMs = usedModeConfig.maxSpeed / 3.6;
    const maxReasonableDistance = (timeDiff * maxSpeedMs) / 1000;

    if (newDistance > maxReasonableDistance * 1.5) {
      logger.warn(
        `⚠️ Trip: GPS jump detected in ${appState.currentMode} mode: ${newDistance.toFixed(2)}km vs max ${maxReasonableDistance.toFixed(2)}km - ignoring`
      );
      return;
    }

    appState.totalDistanceTraveled += newDistance;
    appState.todayDistanceTraveled += newDistance;

    const isInDemoMode = isDemoMode();
    const progressPercent =
      (appState.totalDistanceTraveled / appState.originalTotalDistance) * 100;
    const shouldLogProgress =
      !isInDemoMode ||
      !appState.lastProgressLogTime ||
      now - appState.lastProgressLogTime > 15000 ||
      Math.floor(progressPercent) !==
        Math.floor(appState.lastLoggedProgress || 0);

    if (shouldLogProgress) {
      const kmToMiles = 0.621371;
      const unitMultiplier = appState.useImperialUnits ? kmToMiles : 1;
      const units = appState.useImperialUnits ? 'mi' : 'km';
      logger(
        `📈 Trip: Progress update - +${(newDistance * unitMultiplier).toFixed(4)}${units} | Total: ${(appState.totalDistanceTraveled * unitMultiplier).toFixed(4)}${units} | ${progressPercent.toFixed(2)}% | Mode: ${appState.currentMode}`
      );
      appState.lastProgressLogTime = now;
      appState.lastLoggedProgress = progressPercent;
    }

    updateDisplayElements();
    debouncedSave();
  }

  appState.lastPosition = currentPosition;
}

// --- PERSISTENCE ---

function shouldResetTodayDistance(savedDate, lastActiveTime) {
  const now = new Date();
  if (!savedDate || savedDate === now.toDateString()) {
    return false;
  }
  if (lastActiveTime) {
    const hoursSinceLastActive = (now - new Date(lastActiveTime)) / 36e5;
    if (hoursSinceLastActive < 6) {
      return false;
    }
  }
  return true;
}

function loadPersistedData() {
  try {
    const saved = localStorage.getItem('trip-overlay-data');
    if (!saved) {
      return;
    }
    const data = JSON.parse(saved);
    appState.totalDistanceTraveled = validateDistance(
      data.totalDistanceTraveled
    );
    if (!shouldResetTodayDistance(data.date, data.lastActiveTime)) {
      appState.todayDistanceTraveled = validateDistance(
        data.todayDistanceTraveled
      );
    } else {
      appState.todayDistanceTraveled = 0;
      logger('Daily distance reset - new travel day detected');
    }
    if (USE_AUTO_START && validateCoordinates(data.autoStartLocation)) {
      appState.startLocation = data.autoStartLocation;
    }
    if (typeof data.useImperialUnits !== 'undefined') {
      appState.useImperialUnits = data.useImperialUnits;
    }
  } catch (e) {
    logger.error('Failed to load persisted data:', e);
  }
}

function savePersistedData() {
  try {
    const data = {
      totalDistanceTraveled: appState.totalDistanceTraveled,
      todayDistanceTraveled: appState.todayDistanceTraveled,
      date: new Date().toDateString(),
      lastActiveTime: new Date().toISOString(),
      autoStartLocation:
        USE_AUTO_START && validateCoordinates(appState.startLocation)
          ? appState.startLocation
          : null,
      useImperialUnits: appState.useImperialUnits,
    };
    localStorage.setItem('trip-overlay-data', JSON.stringify(data));
  } catch (e) {
    logger.error('Failed to save trip data:', e);
  }
}

function showFeedback(message, type = 'success', duration = 3000) {
  const feedback =
    domElements.feedback || document.getElementById('action-feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    setTimeout(() => {
      feedback.textContent = '';
      feedback.className = 'feedback';
    }, duration);
  }
}

// --- CONTROLS ---
function resetTripProgress() {
  localStorage.removeItem('trip-overlay-data');
  appState.totalDistanceTraveled = 0;
  appState.todayDistanceTraveled = 0;
  appState.startLocation = USE_AUTO_START ? null : MANUAL_START_LOCATION;
  appState.lastPosition = null;
  appState.lastUpdateTime = 0;
  appState.useImperialUnits = false;
  // Demo mode is now handled by the RTIRL module
  updateDisplayElements();
  showFeedback('✅ Trip reset complete!', 'success');
}

function resetAutoStartLocation() {
  appState.startLocation = null;
  appState.lastPosition = null;
  savePersistedData();
  showFeedback('✅ Start location will re-detect', 'success');
}

function resetTodayDistance() {
  appState.todayDistanceTraveled = 0;
  updateDisplayElements();
  savePersistedData();
  showFeedback("✅ Today's distance reset", 'success');
}

function exportTripData() {
  try {
    const data = {
      totalDistanceTraveled: appState.totalDistanceTraveled,
      todayDistanceTraveled: appState.todayDistanceTraveled,
      date: new Date().toDateString(),
      lastActiveTime: new Date().toISOString(),
      autoStartLocation:
        USE_AUTO_START && validateCoordinates(appState.startLocation)
          ? appState.startLocation
          : null,
      useImperialUnits: appState.useImperialUnits,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trip-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showFeedback('✅ Backup downloaded!', 'success');
  } catch (e) {
    logger.error('❌ Backup failed:', e);
    showFeedback('❌ Backup failed', 'error');
  }
}

function importTripData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    appState.totalDistanceTraveled = validateDistance(
      data.totalDistanceTraveled
    );
    appState.todayDistanceTraveled = validateDistance(
      data.todayDistanceTraveled
    );
    if (USE_AUTO_START && validateCoordinates(data.autoStartLocation)) {
      appState.startLocation = data.autoStartLocation;
    }
    if (typeof data.useImperialUnits !== 'undefined') {
      appState.useImperialUnits = data.useImperialUnits;
    }
    updateDisplayElements();
    savePersistedData();
    showFeedback('✅ Data imported successfully!', 'success');
    logger('CONSOLE: Trip data imported.');
  } catch (e) {
    logger.error('CONSOLE: Failed to parse or apply import data:', e);
    showFeedback('❌ Failed to import data', 'error');
  }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initializeDOMCache();
  loadPersistedData();
  checkURLParameters();
  updateDisplayElements();
  connectToRtirl();
  setupHotkeys();
  setupConsoleCommands();
});

function checkURLParameters() {
  const paramHandlers = {
    controls: value => {
      if (value === 'true') {
        const panel =
          domElements.controlPanel || document.getElementById('control-panel');
        if (panel) {
          panel.style.display = 'flex';
        }
      }
    },
    reset: value => {
      logger('URL parameter triggered: reset =', value);
      switch (value) {
        case 'trip':
          resetTripProgress();
          break;
        case 'today':
          resetTodayDistance();
          break;
        case 'location':
          resetAutoStartLocation();
          break;
        default:
          logger.warn('Unknown reset parameter:', value);
      }
    },
    resets: value => {
      const resetTypes = value.split(',');
      logger('URL parameter triggered: multiple resets =', resetTypes);
      resetTypes.forEach(type => {
        switch (type.trim()) {
          case 'trip':
            resetTripProgress();
            break;
          case 'today':
            resetTodayDistance();
            break;
          case 'location':
            resetAutoStartLocation();
            break;
          default:
            logger.warn('Unknown reset type in multiple resets:', type);
        }
      });
    },
    export: value => {
      if (value === 'true') {
        logger('URL parameter triggered: exportTripData()');
        setTimeout(exportTripData, 1000);
      }
    },
    import: value => {
      try {
        // Validate input length to prevent DoS
        if (value.length > 10000) {
          logger.warn('Import data too large (>10KB), ignoring');
          return;
        }

        const decodedData = decodeURIComponent(value);

        // Basic JSON validation
        JSON.parse(decodedData);

        logger('URL parameter triggered: importTripData()');
        importTripData(decodedData);
      } catch (error) {
        logger.error('Failed to import data from URL parameter:', error);
        logger.warn('Import data must be valid URL-encoded JSON');
      }
    },
    units: value => {
      if (value === 'miles') {
        convertToMiles();
      } else if (value === 'km') {
        convertToKilometers();
      }
    },
    totalDistance: value => {
      const distance = parseFloat(value);
      if (isFinite(distance) && distance > 0 && distance <= 50000) {
        setTotalDistance(distance);
      } else {
        logger.warn(
          'Invalid totalDistance parameter:',
          value,
          '(must be 0-50000)'
        );
      }
    },
    addDistance: value => {
      const distance = parseFloat(value);
      if (isFinite(distance) && distance >= -10000 && distance <= 10000) {
        addDistance(distance);
      } else {
        logger.warn(
          'Invalid addDistance parameter:',
          value,
          '(must be -10000 to 10000)'
        );
      }
    },
    setDistance: value => {
      const distance = parseFloat(value);
      if (isFinite(distance) && distance >= 0 && distance <= 50000) {
        setDistance(distance);
      } else {
        logger.warn(
          'Invalid setDistance parameter:',
          value,
          '(must be 0-50000)'
        );
      }
    },
    jumpTo: value => {
      const percentage = parseFloat(value);
      if (isFinite(percentage) && percentage >= 0 && percentage <= 100) {
        jumpToProgress(percentage);
      } else {
        logger.warn('Invalid jumpTo parameter:', value, '(must be 0-100)');
      }
    },
    stream: value => {
      if (value === 'true') {
        setTimeout(() => {
          showFeedback(
            '🏍️ Stream Mode: Press Ctrl+H for controls | Ctrl+Shift+R for daily reset',
            'success',
            6000
          );
        }, 2000);
        logger('🎥 Stream Mode enabled - controls available via Ctrl+H hotkey');
      }
    },
    setTodayDistance: value => {
      const distance = parseFloat(value);
      if (isFinite(distance) && distance >= 0 && distance <= 1000) {
        appState.todayDistanceTraveled = distance;
        updateDisplayElements();
        debouncedSave();
        logger(`CONSOLE: Set today's distance to ${distance}km`);
        showFeedback(
          `Today's distance set to ${distance.toFixed(1)}km`,
          'success'
        );
      } else {
        logger.warn(
          'Invalid setTodayDistance parameter:',
          value,
          '(must be 0-1000)'
        );
      }
    },
    setTotalTraveled: value => {
      const distance = parseFloat(value);
      if (isFinite(distance) && distance >= 0 && distance <= 50000) {
        appState.totalDistanceTraveled = distance;
        updateDisplayElements();
        debouncedSave();
        logger(`CONSOLE: Set total traveled distance to ${distance}km`);
        showFeedback(
          `Total traveled distance set to ${distance.toFixed(1)}km`,
          'success'
        );
      } else {
        logger.warn(
          'Invalid setTotalTraveled parameter:',
          value,
          '(must be 0-50000)'
        );
      }
    },
  };

  for (const [key, handler] of Object.entries(paramHandlers)) {
    const value = getURLParam(key);
    if (value !== null) {
      handler(value);
    }
  }
}

function setupHotkeys() {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault();
      const panel =
        domElements.controlPanel || document.getElementById('control-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      }
    }
  });
}

// --- CONSOLE COMMANDS FOR TESTING ---
function addDistance(km) {
  const distance = parseFloat(km);
  if (isFinite(distance)) {
    appState.totalDistanceTraveled = Math.max(
      0,
      appState.totalDistanceTraveled + distance
    );
    appState.todayDistanceTraveled = Math.max(
      0,
      appState.todayDistanceTraveled + distance
    );
    updateDisplayElements();
    debouncedSave();
    const action = distance >= 0 ? 'Added' : 'Adjusted';
    logger(`CONSOLE: ${action} ${Math.abs(distance)}km`);
    showFeedback(`${action} ${Math.abs(distance).toFixed(1)}km`, 'success');
  } else {
    logger.error('Invalid distance provided. Please provide a number.');
  }
}

function setDistance(km) {
  const distance = parseFloat(km);
  if (distance >= 0 && isFinite(distance)) {
    appState.totalDistanceTraveled = distance;
    appState.todayDistanceTraveled = distance;
    updateDisplayElements();
    debouncedSave();
    logger(`CONSOLE: Set distance to ${distance}km`);
    showFeedback(`Set to ${distance.toFixed(1)}km`, 'success');
  } else {
    logger.error(
      'Invalid distance provided. Please provide a non-negative number.'
    );
  }
}

function jumpToProgress(percent) {
  const percentage = parseFloat(percent);
  if (percentage >= 0 && percentage <= 100 && isFinite(percentage)) {
    const targetDistance = (percentage / 100) * appState.originalTotalDistance;
    appState.totalDistanceTraveled = targetDistance;
    appState.todayDistanceTraveled = targetDistance; // Also reset today's distance for consistency
    updateDisplayElements();
    debouncedSave();
    logger(
      `CONSOLE: Jumped to ${percentage}% (${targetDistance.toFixed(1)}km)`
    );
    showFeedback(`${percentage}% progress`, 'success');
  } else {
    logger.error(
      'Invalid percentage. Please provide a number between 0 and 100.'
    );
  }
}

function setTotalDistance(km) {
  const newTotal = parseFloat(km);
  if (newTotal > 0 && isFinite(newTotal)) {
    appState.originalTotalDistance = newTotal;
    updateDisplayElements();
    logger(`CONSOLE: Set total distance to ${newTotal}km`);
    showFeedback(`Trip distance: ${newTotal}km`, 'success');
  } else {
    logger.error('Invalid total distance. Please provide a positive number.');
  }
}

function convertToMiles() {
  if (!appState.useImperialUnits) {
    appState.useImperialUnits = true;
    updateDisplayElements();
    savePersistedData();
    logger('CONSOLE: Switched to miles');
    showFeedback('Units: Kilometers → Miles', 'success');
  }
}

function convertToKilometers() {
  if (appState.useImperialUnits) {
    appState.useImperialUnits = false;
    updateDisplayElements();
    savePersistedData();
    logger('CONSOLE: Switched to kilometers');
    showFeedback('Units: Miles → Kilometers', 'success');
  }
}

function showConsoleCommands() {
  logger(`
    --- Trip Overlay Console Commands ---

    // --- Distance Manipulation ---
    TripOverlay.controls.addDistance(km)       - Adds/subtracts distance. Ex: TripOverlay.controls.addDistance(10.5)
    TripOverlay.controls.setDistance(km)       - Sets the total distance traveled. Ex: TripOverlay.controls.setDistance(100)
    TripOverlay.controls.jumpToProgress(%)     - Jumps to a specific percentage of the trip. Ex: TripOverlay.controls.jumpToProgress(50)

    // --- Trip Configuration ---
    TripOverlay.controls.setTotalDistance(km)  - Changes the total trip distance target. Ex: TripOverlay.controls.setTotalDistance(500)

    // --- Unit Conversion ---
    TripOverlay.controls.convertToMiles()      - Switches display to Imperial units (miles).
    TripOverlay.controls.convertToKilometers() - Switches display to Metric units (kilometers).

    // --- Reset Functions ---
    TripOverlay.controls.resetTripProgress()   - Resets all trip data to zero.
    TripOverlay.controls.resetTodayDistance()  - Resets only the 'today' distance counter.
    TripOverlay.controls.resetAutoStartLocation() - Clears the auto-detected start location for re-detection.

    // --- Data Management ---
    TripOverlay.controls.exportTripData()      - Downloads a backup file of current trip progress.
    TripOverlay.controls.importTripData(json)  - Restores trip progress from a JSON string.

    // --- Debugging ---
    TripOverlay.getStatus()           - Shows the current status of the overlay.

    // --- URL Parameters (can be added to the overlay URL) ---
    ?controls=true        - Shows the control panel on load.
    ?reset=trip           - Resets all trip data on load.
    ?reset=today          - Resets today's distance on load.
    ?reset=location       - Resets auto-start location on load.
    ?resets=trip,today    - Resets multiple items on load (comma-separated).
    ?export=true          - Downloads trip data backup on load.
    ?import=<json_string> - Imports trip data from a URL-encoded JSON string on load.
    ?units=miles          - Sets units to miles on load.
    ?units=km             - Sets units to kilometers on load.
    ?totalDistance=<km>   - Sets the total trip distance on load.
    ?addDistance=<km>     - Adds distance to total and today's distance on load.
    ?setDistance=<km>     - Sets total and today's distance on load.
    ?jumpTo=<percent>     - Jumps to a specific progress percentage on load.
    ?stream=true          - Enables stream mode (hotkey hints).
    ?setTodayDistance=<km>- Sets today's distance on load.
    ?setTotalTraveled=<km>- Sets total traveled distance on load.

    ------------------------------------
    `);
}

function setupConsoleCommands() {
  window.TripOverlay = window.TripOverlay || {};
  window.TripOverlay.controls = {
    addDistance,
    setDistance,
    jumpToProgress,
    setTotalDistance,
    convertToMiles,
    convertToKilometers,
    resetTripProgress,
    resetTodayDistance,
    resetAutoStartLocation,
    exportTripData,
    importTripData,
  };

  window.showConsoleCommands = showConsoleCommands;
  // Make appState available for unified status
  window.appState = appState;
}

// Demo mode is now handled by the RTIRL module

window.addEventListener('beforeunload', () => {
  if (appState.uiUpdateTimeout) {
    clearTimeout(appState.uiUpdateTimeout);
  }
});
