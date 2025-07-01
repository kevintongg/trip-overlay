// --- CONFIGURATION ---

const RTIRL_USER_ID = ''; // Find this in your rtirl.com profile
// URL
const TOTAL_DISTANCE_KM = 205.0; // The total distance of your trip from Google
// Maps

// DEMO MODE: Set to true for testing without RTIRL (use ?demo=true in URL)
const DEMO_MODE = false;

// PERFORMANCE CONSTANTS
const GPS_UPDATE_THROTTLE = 1000; // 1 second
const UI_UPDATE_DEBOUNCE = 100; // 100ms for smooth UI updates
const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
const SAVE_DEBOUNCE_DELAY = 500; // 500ms for localStorage saves

// PERSISTENCE: localStorage is domain/browser specific
// For cross-device persistence, see README.md for cloud storage options

// --- OPTIMIZED STATE MANAGEMENT ---
const appState = {
  reconnectAttempts: 0,
  lastSaveTime: 0,
  uiUpdateScheduled: false,
  uiUpdateTimeout: null,
  connection: null,
  useImperialUnits: false, // false = km, true = miles
  originalTotalDistance: 205.0, // Store original for unit conversion
};

// Centralized URL parameter handling to avoid duplication
const urlParams = new URLSearchParams(window.location.search);
function getURLParam(key) {
  return urlParams.get(key);
}
function isDemoMode() {
  return DEMO_MODE || getURLParam('demo') === 'true';
}

// Cache DOM elements for better performance
const domElements = {
  traveled: null,
  remaining: null,
  today: null,
  progressBar: null,
  avatar: null,
  controlPanel: null,
  feedback: null,
};

// Initialize DOM cache
function initializeDOMCache() {
  domElements.traveled = document.getElementById('distance-traveled');
  domElements.remaining = document.getElementById('distance-remaining');
  domElements.today = document.getElementById('distance-today');
  domElements.progressBar = document.getElementById('progress-bar-traveled');
  domElements.avatar = document.getElementById('avatar');
  domElements.controlPanel = document.getElementById('control-panel');
  domElements.feedback = document.getElementById('action-feedback');

  // DOM cache ready - no legacy references needed
}

// --- OPTIMIZED UI UPDATES ---
function updateDisplayElements() {
  // Double-layer debouncing: timeout + requestAnimationFrame for optimal performance
  if (appState.uiUpdateTimeout) {
    clearTimeout(appState.uiUpdateTimeout);
  }

  appState.uiUpdateTimeout = setTimeout(() => {
    if (appState.uiUpdateScheduled) {
      return;
    }

    appState.uiUpdateScheduled = true;
    requestAnimationFrame(() => {
      // Calculate current progress
      const distanceRemaining = Math.max(
        0,
        TOTAL_DISTANCE_KM - totalDistanceTraveled
      );
      const progressPercent = Math.min(
        100,
        (totalDistanceTraveled / TOTAL_DISTANCE_KM) * 100
      );

      // Apply unit conversion if needed
      const kmToMiles = 0.621371;
      const unitMultiplier = appState.useImperialUnits ? kmToMiles : 1;
      const unitSuffix = appState.useImperialUnits ? ' mi' : ' km';

      // Batch DOM updates (ensure clean values without existing suffixes)
      const updates = {
        traveled:
          (sanitizeUIValue(totalDistanceTraveled) * unitMultiplier).toFixed(2) +
          unitSuffix,
        remaining:
          (sanitizeUIValue(distanceRemaining) * unitMultiplier).toFixed(2) +
          unitSuffix,
        today:
          (sanitizeUIValue(todayDistanceTraveled) * unitMultiplier).toFixed(2) +
          unitSuffix,
        progress: `${progressPercent}%`,
      };

      // Apply updates using cached elements with fallbacks
      const elements = {
        traveled:
          domElements.traveled || document.getElementById('distance-traveled'),
        remaining:
          domElements.remaining ||
          document.getElementById('distance-remaining'),
        today: domElements.today || document.getElementById('distance-today'),
        progressBar:
          domElements.progressBar ||
          document.getElementById('progress-bar-traveled'),
        avatar: domElements.avatar || document.getElementById('avatar'),
      };

      // Apply text updates (units are now properly handled)
      if (elements.traveled) {
        elements.traveled.textContent = updates.traveled;
      }
      if (elements.remaining) {
        elements.remaining.textContent = updates.remaining;
      }
      if (elements.today) {
        elements.today.textContent = updates.today;
      }
      if (elements.progressBar) {
        elements.progressBar.style.width = updates.progress;
      }
      if (elements.avatar) {
        elements.avatar.style.left = updates.progress;
      }

      appState.uiUpdateScheduled = false;
      appState.uiUpdateTimeout = null;
    });
  }, UI_UPDATE_DEBOUNCE);
}

