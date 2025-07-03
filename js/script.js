// --- CONFIGURATION ---
// SMART MOVEMENT DETECTION:
// This script automatically detects movement type based on speed.
// No manual configuration (like WALKING_MODE) is needed.

const RTIRL_USER_ID = '41908566'; // Replace with your real user ID
const TOTAL_DISTANCE_KM = 371.0; // distance from vienna to zagreb is ~371km

// DEMO MODE: Set to true for testing without RTIRL (use ?demo=true in URL)
const DEMO_MODE = false;

// const stationaryAvatar =
//   'https://raw.githubusercontent.com/kevintongg/trip-overlay/refs/heads/main/assets/stationary.png';
// const walkingAvatar =
//   'https://raw.githubusercontent.com/kevintongg/trip-overlay/refs/heads/main/assets/walking.gif';
// const cyclingAvatar =
//   'https://raw.githubusercontent.com/kevintongg/trip-overlay/refs/heads/main/assets/cycling.gif';
// const motorbikeAvatar =
//   'https://raw.githubusercontent.com/kevintongg/trip-overlay/refs/heads/main/assets/motorbike.gif';

// --- SMART MOVEMENT CONFIGURATION ---
const MOVEMENT_MODES = {
  STATIONARY: {
    maxSpeed: 2,
    minMovementM: 1,
    gpsThrottle: 5000, // Check less often when still
    avatar: 'assets/stationary.png', // Default avatar
  },
  WALKING: {
    maxSpeed: 10, // Up to 10 km/h
    minMovementM: 1,
    gpsThrottle: 2000,
    avatar: 'assets/walking.gif', // Walking avatar,
  },
  CYCLING: {
    maxSpeed: 35, // Up to 35 km/h
    minMovementM: 5,
    gpsThrottle: 1500,
    avatar: 'assets/cycling.gif', // Bicycle avatar
  },
  VEHICLE: {
    maxSpeed: 200, // Up to 200 km/h
    minMovementM: 10,
    gpsThrottle: 1000,
    avatar: 'assets/motorbike.gif', // Motorbike avatar
  },
};

// Time (in ms) to wait before switching to a slower mode (e.g., from vehicle to walking)
const MODE_SWITCH_DELAY = 10000; // 10 seconds

// --- PERFORMANCE & PERSISTENCE ---
const UI_UPDATE_DEBOUNCE = 100;
const SAVE_DEBOUNCE_DELAY = 500;

// --- LOCATION & STATE ---
const USE_AUTO_START = false;
const MANUAL_START_LOCATION = { lat: 48.209, lon: 16.3531 }; // Vienna

const appState = {
  lastSaveTime: 0,
  uiUpdateScheduled: false,
  uiUpdateTimeout: null,
  rtirtLocationListener: null,
  rtirtSpeedListener: null,
  isConnected: false,
  useImperialUnits: false,
  originalTotalDistance: TOTAL_DISTANCE_KM,
  currentMode: 'STATIONARY',
  modeSwitchTimeout: null,
  demoTimer: null,
  totalDistanceTraveled: 0,
  todayDistanceTraveled: 0,
  lastPosition: null,
  lastUpdateTime: 0,
  startLocation: USE_AUTO_START ? null : MANUAL_START_LOCATION,
};