// Exponential backoff for reconnection attempts
function calculateReconnectDelay() {
  const baseDelay = 1000; // 1 second
  const delay = Math.min(
    baseDelay * Math.pow(2, appState.reconnectAttempts),
    MAX_RECONNECT_DELAY
  );
  return delay + Math.random() * 1000; // Add jitter
}

function connectToRtirl() {
  // Check for demo mode first
  if (isDemoMode()) {
    console.log('🎭 Demo mode enabled - simulating GPS data');
    showFeedback('🎭 Demo mode active - simulating trip', 'success');
    startDemoMode();
    return;
  }

  // Check if RTIRL_USER_ID is configured using ES13 features
  if (RTIRL_USER_ID === 'YOUR_RTIRL_ID') {
    console.warn(
      '⚠️ RTIRL_USER_ID not configured. Please set your RTIRL user ID.'
    );
    showFeedback(
      '⚠️ RTIRL not configured - update RTIRL_USER_ID',
      'warning',
      5000
    );
    return;
  }

  function connectWebSocket() {
    try {
      console.log(
        `🔗 Connecting to RTIRL... (attempt ${appState.reconnectAttempts + 1})`
      );

      // Clean up existing connection
      if (appState.connection?.readyState === WebSocket.OPEN) {
        appState.connection.close();
      }

      // RTIRL WebSocket API endpoint
      appState.connection = new WebSocket(
        `wss://rtirl.com/ws/${RTIRL_USER_ID}`
      );

      appState.connection.onopen = function () {
        console.log('✅ Connected to RTIRL');
        showFeedback('✅ RTIRL connected', 'success');
        appState.reconnectAttempts = 0; // Reset on successful connection
      };

      appState.connection.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);
          handleRtirtData(data);
        } catch (error) {
          console.error('❌ Failed to parse RTIRL data:', error);
        }
      };

      appState.connection.onclose = function (_event) {
        const delay = calculateReconnectDelay();
        console.log(
          `🔌 RTIRL connection closed. Reconnecting in ${(delay / 1000).toFixed(1)}s...`
        );
        showFeedback('🔌 RTIRL disconnected - reconnecting...', 'warning');

        appState.reconnectAttempts++;
        setTimeout(connectWebSocket, delay);
      };

      appState.connection.onerror = function (error) {
        console.error('❌ RTIRL connection error:', error);
        showFeedback('❌ RTIRL connection failed', 'error');
      };
    } catch (error) {
      console.error('❌ Failed to connect to RTIRL:', error);
      showFeedback('❌ RTIRL connection failed', 'error');

      const delay = calculateReconnectDelay();
      appState.reconnectAttempts++;
      setTimeout(connectWebSocket, delay);
    }
  }

  // Start connection
  connectWebSocket();
}

// Debounced save function to reduce localStorage writes
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

function handleRtirtData(data) {
  // Throttle GPS updates
  const now = Date.now();
  if (now - lastUpdateTime < GPS_UPDATE_THROTTLE) {
    return;
  }

  // Store previous update time for speed validation before updating
  const previousUpdateTime = lastUpdateTime;
  lastUpdateTime = now;

  // Extract GPS coordinates using modern ES13 features
  const currentLat = data?.latitude ?? data?.lat;
  const currentLon = data?.longitude ?? data?.lon;

  if (!currentLat || !currentLon) {
    return; // No GPS data available
  }

  const currentPosition = { lat: currentLat, lon: currentLon };

  // Validate GPS coordinates
  if (!validateCoordinates(currentPosition)) {
    console.warn('⚠️ Invalid GPS coordinates received:', currentPosition);
    return;
  }

  // Handle auto-start location detection
  if (USE_AUTO_START && !startLocation) {
    // Reject suspicious coordinates (like 0,0)
    if (currentLat === 0 && currentLon === 0) {
      console.warn('⚠️ Rejecting suspicious 0,0 coordinates for auto-start');
      return;
    }

    startLocation = currentPosition;
    lastPosition = currentPosition;
    console.log('✅ Auto-detected start location:', startLocation);
    debouncedSave(); // Use debounced save
    return;
  }

  // Calculate distance if we have a start location and last position
  if (startLocation && lastPosition) {
    const newDistance = calculateDistance(lastPosition, currentPosition);

    // Sanity check: reject impossibly large distances (>200km/h = 55m/s)
    const timeDiff = Math.max(1, (now - previousUpdateTime) / 1000); // seconds (min 1s)
    const maxReasonableDistance = timeDiff * 0.055; // 55 m/s = ~200 km/h

    if (newDistance > maxReasonableDistance) {
      console.warn(
        `⚠️ GPS jump detected: ${newDistance.toFixed(2)}km in ${timeDiff}s - ignoring`
      );
      return;
    }

    // Update distances
    totalDistanceTraveled += newDistance;
    todayDistanceTraveled += newDistance;

    // Update UI (debounced)
    updateDisplayElements();

    // Save progress (debounced)
    debouncedSave();

    console.log(
      `📍 GPS Update: +${newDistance.toFixed(3)}km (Total: ${totalDistanceTraveled.toFixed(2)}km)`
    );
  }

  // Update last position
  lastPosition = currentPosition;
}

// Optimized distance calculation with caching for GPS streaming performance
const distanceCache = new Map();
function calculateDistance(pos1, pos2) {
  // Cache key with reasonable precision to avoid redundant calculations
  const key = `${pos1.lat.toFixed(6)},${pos1.lon.toFixed(6)}-${pos2.lat.toFixed(6)},${pos2.lon.toFixed(6)}`;

  if (distanceCache.has(key)) {
    return distanceCache.get(key);
  }

  const R = 6371; // Earth's radius in kilometers
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

  // Simple LRU cache management for long streaming sessions
  if (distanceCache.size > 100) {
    const firstKey = distanceCache.keys().next().value;
    distanceCache.delete(firstKey);
  }
  distanceCache.set(key, distance);

  return distance;
}

// --- GPS OVERLAY CORE LOGIC ---
// Handles real-time distance tracking with robust error handling and persistence

// START LOCATION OPTIONS - Choose your preferred method:
const USE_AUTO_START = false; // Set to true for automatic start location
// detection
const MANUAL_START_LOCATION = { lat: 50.0755, lon: 14.4378 }; // GPS for Prague
// (example)

// This will be set automatically based on your choice above
let startLocation = USE_AUTO_START ? null : MANUAL_START_LOCATION;

// No legacy DOM elements needed - using cached domElements throughout

// --- STATE ---
let totalDistanceTraveled = 0;
let todayDistanceTraveled = 0;

let lastPosition = null;

let lastUpdateTime = 0; // For throttling GPS updates

// --- VALIDATION UTILITIES ---
function validateDistance(distance) {
  if (typeof distance !== 'number' || !isFinite(distance) || distance < 0) {
    return 0;
  }
  // Cap at reasonable maximum (e.g., 50,000km for round-the-world trip)
  return Math.min(distance, 50000);
}

function validateCoordinates(coords) {
  if (!coords || typeof coords !== 'object') {
    return false;
  }
  if (typeof coords.lat !== 'number' || typeof coords.lon !== 'number') {
    return false;
  }
  if (!isFinite(coords.lat) || !isFinite(coords.lon)) {
    return false;
  }
  // Valid latitude: -90 to 90, longitude: -180 to 180
  return (
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lon >= -180 &&
    coords.lon <= 180
  );
}