const urlParams = new URLSearchParams(window.location.search);
function getURLParam(key) {
  return urlParams.get(key);
}
function isDemoMode() {
  return DEMO_MODE || getURLParam('demo') === 'true';
}

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
      const progressPercent = Math.min(
        100,
        (appState.totalDistanceTraveled / appState.originalTotalDistance) * 100
      );

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
  if (isDemoMode()) {
    console.log('🎭 Trip: Demo mode enabled, skipping RTIRL connection');
    appState.demoTimer = setTimeout(startDemoMode, 2000);
    return;
  }

  if (!window.RealtimeIRL) {
    console.error('❌ Trip: RTIRL library not loaded!');
    showFeedback('⚠️ RTIRL library not found', 'error');
    return;
  }

  try {
    console.log('🔌 Trip: Connecting to RTIRL...');
    console.log('📋 Trip: User ID:', RTIRL_USER_ID);
    console.log('⚙️ Trip: Movement detection enabled');
    console.log(
      `📡 Trip: GPS throttling - STATIONARY:${MOVEMENT_MODES.STATIONARY.gpsThrottle}ms, WALKING:${MOVEMENT_MODES.WALKING.gpsThrottle}ms, CYCLING:${MOVEMENT_MODES.CYCLING.gpsThrottle}ms, VEHICLE:${MOVEMENT_MODES.VEHICLE.gpsThrottle}ms`
    );

    const streamer = RealtimeIRL.forStreamer('twitch', RTIRL_USER_ID);

    // GPS location
    appState.rtirtLocationListener =
      streamer.addLocationListener(handleRtirtData);

    console.log('✅ Trip: RTIRL listeners attached successfully');
    showFeedback('🔌 Connecting to RTIRL...', 'warning');
  } catch (error) {
    console.error('❌ Trip: Failed to connect to RTIRL:', error);
    showFeedback('❌ RTIRL connection failed', 'error');
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

function handleSpeedData(speedData) {
  if (!speedData || typeof speedData.kmh === 'undefined') {
    return;
  }

  const speed = speedData.kmh;
  let newMode = 'STATIONARY';

  if (speed > MOVEMENT_MODES.CYCLING.maxSpeed) {
    newMode = 'VEHICLE';
  } else if (speed > MOVEMENT_MODES.WALKING.maxSpeed) {
    newMode = 'CYCLING';
  } else if (speed > MOVEMENT_MODES.STATIONARY.maxSpeed) {
    newMode = 'WALKING';
  }

  if (newMode !== appState.currentMode) {
    // If moving to a slower mode, wait a bit to confirm
    const isSlowingDown =
      (newMode === 'STATIONARY' && appState.currentMode !== 'STATIONARY') ||
      (newMode === 'WALKING' &&
        (appState.currentMode === 'CYCLING' ||
          appState.currentMode === 'VEHICLE')) ||
      (newMode === 'CYCLING' && appState.currentMode === 'VEHICLE');

    if (isSlowingDown) {
      if (!appState.modeSwitchTimeout) {
        appState.modeSwitchTimeout = setTimeout(() => {
          setMovementMode(newMode);
          appState.modeSwitchTimeout = null;
        }, MODE_SWITCH_DELAY);
      }
    } else {
      // If speeding up, switch immediately
      clearTimeout(appState.modeSwitchTimeout);
      appState.modeSwitchTimeout = null;
      setMovementMode(newMode);
    }
  } else {
    // If mode is the same, cancel any pending switch
    clearTimeout(appState.modeSwitchTimeout);
    appState.modeSwitchTimeout = null;
  }
}

function setMovementMode(mode) {
  if (appState.currentMode === mode) {
    return;
  }

  // Log mode change
  console.log(`MODE CHANGE: ${appState.currentMode} → ${mode}`);

  appState.currentMode = mode;
  const modeConfig = MOVEMENT_MODES[mode];

  if (domElements.avatar) {
    // Compare only the path/filename, not the full URL
    const currentAvatar = domElements.avatar.src.split('/').slice(-2).join('/');
    const newAvatar = modeConfig.avatar;
    if (currentAvatar !== newAvatar) {
      domElements.avatar.src = newAvatar;
      console.log(
        `AVATAR UPDATE: Set to ${mode} avatar (${modeConfig.avatar})`
      );
    }
  }

  console.log(`🏃‍♂️ Movement mode changed to: ${mode}`);
  showFeedback(`Mode: ${mode}`, 'info', 2000);
}

function handleRtirtData(data) {
  const now = Date.now();
  const modeConfig = MOVEMENT_MODES[appState.currentMode];

  if (now - appState.lastUpdateTime < modeConfig.gpsThrottle) {
    console.log('⏱️ Trip: Update throttled (too soon since last update)');
    return;
  }

  const previousUpdateTime = appState.lastUpdateTime;
  appState.lastUpdateTime = now;

  if (!data) {
    if (appState.isConnected) {
      console.log('📍 Trip: Location is hidden or streamer is offline');
      showFeedback('🔌 RTIRL location hidden', 'warning');
    }
    appState.isConnected = false;
    return;
  }

  console.log(
    `📡 Trip: Location received - ${data.latitude?.toFixed(4) || 'N/A'}, ${data.longitude?.toFixed(4) || 'N/A'} (accuracy: ${data.accuracy || 'unknown'}m)`
  );

  // If speed is present in the location data, handle it
  if (typeof data.kmh !== 'undefined') {
    console.log(`🏃 Trip: Speed from location - ${data.kmh} km/h`);
    handleSpeedData({ kmh: data.kmh });
  } else if (typeof data.speed !== 'undefined') {
    console.log(`🏃 Trip: Speed from location (alt) - ${data.speed} km/h`);
    handleSpeedData({ kmh: data.speed });
  }

  // If we were previously disconnected and now have data, log that we're live
  if (!appState.isConnected) {
    console.log('✅ Trip: Streamer location is now live!');
    showFeedback('✅ Streamer is live!', 'success');
    appState.isConnected = true;
  }

  const currentPosition = { lat: data.latitude, lon: data.longitude };

  if (!validateCoordinates(currentPosition)) {
    console.warn('⚠️ Trip: Invalid GPS coordinates received:', currentPosition);
    return;
  }

  if (USE_AUTO_START && !appState.startLocation) {
    if (data.latitude === 0 && data.longitude === 0) {
      console.warn(
        '⚠️ Trip: Rejecting suspicious 0,0 coordinates for auto-start'
      );
      return;
    }
    appState.startLocation = currentPosition;
    appState.lastPosition = currentPosition;
    console.log(
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

    console.log(
      `📏 Trip: Distance calculated - ${newDistance.toFixed(6)}km between points`
    );

    // --- Begin permissive mode logic ---
    const timeDiff = Math.max(1, (now - previousUpdateTime) / 1000);
    const plausibleSpeed = newDistance / (timeDiff / 3600);
    let plausibleMode = 'STATIONARY';

    if (plausibleSpeed > MOVEMENT_MODES.CYCLING.maxSpeed) {
      plausibleMode = 'VEHICLE';
    } else if (plausibleSpeed > MOVEMENT_MODES.WALKING.maxSpeed) {
      plausibleMode = 'CYCLING';
    } else if (plausibleSpeed > MOVEMENT_MODES.STATIONARY.maxSpeed) {
      plausibleMode = 'WALKING';
    }

    console.log(
      `🧮 Trip: Movement analysis - ${plausibleSpeed.toFixed(1)} km/h suggests ${plausibleMode} (current: ${appState.currentMode})`
    );

    // Update the current mode if the plausible mode is faster
    if (plausibleMode !== appState.currentMode) {
      const modeOrder = ['STATIONARY', 'WALKING', 'CYCLING', 'VEHICLE'];
      const currentIndex = modeOrder.indexOf(appState.currentMode);
      const plausibleIndex = modeOrder.indexOf(plausibleMode);

      // If plausible mode is faster, switch immediately
      // If plausible mode is slower, use delay (same logic as handleSpeedData)
      if (plausibleIndex > currentIndex) {
        setMovementMode(plausibleMode);
      } else if (plausibleIndex < currentIndex) {
        // Switching to slower mode - use delay
        if (!appState.modeSwitchTimeout) {
          console.log(
            `⏱️ Trip: Scheduling mode switch from ${appState.currentMode} to ${plausibleMode} in ${MODE_SWITCH_DELAY / 1000}s`
          );
          appState.modeSwitchTimeout = setTimeout(() => {
            setMovementMode(plausibleMode);
            appState.modeSwitchTimeout = null;
          }, MODE_SWITCH_DELAY);
        }
      }
    } else {
      // If mode is the same, cancel any pending switch
      if (appState.modeSwitchTimeout) {
        clearTimeout(appState.modeSwitchTimeout);
        appState.modeSwitchTimeout = null;
      }
    }

    // Use the more permissive of current or plausible mode
    const usedMode = [appState.currentMode, plausibleMode].sort((a, b) => {
      const order = ['STATIONARY', 'WALKING', 'CYCLING', 'VEHICLE'];
      return order.indexOf(a) - order.indexOf(b);
    })[1];
    const usedModeConfig = MOVEMENT_MODES[usedMode];
    const minMovementKm = usedModeConfig.minMovementM / 1000;

    if (newDistance < minMovementKm) {
      console.log(
        `🔇 Trip: Distance ${newDistance.toFixed(4)}km below ${usedMode} threshold (${minMovementKm}km) - ignoring`
      );
      return; // Ignore noise
    }

    const maxSpeedMs = usedModeConfig.maxSpeed / 3.6;
    const maxReasonableDistance = (timeDiff * maxSpeedMs) / 1000;

    if (newDistance > maxReasonableDistance * 1.5) {
      console.warn(
        `⚠️ Trip: GPS jump detected in ${usedMode} mode: ${newDistance.toFixed(2)}km vs max ${maxReasonableDistance.toFixed(2)}km - ignoring`
      );
      return;
    }

    // Valid movement detected
    appState.totalDistanceTraveled += newDistance;
    appState.todayDistanceTraveled += newDistance;

    // Log distance/progress update
    const progressPercent =
      (appState.totalDistanceTraveled / appState.originalTotalDistance) * 100;
    const kmToMiles = 0.621371;
    const unitMultiplier = appState.useImperialUnits ? kmToMiles : 1;
    const units = appState.useImperialUnits ? 'mi' : 'km';

    console.log(
      `📈 Trip: Progress update - +${(newDistance * unitMultiplier).toFixed(4)}${units} | Total: ${(appState.totalDistanceTraveled * unitMultiplier).toFixed(4)}${units} | ${progressPercent.toFixed(2)}% | Mode: ${appState.currentMode}`
    );

    updateDisplayElements();
    debouncedSave();
  } else {
    console.log(
      '⚠️ Trip: Missing start location or last position for distance calculation'
    );
  }

  appState.lastPosition = currentPosition;
}

const distanceCache = new Map();
function calculateDistance(pos1, pos2) {
  const key = `${pos1.lat.toFixed(6)},${pos1.lon.toFixed(6)}-${pos2.lat.toFixed(
    6
  )},${pos2.lon.toFixed(6)}`;
  if (distanceCache.has(key)) {
    return distanceCache.get(key);
  }

  const R = 6371;
  const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const dLon = ((pos2.lon - pos1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1.lat * Math.PI) / 180) *
      Math.cos((pos2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.max(0, R * c);

  if (distanceCache.size > 100) {
    distanceCache.delete(distanceCache.keys().next().value);
  }
  distanceCache.set(key, distance);
  return distance;
}

// --- VALIDATION & PERSISTENCE ---
function validateDistance(d) {
  return typeof d === 'number' && isFinite(d) && d >= 0
    ? Math.min(d, 50000)
    : 0;
}
function validateCoordinates(c) {
  return (
    c &&
    typeof c.lat === 'number' &&
    typeof c.lon === 'number' &&
    isFinite(c.lat) &&
    isFinite(c.lon) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lon >= -180 &&
    c.lon <= 180
  );
}
function sanitizeUIValue(v) {
  return !isFinite(v) || v < 0 ? 0 : Math.min(v, 999999);
}

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
      console.log('Daily distance reset - new travel day detected');
    }
    if (USE_AUTO_START && validateCoordinates(data.autoStartLocation)) {
      appState.startLocation = data.autoStartLocation;
    }
    if (typeof data.useImperialUnits !== 'undefined') {
      appState.useImperialUnits = data.useImperialUnits;
    }
  } catch (e) {
    console.error('Failed to load persisted data:', e);
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
    console.error('Failed to save trip data:', e);
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
  if (isDemoMode() && appState.demoTimer) {
    clearInterval(appState.demoTimer);
    appState.demoTimer = null;
    startDemoMode();
  }
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
    console.error('❌ Backup failed:', e);
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
    console.log('CONSOLE: Trip data imported.');
  } catch (e) {
    console.error('CONSOLE: Failed to parse or apply import data:', e);
    showFeedback('❌ Failed to import data', 'error');
  }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initializeDOMCache();
  checkURLParameters();
  loadPersistedData();
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
      console.log('URL parameter triggered: reset =', value);
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
          console.warn('Unknown reset parameter:', value);
      }
    },
    resets: value => {
      const resetTypes = value.split(',');
      console.log('URL parameter triggered: multiple resets =', resetTypes);
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
            console.warn('Unknown reset type in multiple resets:', type);
        }
      });
    },
    export: value => {
      if (value === 'true') {
        console.log('URL parameter triggered: exportTripData()');
        setTimeout(exportTripData, 1000);
      }
    },
    import: value => {
      try {
        const decodedData = decodeURIComponent(value);
        console.log('URL parameter triggered: importTripData()');
        importTripData(decodedData);
      } catch (error) {
        console.error('Failed to import data from URL parameter:', error);
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
      setTotalDistance(value);
    },
    addDistance: value => {
      addDistance(value);
    },
    setDistance: value => {
      setDistance(value);
    },
    jumpTo: value => {
      jumpToProgress(value);
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
        console.log(
          '🎥 Stream Mode enabled - controls available via Ctrl+H hotkey'
        );
      }
    },
    setTodayDistance: value => {
      const distance = parseFloat(value);
      if (distance >= 0 && isFinite(distance)) {
        appState.todayDistanceTraveled = distance;
        updateDisplayElements();
        debouncedSave();
        console.log(`CONSOLE: Set today's distance to ${distance}km`);
        showFeedback(
          `Today's distance set to ${distance.toFixed(1)}km`,
          'success'
        );
      } else {
        console.error(
          "Invalid today's distance. Please provide a non-negative number."
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
    console.log(`CONSOLE: ${action} ${Math.abs(distance)}km`);
    showFeedback(`${action} ${Math.abs(distance).toFixed(1)}km`, 'success');
  } else {
    console.error('Invalid distance provided. Please provide a number.');
  }
}

function setDistance(km) {
  const distance = parseFloat(km);
  if (distance >= 0 && isFinite(distance)) {
    appState.totalDistanceTraveled = distance;
    appState.todayDistanceTraveled = distance;
    updateDisplayElements();
    debouncedSave();
    console.log(`CONSOLE: Set distance to ${distance}km`);
    showFeedback(`Set to ${distance.toFixed(1)}km`, 'success');
  } else {
    console.error(
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
    console.log(
      `CONSOLE: Jumped to ${percentage}% (${targetDistance.toFixed(1)}km)`
    );
    showFeedback(`${percentage}% progress`, 'success');
  } else {
    console.error(
      'Invalid percentage. Please provide a number between 0 and 100.'
    );
  }
}

function setTotalDistance(km) {
  const newTotal = parseFloat(km);
  if (newTotal > 0 && isFinite(newTotal)) {
    appState.originalTotalDistance = newTotal;
    updateDisplayElements();
    console.log(`CONSOLE: Set total distance to ${newTotal}km`);
    showFeedback(`Trip distance: ${newTotal}km`, 'success');
  } else {
    console.error('Invalid total distance. Please provide a positive number.');
  }
}

function convertToMiles() {
  if (!appState.useImperialUnits) {
    appState.useImperialUnits = true;
    updateDisplayElements();
    savePersistedData();
    console.log('CONSOLE: Switched to miles');
    showFeedback('Units: Kilometers → Miles', 'success');
  }
}

function convertToKilometers() {
  if (appState.useImperialUnits) {
    appState.useImperialUnits = false;
    updateDisplayElements();
    savePersistedData();
    console.log('CONSOLE: Switched to kilometers');
    showFeedback('Units: Miles → Kilometers', 'success');
  }
}

function showConsoleCommands() {
  console.log(`
    --- Trip Overlay Console Commands ---

    // --- Distance Manipulation ---
    addDistance(km)       - Adds/subtracts distance. Ex: addDistance(10.5) or addDistance(-5)
    setDistance(km)       - Sets the total distance traveled. Ex: setDistance(100)
    jumpToProgress(%)     - Jumps to a specific percentage of the trip. Ex: jumpToProgress(50)

    // --- Trip Configuration ---
    setTotalDistance(km)  - Changes the total trip distance target. Ex: setTotalDistance(500)

    // --- Unit Conversion ---
    convertToMiles()      - Switches display to Imperial units (miles).
    convertToKilometers() - Switches display to Metric units (kilometers).

    // --- Reset Functions ---
    resetTripProgress()   - Resets all trip data to zero.
    resetTodayDistance()  - Resets only the 'today' distance counter.
    resetAutoStartLocation() - Clears the auto-detected start location for re-detection.

    // --- Data Management ---
    exportTripData()      - Downloads a backup file of current trip progress.
    importTripData(json)  - Restores trip progress from a JSON string.

    // --- Debugging ---
    getStatus()           - Shows the current status of the overlay.

    ------------------------------------
    `);
}

function getStatus() {
  const connectionStatus = appState.isConnected
    ? '✅ Connected'
    : '❌ Disconnected';

  const units = appState.useImperialUnits ? 'miles' : 'km';
  const kmToMiles = 0.621371;
  const unitMultiplier = appState.useImperialUnits ? kmToMiles : 1;

  const now = Date.now();
  const lastUpdate = appState.lastUpdateTime;
  const timeSinceUpdate = lastUpdate
    ? Math.round((now - lastUpdate) / 1000)
    : null;

  // Multi-line, readable console output
  console.log(`\n🔍 RTIRL OVERLAY STATUS:\n\n🔑 Configuration:
   User ID: '${RTIRL_USER_ID}'
   Mode: ${appState.currentMode}
   Target: ${(appState.originalTotalDistance * unitMultiplier).toFixed(1)} ${units}
   Start Location: ${appState.startLocation ? `${appState.startLocation.lat.toFixed(4)}, ${appState.startLocation.lon.toFixed(4)}` : 'Not set'}

🌐 Connection:
   Status: ${connectionStatus}
   API: @rtirl/api v1.2.1 (handles reconnection automatically)
   Demo mode: ${isDemoMode() ? '✅ Active' : '❌ Disabled'}

📍 GPS Data:
   Last position: ${appState.lastPosition ? `${appState.lastPosition.lat.toFixed(4)}, ${appState.lastPosition.lon.toFixed(4)}` : 'None'}
   Last update: ${lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
   Time since update: ${timeSinceUpdate !== null ? `${timeSinceUpdate}s ago` : 'N/A'}

📊 Progress:
   Total: ${(appState.totalDistanceTraveled * unitMultiplier).toFixed(2)} ${units}
   Today: ${(appState.todayDistanceTraveled * unitMultiplier).toFixed(2)} ${units}
   Remaining: ${(Math.max(0, appState.originalTotalDistance - appState.totalDistanceTraveled) * unitMultiplier).toFixed(2)} ${units}
   Progress: ${((appState.totalDistanceTraveled / appState.originalTotalDistance) * 100).toFixed(1)}%

⚙️ Settings:
   Units: ${units}
   GPS Update Throttle: ${MOVEMENT_MODES[appState.currentMode].gpsThrottle}ms
   Auto-start: ${USE_AUTO_START ? 'Enabled' : 'Disabled'}
`);

  // Additional diagnostics
  if (appState.rtirtLocationListener && !appState.isConnected) {
    console.log('💡 Connection troubleshooting:');
    console.log('  1. Check user ID is correct');
    console.log('  2. Verify RTIRL app is broadcasting GPS');
    console.log('  3. Check network connectivity');
  }

  // Only show the warning if the last update was more than 30 seconds ago
  if (lastUpdate && now - lastUpdate > 30000) {
    console.log(
      `⚠️ No GPS updates for >30 seconds - check RTIRL app (actual: ${timeSinceUpdate}s)`
    );
  }

  return {
    userID: RTIRL_USER_ID,
    connected: appState.isConnected,
    totalDistance: appState.totalDistanceTraveled,
    todayDistance: appState.todayDistanceTraveled,
    progress:
      (appState.totalDistanceTraveled / appState.originalTotalDistance) * 100,
    lastUpdate: appState.lastUpdateTime,
    mode: appState.currentMode,
  };
}

function setupConsoleCommands() {
  window.addDistance = addDistance;
  window.setDistance = setDistance;
  window.jumpToProgress = jumpToProgress;
  window.setTotalDistance = setTotalDistance;
  window.convertToMiles = convertToMiles;
  window.convertToKilometers = convertToKilometers;
  window.resetTripProgress = resetTripProgress;
  window.resetTodayDistance = resetTodayDistance;
  window.resetAutoStartLocation = resetAutoStartLocation;
  window.exportTripData = exportTripData;
  window.importTripData = importTripData;
  window.showConsoleCommands = showConsoleCommands;
  window.getStatus = getStatus;
}

// --- DEMO MODE ---
function startDemoMode() {
  let currentModeIndex = 0;
  const modes = ['STATIONARY', 'WALKING', 'CYCLING', 'VEHICLE'];

  appState.demoTimer = setInterval(() => {
    const currentMode = modes[currentModeIndex];
    const modeConfig = MOVEMENT_MODES[currentMode];
    const speed = modeConfig.maxSpeed > 0 ? modeConfig.maxSpeed - 1 : 0;

    setMovementMode(currentMode);

    const distanceIncrement = speed * (3000 / 3600); // distance in meters per 3 seconds

    if (speed > MOVEMENT_MODES.STATIONARY.maxSpeed) {
      appState.totalDistanceTraveled += distanceIncrement / 1000; // convert to km
      appState.todayDistanceTraveled += distanceIncrement / 1000;
    }

    updateDisplayElements();
    debouncedSave();

    const kmToMiles = 0.621371;
    const unitMultiplier = appState.useImperialUnits ? kmToMiles : 1;
    const unitSuffix = appState.useImperialUnits ? 'mi' : 'km';
    const currentTotal = (
      appState.totalDistanceTraveled * unitMultiplier
    ).toFixed(2);
    const currentTarget = (
      appState.originalTotalDistance * unitMultiplier
    ).toFixed(2);

    console.log(
      `🎭 Demo (${appState.currentMode}): ${currentTotal}${unitSuffix} / ${currentTarget}${unitSuffix}`
    );

    if (appState.totalDistanceTraveled >= appState.originalTotalDistance) {
      clearInterval(appState.demoTimer);
      showFeedback('🎯 Demo trip completed!', 'success');
    }

    currentModeIndex = (currentModeIndex + 1) % modes.length;
  }, 3000);
}

window.addEventListener('beforeunload', () => {
  if (appState.rtirtLocationListener) {
    appState.rtirtLocationListener();
  }
  if (appState.demoTimer) {
    clearInterval(appState.demoTimer);
  }
  if (appState.uiUpdateTimeout) {
    clearTimeout(appState.uiUpdateTimeout);
  }
});