function sanitizeUIValue(value, _decimals = 2) {
  if (!isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(value, 999999); // Prevent UI overflow
}

function shouldResetTodayDistance(savedDate, lastActiveTime) {
  const now = new Date();
  const currentDateString = now.toDateString();

  // If no saved date, this is first run - don't reset
  if (!savedDate) {
    return false;
  }

  // If same calendar day, don't reset
  if (savedDate === currentDateString) {
    return false;
  }

  // Check if enough time has passed to consider it a "new day"
  // Don't reset if it's just past midnight but we were recently active
  if (lastActiveTime) {
    const lastActive = new Date(lastActiveTime);
    const hoursSinceLastActive = (now - lastActive) / (1000 * 60 * 60);

    // If less than 6 hours since last activity, probably same travel session
    // (covers midnight streaming or short sleep breaks)
    if (hoursSinceLastActive < 6) {
      return false;
    }
  }

  // Different calendar day AND sufficient time gap = reset
  return true;
}

// --- PERSISTENCE ---
function loadPersistedData() {
  try {
    const saved = localStorage.getItem('trip-overlay-data');
    if (saved) {
      const data = JSON.parse(saved);

      // Validate and sanitize loaded data
      const validatedTotal = validateDistance(data.totalDistanceTraveled);
      const validatedToday = validateDistance(data.todayDistanceTraveled);

      totalDistanceTraveled = validatedTotal;

      // Check if it's the same day for "today" distance
      // Use more intelligent day detection that accounts for streaming/travel
      const shouldResetToday = shouldResetTodayDistance(
        data.date,
        data.lastActiveTime
      );

      if (!shouldResetToday) {
        todayDistanceTraveled = validatedToday;
      } else {
        todayDistanceTraveled = 0;
        console.log('Daily distance reset - new travel day detected');
      }

      // Restore auto-detected start location if valid
      if (
        USE_AUTO_START &&
        data.autoStartLocation &&
        validateCoordinates(data.autoStartLocation)
      ) {
        startLocation = data.autoStartLocation;
        console.log('Restored auto-detected start location:', startLocation);
      }

      // Restore unit preference if saved
      if (data.useImperialUnits !== undefined) {
        appState.useImperialUnits = data.useImperialUnits;
        const units = appState.useImperialUnits ? 'miles' : 'kilometers';
        console.log(`Restored unit preference: ${units}`);
      }

      console.log(
        `Progress restored - Total: ${totalDistanceTraveled.toFixed(
          2
        )}km, Today: ${todayDistanceTraveled.toFixed(2)}km`
      );
    }
  } catch (error) {
    console.error('Failed to load persisted data, starting fresh:', error);
    // Continue with default values if localStorage is corrupted
  }
}

function savePersistedData() {
  try {
    const data = {
      totalDistanceTraveled: validateDistance(totalDistanceTraveled),
      todayDistanceTraveled: validateDistance(todayDistanceTraveled),
      date: new Date().toDateString(),
      lastActiveTime: new Date().toISOString(), // Track when we were last
      // active
      autoStartLocation:
        USE_AUTO_START && validateCoordinates(startLocation)
          ? startLocation
          : null,
      useImperialUnits: appState.useImperialUnits, // Save unit preference
    };
    localStorage.setItem('trip-overlay-data', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save trip data:', error);
    // Continue silently - don't break the overlay if storage fails
  }
}

// Enhanced user feedback for control panel (optimized)
function showFeedback(message, type = 'success', duration = 3000) {
  // Use cached DOM element or fallback to querySelector
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

// Enhanced reset functions with visual feedback
function resetTripProgress() {
  try {
    localStorage.removeItem('trip-overlay-data');
    totalDistanceTraveled = 0;
    todayDistanceTraveled = 0;
    startLocation = USE_AUTO_START ? null : MANUAL_START_LOCATION;
    lastPosition = null;
    lastUpdateTime = 0;

    // Reset unit preference to default (kilometers)
    appState.useImperialUnits = false;

    // If demo mode is active, restart it from 0
    if (isDemoMode() && appState.demoTimer) {
      // Stop current demo timer
      clearInterval(appState.demoTimer);
      appState.demoTimer = null;

      // Restart demo mode from 0
      console.log('🎭 Demo mode: Restarting from 0 after reset');
      setTimeout(startDemoMode, 1000); // Small delay to let UI update
    }

    // Reset UI with proper unit display
    updateDisplayElements();

    console.log('✅ Trip progress reset to 0km (units reset to kilometers)');
    showFeedback('✅ Trip reset complete - starting fresh!', 'success');
  } catch (error) {
    console.error('❌ Failed to reset trip progress:', error);
    showFeedback('❌ Reset failed - try again', 'error');
  }
}

function resetAutoStartLocation() {
  try {
    startLocation = null;
    lastPosition = null;
    console.log(
      '✅ Auto-start location reset - will re-detect on next GPS update'
    );
    savePersistedData();
    showFeedback(
      '✅ Start location reset - will re-detect automatically',
      'success'
    );
  } catch (error) {
    console.error('❌ Failed to reset auto-start location:', error);
    showFeedback('❌ Location reset failed - try again', 'error');
  }
}

function resetTodayDistance() {
  try {
    todayDistanceTraveled = 0;

    // Update UI with proper units and formatting
    updateDisplayElements();

    // Save the reset
    savePersistedData();

    console.log("✅ Today's distance reset to 0km");
    showFeedback('✅ Today reset - ready for new travel day!', 'success');
  } catch (error) {
    console.error("❌ Failed to reset today's distance:", error);
    showFeedback('❌ Today reset failed - try again', 'error');
  }
}

// Manual backup/restore functions for transferring progress between setups
function exportTripData() {
  try {
    const dataToExport = {
      totalDistanceTraveled: validateDistance(totalDistanceTraveled),
      todayDistanceTraveled: validateDistance(todayDistanceTraveled),
      date: new Date().toDateString(),
      lastActiveTime: new Date().toISOString(),
      autoStartLocation:
        USE_AUTO_START && validateCoordinates(startLocation)
          ? startLocation
          : null,
      useImperialUnits: appState.useImperialUnits, // Include unit preference in backup
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `trip-backup-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();

    console.log('✅ Trip data exported successfully');
    showFeedback('✅ Backup downloaded successfully!', 'success');
  } catch (error) {
    console.error('❌ Failed to export trip data:', error);
    showFeedback('❌ Backup failed - try again', 'error');
  }
}

function importTripData(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Handle both old and new data formats
    if (data.totalDistanceTraveled !== undefined) {
      totalDistanceTraveled = validateDistance(data.totalDistanceTraveled) || 0;
      todayDistanceTraveled = validateDistance(data.todayDistanceTraveled) || 0;

      if (
        USE_AUTO_START &&
        data.autoStartLocation &&
        validateCoordinates(data.autoStartLocation)
      ) {
        startLocation = data.autoStartLocation;
      }

      // Restore unit preference from backup
      if (data.useImperialUnits !== undefined) {
        appState.useImperialUnits = data.useImperialUnits;
        const units = appState.useImperialUnits ? 'miles' : 'kilometers';
        console.log(`Restored unit preference from backup: ${units}`);
      }

      savePersistedData();
      updateDisplayElements();
      console.log('✅ Trip data imported successfully');
      showFeedback('✅ Data imported successfully!', 'success');
    } else {
      console.warn('⚠️ Invalid data format for import');
      showFeedback('⚠️ Invalid backup file format', 'warning');
    }
  } catch (error) {
    console.error('❌ Failed to import trip data:', error);
    showFeedback('❌ Import failed - check file format', 'error');
  }
}

// Easy import function with prompt for non-technical users
// eslint-disable-next-line no-unused-vars
function easyImport() {
  try {
    // eslint-disable-next-line no-undef
    const backupData = prompt(
      'Paste your backup data here:\n\n(The text from your trip-backup-YYYY-MM-DD.json file that starts with { and ends with })'
    );

    if (backupData && backupData.trim()) {
      importTripData(backupData.trim());
    } else {
      console.log('Import cancelled or no data provided');
      showFeedback('Import cancelled', 'warning');
    }
  } catch (error) {
    console.error('❌ Easy import failed:', error);
    showFeedback('❌ Easy import failed - try the manual method', 'error');
  }
}

// Check for special "smart streaming" mode
function checkURLParameters() {
  // Check for reset command
  const resetParam = getURLParam('reset');
  if (resetParam) {
    console.log('URL parameter triggered: reset =', resetParam);
    switch (resetParam) {
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
        console.warn('Unknown reset parameter:', resetParam);
    }
  }

  // Enhanced: Support multiple reset operations via comma-separated values
  // Example: ?reset=today,location or ?resets=trip,location
  const resetParams = getURLParam('resets');
  if (resetParams) {
    const resetTypes = resetParams.split(',');
    console.log('URL parameter triggered: multiple resets =', resetTypes);

    resetTypes.forEach(resetType => {
      switch (resetType.trim()) {
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
          console.warn('Unknown reset type in multiple resets:', resetType);
      }
    });
  }

  // Check for export command
  if (getURLParam('export') === 'true') {
    console.log('URL parameter triggered: exportTripData()');
    setTimeout(exportTripData, 1000); // Delay to ensure page is loaded
  }

  // Check for import command with data
  const importData = getURLParam('import');
  if (importData) {
    try {
      const decodedData = decodeURIComponent(importData);
      console.log('URL parameter triggered: importTripData()');
      importTripData(decodedData);
    } catch (error) {
      console.error('Failed to import data from URL parameter:', error);
    }
  }

  // Check for control panel visibility
  if (getURLParam('controls') === 'true') {
    const controlPanel =
      domElements.controlPanel || document.getElementById('control-panel');
    if (controlPanel) {
      controlPanel.style.display = 'flex';
      console.log('Control panel enabled via URL parameter');
    }
  }

  // Check for unit override
  const unitsParam = getURLParam('units');
  if (unitsParam) {
    if (unitsParam === 'miles' && !appState.useImperialUnits) {
      appState.useImperialUnits = true;
      updateDisplayElements();
      console.log('URL parameter: Switched to miles');
      showFeedback('Units: Kilometers → Miles', 'success');
    } else if (unitsParam === 'km' && appState.useImperialUnits) {
      appState.useImperialUnits = false;
      updateDisplayElements();
      console.log('URL parameter: Switched to kilometers');
      showFeedback('Units: Miles → Kilometers', 'success');
    }
  }

  // Check for distance overrides
  const totalDistanceParam = getURLParam('totalDistance');
  if (totalDistanceParam) {
    const newTotal = parseFloat(totalDistanceParam);
    if (newTotal > 0 && isFinite(newTotal)) {
      window.TOTAL_DISTANCE_KM = newTotal;
      appState.originalTotalDistance = newTotal;
      updateDisplayElements();
      console.log(`URL parameter: Set total distance to ${newTotal}km`);
      showFeedback(`Trip distance: ${newTotal}km`, 'success');
    }
  }

  // Check for distance adjustments
  const addDistanceParam = getURLParam('addDistance');
  if (addDistanceParam) {
    const distance = parseFloat(addDistanceParam);
    if (isFinite(distance)) {
      totalDistanceTraveled = Math.max(0, totalDistanceTraveled + distance);
      todayDistanceTraveled = Math.max(0, todayDistanceTraveled + distance);
      updateDisplayElements();
      debouncedSave();
      const action = distance >= 0 ? 'Added' : 'Adjusted';
      console.log(`URL parameter: ${action} ${Math.abs(distance)}km`);
      showFeedback(`${action} ${Math.abs(distance).toFixed(1)}km`, 'success');
    }
  }

  const setDistanceParam = getURLParam('setDistance');
  if (setDistanceParam) {
    const distance = parseFloat(setDistanceParam);
    if (distance >= 0 && isFinite(distance)) {
      totalDistanceTraveled = distance;
      todayDistanceTraveled = distance;
      updateDisplayElements();
      debouncedSave();
      console.log(`URL parameter: Set distance to ${distance}km`);
      showFeedback(`Set to ${distance.toFixed(1)}km`, 'success');
    }
  }

  const jumpToParam = getURLParam('jumpTo');
  if (jumpToParam) {
    const percent = parseFloat(jumpToParam);
    if (percent >= 0 && percent <= 100 && isFinite(percent)) {
      const targetDistance = (percent / 100) * TOTAL_DISTANCE_KM;
      totalDistanceTraveled = targetDistance;
      todayDistanceTraveled = targetDistance;
      updateDisplayElements();
      debouncedSave();
      console.log(
        `URL parameter: Jumped to ${percent}% (${targetDistance.toFixed(1)}km)`
      );
      showFeedback(`${percent}% progress`, 'success');
    }
  }

  // Check for special "smart streaming" mode
  if (getURLParam('stream') === 'true') {
    // DON'T show controls by default (stream-friendly)
    // Instead, enable hotkey support and show helpful message
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
}

// --- INITIALIZE AND START ---
// Check URL parameters first
checkURLParameters();

// Load any saved progress first
loadPersistedData();

// Update UI with loaded data (wait for DOM to be ready)
function initializeUI() {
  if (totalDistanceTraveled > 0 || todayDistanceTraveled > 0) {
    updateDisplayElements();
  }
}

// Initialize UI after DOM and cache are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeDOMCache();
    initializeUI();
  });
} else {
  initializeDOMCache();
  initializeUI();
}

// Start the RTIRL connection
connectToRtirl();

// Keyboard hotkey support for stream-friendly control access
let controlsVisible = false;

function toggleControls() {
  // Use cached DOM element or fallback
  const controlPanel =
    domElements.controlPanel || document.getElementById('control-panel');
  if (controlPanel) {
    controlsVisible = !controlsVisible;
    controlPanel.style.display = controlsVisible ? 'flex' : 'none';

    if (controlsVisible) {
      showFeedback(
        '🎛️ Controls visible - press Ctrl+H to hide',
        'success',
        4000
      );
      // Auto-hide after 15 seconds for safety
      setTimeout(() => {
        if (controlsVisible) {
          toggleControls();
          showFeedback('🔒 Controls auto-hidden for stream', 'warning', 3000);
        }
      }, 15000);
    } else {
      showFeedback('🔒 Controls hidden from stream', 'success', 2000);
    }
  }
}

// Keyboard event listener for hotkeys
document.addEventListener('keydown', function (event) {
  // Ctrl+H to toggle controls
  if (event.ctrlKey && event.key === 'h') {
    event.preventDefault();
    toggleControls();
  }

  // Quick hotkeys for common actions (while controls are hidden)
  if (event.ctrlKey && event.shiftKey) {
    switch (event.key) {
      case 'R': // Ctrl+Shift+R = Reset Today
        event.preventDefault();
        resetTodayDistance();
        break;
      case 'B': // Ctrl+Shift+B = Backup
        event.preventDefault();
        exportTripData();
        break;
      case 'T': // Ctrl+Shift+T = Reset Trip (with confirmation)
        event.preventDefault();
        if (confirm('⚠️ Reset entire trip? This cannot be undone!')) {
          resetTripProgress();
        }
        break;
    }
  }
});

// Demo mode simulation
function startDemoMode() {
  const demoIncrement = 0.5; // 500m per update
  const demoInterval = 2000; // Every 2 seconds

  // Set a demo start location (Prague)
  if (!startLocation) {
    startLocation = { lat: 50.0755, lon: 14.4378 };
    lastPosition = startLocation;
  }

  const demoTimer = setInterval(() => {
    // Use current totalDistanceTraveled (respects manual changes)
    // instead of maintaining separate counter
    totalDistanceTraveled = Math.min(
      totalDistanceTraveled + demoIncrement,
      TOTAL_DISTANCE_KM
    );
    todayDistanceTraveled = totalDistanceTraveled;

    // Update UI
    updateDisplayElements();
    debouncedSave();

    // Show progress in current units
    const kmToMiles = 0.621371;
    const unitMultiplier = appState.useImperialUnits ? kmToMiles : 1;
    const unitSuffix = appState.useImperialUnits ? 'mi' : 'km';
    const currentTotal = (totalDistanceTraveled * unitMultiplier).toFixed(2);
    const currentTarget = (TOTAL_DISTANCE_KM * unitMultiplier).toFixed(2);

    console.log(
      `🎭 Demo: ${currentTotal}${unitSuffix} / ${currentTarget}${unitSuffix}`
    );

    // Stop demo when trip is complete
    if (totalDistanceTraveled >= TOTAL_DISTANCE_KM) {
      clearInterval(demoTimer);
      showFeedback('🎯 Demo trip completed!', 'success');
      console.log('🎯 Demo mode: Trip completed!');
    }
  }, demoInterval);

  // Store timer for cleanup
  appState.demoTimer = demoTimer;
}

// --- DEMO/TESTING CONSOLE FUNCTIONS ---
// These functions are available in the browser console for testing and demo purposes

function addDistance(km) {
  if (typeof km !== 'number' || !isFinite(km)) {
    console.error(
      '❌ addDistance() requires a number (use negative to subtract)'
    );
    return;
  }

  const previousTotal = totalDistanceTraveled;
  totalDistanceTraveled = Math.max(0, totalDistanceTraveled + km);
  todayDistanceTraveled = Math.max(0, todayDistanceTraveled + km);

  updateDisplayElements();
  debouncedSave();

  const action = km >= 0 ? 'Added' : 'Subtracted';
  const amount = Math.abs(km);
  console.log(
    `✅ ${action} ${amount.toFixed(2)}km (${previousTotal.toFixed(2)}km → ${totalDistanceTraveled.toFixed(2)}km)`
  );
  showFeedback(`${action} ${amount.toFixed(2)}km`, 'success');
}

function setDistance(km) {
  if (typeof km !== 'number' || !isFinite(km) || km < 0) {
    console.error('❌ setDistance() requires a positive number');
    return;
  }

  const previousTotal = totalDistanceTraveled;
  totalDistanceTraveled = km;
  todayDistanceTraveled = km; // Assume all distance was traveled today for demo

  updateDisplayElements();
  debouncedSave();

  console.log(
    `✅ Set distance: ${previousTotal.toFixed(2)}km → ${totalDistanceTraveled.toFixed(2)}km`
  );
  showFeedback(`Set to ${km.toFixed(2)}km`, 'success');
}

function convertToMiles() {
  if (appState.useImperialUnits) {
    console.log('ℹ️ Already using miles');
    return;
  }

  appState.useImperialUnits = true;
  updateDisplayElements();

  console.log('✅ Converted display to miles (Imperial units)');
  showFeedback('Display: Kilometers → Miles', 'success');
}

function convertToKilometers() {
  if (!appState.useImperialUnits) {
    console.log('ℹ️ Already using kilometers');
    return;
  }

  appState.useImperialUnits = false;
  updateDisplayElements();

  console.log('✅ Converted display to kilometers (Metric units)');
  showFeedback('Display: Miles → Kilometers', 'success');
}

function setTotalDistance(km) {
  if (typeof km !== 'number' || !isFinite(km) || km <= 0) {
    console.error('❌ setTotalDistance() requires a positive number');
    return;
  }

  const previousTotal = TOTAL_DISTANCE_KM;

  // Store override in appState for calculations
  appState.totalDistanceOverride = km;
  appState.originalTotalDistance = km;

  // Update the global reference used in calculations
  window.TOTAL_DISTANCE_KM = km;

  updateDisplayElements();

  console.log(
    `✅ Set total trip distance: ${previousTotal.toFixed(2)}km → ${km.toFixed(2)}km`
  );
  showFeedback(`Trip distance: ${km.toFixed(2)}km`, 'success');
}

function jumpToProgress(percent) {
  if (
    typeof percent !== 'number' ||
    !isFinite(percent) ||
    percent < 0 ||
    percent > 100
  ) {
    console.error('❌ jumpToProgress() requires a number between 0-100');
    return;
  }

  const targetDistance = (percent / 100) * TOTAL_DISTANCE_KM;
  const previousTotal = totalDistanceTraveled;

  totalDistanceTraveled = targetDistance;
  todayDistanceTraveled = targetDistance; // Assume all distance was traveled today for demo

  updateDisplayElements();
  debouncedSave();

  console.log(
    `✅ Jumped to ${percent}% progress (${previousTotal.toFixed(2)}km → ${targetDistance.toFixed(2)}km)`
  );
  showFeedback(`${percent}% progress`, 'success');
}

// Helper function to show all available console commands
function showConsoleCommands() {
  console.log(`
🎮 TRIP OVERLAY CONSOLE COMMANDS:

📏 DISTANCE MANIPULATION:
• addDistance(km) - Add/subtract distance (use negative to subtract)
  Example: addDistance(5.5) or addDistance(-2.1)

• setDistance(km) - Set total distance to specific value
  Example: setDistance(100.5)

• jumpToProgress(percent) - Jump to specific percentage (0-100)
  Example: jumpToProgress(75)

🌍 UNIT CONVERSION:
• convertToMiles() - Switch display to miles
• convertToKilometers() - Switch display to kilometers

⚙️ TRIP SETTINGS:
• setTotalDistance(km) - Change the total trip distance target
  Example: setTotalDistance(500)

🔄 RESET FUNCTIONS:
• resetTripProgress() - Start completely fresh
• resetTodayDistance() - Reset today's distance only
• resetAutoStartLocation() - Re-detect start location

💾 DATA MANAGEMENT:
• exportTripData() - Download backup file
• easyImport() - Import backup with simple dialog (recommended)
• importTripData(jsonString) - Import backup manually

Type any function name to use it. Current trip: ${totalDistanceTraveled.toFixed(2)}/${TOTAL_DISTANCE_KM}km
  `);
}

// Make functions globally available for console access
window.addDistance = addDistance;
window.setDistance = setDistance;
window.convertToMiles = convertToMiles;
window.convertToKilometers = convertToKilometers;
window.setTotalDistance = setTotalDistance;
window.jumpToProgress = jumpToProgress;
window.showConsoleCommands = showConsoleCommands;

console.log(
  '🎮 Type showConsoleCommands() to see all available demo functions'
);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (appState.connection?.readyState === WebSocket.OPEN) {
    appState.connection.close();
  }
  if (appState.demoTimer) {
    clearInterval(appState.demoTimer);
  }
  if (appState.uiUpdateTimeout) {
    clearTimeout(appState.uiUpdateTimeout);
  }
});
