// Dashboard Overlay - Optimized for Streaming, IRLToolkit, and Cloud OBS
// Clean, DRY, and robust implementation

// Import centralized configuration and RTIRL module
import { CONFIG, WEATHER_ICONS, OWM_ICON_BASE_URL } from '../utils/config.js';
import { calculateDistance } from '../utils/gps.js';
import {
  initRTIRL,
  addLocationCallback,
  getConnectionState,
} from '../utils/rtirl.js';
import { logger } from '../utils/logger.js';

// Application state
const dashboardState = {
  timers: {},
  lastPosition: null,
  isConnected: false,
  weather: null,
  timezone: null,
  timezoneAbbr: null,
  rtirtLocationListener: null,
  hasFetchedInitialWeather: false, // Flag to control initial fetch
  lastLocationName: '',
  wasInDemoMode: false, // Flag to track demo mode transition
};

// DOM elements cache
const elements = {};

// --- Combined Dashboard DOM Cache ---
const combinedElements = {
  location: document.getElementById('location-combined'),
  weatherIcon: document.getElementById('weather-icon-combined'),
  weatherTemp: document.getElementById('weather-temp-combined'),
  weatherDesc: document.getElementById('weather-desc-combined'),
  date: document.getElementById('date-combined'),
  time: document.getElementById('time-combined'),
  timezone: document.getElementById('timezone-combined'),
  weatherFeelsLike: document.getElementById('weather-feels-like-combined'),
  weatherHumidity: document.getElementById('weather-humidity-combined'),
  weatherSecondaryDetails: document.getElementById('weather-secondary-details'),
  weatherWind: document.getElementById('weather-wind-combined'),
  weatherUvi: document.getElementById('weather-uvi-combined'),
  sunriseSunset: document.getElementById('sunrise-sunset-combined'),
  weatherExtra: document.getElementById('weather-extra-combined'),
  speedDisplay: document.getElementById('speed-display'),
  speedValueMph: document.getElementById('speed-value-mph'),
  speedValueKmh: document.getElementById('speed-value-kmh'),
  speedNumMph: document.querySelector('#speed-value-mph .speed-number'),
  speedUnitMph: document.querySelector('#speed-value-mph .speed-unit'),
  speedNumKmh: document.querySelector('#speed-value-kmh .speed-number'),
  speedUnitKmh: document.querySelector('#speed-value-kmh .speed-unit'),
};

// --- Helpers ---
const $ = id => document.getElementById(id);
const setText = (el, text) => {
  if (el) {
    el.textContent = text;
  }
};
const setClass = (el, cls) => {
  if (el) {
    el.className = cls;
  }
};

// Robustly clear speed display storage
function clearSpeedDisplayStorage() {
  localStorage.removeItem('tripOverlaySpeed');
  localStorage.removeItem('tripOverlayMode');
}

// --- Debug Utilities ---
function getStatus() {
  // Renamed for clarity
  const rtirtConnection = getConnectionState();
  const tripState = window.appState || {}; // Safely get trip state

  const {
    totalDistanceTraveled = 0,
    todayDistanceTraveled = 0,
    originalTotalDistance = 0,
    currentMode = 'N/A',
    useImperialUnits = false,
  } = tripState;

  const kmToMiles = 0.621371;
  const unitMultiplier = useImperialUnits ? kmToMiles : 1;
  const units = useImperialUnits ? 'miles' : 'km';
  const progress =
    originalTotalDistance > 0
      ? (totalDistanceTraveled / originalTotalDistance) * 100
      : 0;

  logger(`
🔍 UNIFIED STATUS REPORT
============================================

🔌 CONNECTION
   • Library Connected: ${rtirtConnection.isConnected ? '✅ YES' : '❌ NO'}
   • Demo Mode: ${rtirtConnection.isDemoMode ? '✅ YES' : '❌ NO'}
   • Data Flow: ${dashboardState.isConnected ? '✅ Receiving' : '❌ Not receiving'}
   • User ID: ${CONFIG.rtirl.userId}

📊 TRIP PROGRESS
   • Movement Mode: ${currentMode}
   • Total Distance: ${(totalDistanceTraveled * unitMultiplier).toFixed(2)} ${units}
   • Today's Distance: ${(todayDistanceTraveled * unitMultiplier).toFixed(2)} ${units}
   • Progress: ${progress.toFixed(1)}%

🌤️ DASHBOARD
   • Weather: ${dashboardState.weather ? `${dashboardState.weather.current.temp.toFixed(1)}°${CONFIG.weather.useMetric ? 'C' : 'F'}, ${dashboardState.weather.current.weather[0].description}` : '❌ None'}
   • Timezone: ${dashboardState.timezone || '❌ Not set'}
   • Last Location: ${dashboardState.lastPosition ? `${dashboardState.lastPosition.latitude.toFixed(4)}, ${dashboardState.lastPosition.longitude.toFixed(4)}` : '❌ None'}

------------------------------------
`);

  // Return a combined status object for programmatic access
  return {
    connection: rtirtConnection,
    trip: tripState,
    dashboard: dashboardState,
  };
}

// --- Initialization ---
function initializeDashboard() {
  logger('🚀 Dashboard: Starting initialization...');
  logger('📋 Dashboard: Configuration:', CONFIG);

  // Check emoji support and add class if needed
  if (!supportsEmoji()) {
    document.body.classList.add('no-emoji');
    logger.warn(
      '⚠️ Dashboard: Limited emoji support detected, using text fallbacks'
    );
  }

  cacheDOM();
  handleURLParameters();
  // Robust: clear speed display storage if not in demo mode
  const params = new URLSearchParams(window.location.search);
  const isDemo = params.get('demo') === 'true';
  if (!isDemo) {
    clearSpeedDisplayStorage();
  }
  initTime();
  initRTIRLDashboard();

  logger('✅ Dashboard: Initialization complete');

  window.TripOverlay = window.TripOverlay || {};
  window.TripOverlay.getStatus = getStatus;

  // Also expose directly for backwards compatibility
  window.getStatus = getStatus;

  // Make dashboardState available for unified status
  window.dashboardState = dashboardState;
}

function cacheDOM() {
  [
    'timeDisplay',
    'timeDate',
    'timeTimezone',
    'timeCorner',
    'weatherIcon',
    'weatherTemp',
    'weatherDescription',
    'weatherFeelsLike',
    'weatherLocation',
    'weatherCorner',
    'locationCoords',
    'locationAccuracy',
    'locationCorner',
    'connectionStatus',
  ].forEach(id => {
    elements[id] = $(id.replace(/([A-Z])/g, '-$1').toLowerCase());
  });
}

function handleURLParameters() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('time') === 'false') {
    elements.timeCorner?.classList.add('hidden');
  }
  if (params.get('weather') === 'false') {
    elements.weatherCorner?.classList.add('hidden');
  }
  if (params.get('location') === 'false') {
    elements.locationCorner?.classList.add('hidden');
  }
  if (params.get('format') === '12') {
    CONFIG.time.use24Hour = false;
  }
  if (params.get('timezone')) {
    dashboardState.timezone = params.get('timezone');
  }
  if (params.get('demo') === 'true') {
    // Dashboard demo mode: static location for weather/display testing only
    // Default to Vienna timezone in demo mode unless overridden
    if (!dashboardState.timezone) {
      dashboardState.timezone = 'Europe/Vienna';
    }
    startDemoMode();
  }
}

// --- Time ---
function initTime() {
  logger('⏰ Dashboard: Initializing time display');
  logger('⚙️ Dashboard: Time config:', {
    use24Hour: CONFIG.time.use24Hour,
    showSeconds: CONFIG.time.showSeconds,
    updateInterval: CONFIG.time.updateInterval,
    timezone: dashboardState.timezone || 'auto-detect',
  });
  updateTimeDisplay();
  dashboardState.timers.time = setInterval(
    updateTimeDisplay,
    CONFIG.time.updateInterval
  );
}
function updateTimeDisplay() {
  const now = new Date();
  const timeZone =
    dashboardState.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const timeOptions = {
    hour12: !CONFIG.time.use24Hour,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone,
  };
  if (CONFIG.time.showSeconds) {
    timeOptions.second = '2-digit';
  }
  const timeString = now.toLocaleTimeString('en-US', timeOptions);

  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timeZone,
  });

  // Prefer abbreviation from API if available
  const tzAbbr =
    dashboardState.timezoneAbbr || getTimezoneAbbreviation(timeZone);

  updateCombinedTime(dateString, timeString, tzAbbr);
}
function getTimezoneAbbreviation(timeZone) {
  try {
    const date = new Date();
    // Get abbreviation for the target timezone
    return date
      .toLocaleTimeString('en-US', {
        timeZone,
        timeZoneName: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      .split(' ')
      .pop();
  } catch {
    return timeZone;
  }
}

// --- RTIRL Location ---
function initRTIRLDashboard() {
  // Register callback for location updates
  addLocationCallback((locationUpdate, type) => {
    if (type === 'hidden') {
      updateConnectionStatus('Location hidden', 'warning');
      return;
    }

    if (locationUpdate) {
      handleLocationData(locationUpdate);
    }
  });

  // Check if dashboard is in its own demo mode
  const isDashboardDemo =
    new URLSearchParams(window.location.search).get('demo') === 'true';

  if (isDashboardDemo) {
    // Dashboard demo mode: don't initialize RTIRL, use static demo data instead
    logger.warn(
      '🎭 Dashboard: Using dashboard-specific demo mode (static location)'
    );
    updateConnectionStatus('Dashboard demo mode (static)', 'connected');
    return;
  }

  // Initialize RTIRL connection for live data
  const result = initRTIRL({
    moduleName: 'Dashboard',
    onConnectionChange: (connected, status) => {
      if (connected) {
        updateConnectionStatus(
          'RTIRL library connected, waiting for location...',
          'connecting'
        );
      } else {
        updateConnectionStatus(status || 'Disconnected', 'error');
      }
    },
  });

  if (!result.success && !result.demo) {
    updateConnectionStatus(result.error || 'Connection failed', 'error');
  }
}
function handleLocationData(locationUpdate) {
  if (
    !locationUpdate ||
    !locationUpdate.latitude ||
    !locationUpdate.longitude
  ) {
    logger.warn('📍 Dashboard: Location is hidden or streamer is offline');
    updateCombinedLocation('Location hidden');
    updateConnectionStatus('Location hidden or streamer offline', 'warning');
    dashboardState.isConnected = false;
    updateSpeedDisplay(0, 'STATIONARY');
    // Robust: clear speed display storage if not in demo mode
    const params = new URLSearchParams(window.location.search);
    const isDemo = params.get('demo') === 'true';
    if (!isDemo) {
      clearSpeedDisplayStorage();
    }
    return;
  }

  dashboardState.lastPosition = {
    latitude: locationUpdate.latitude,
    longitude: locationUpdate.longitude,
    accuracy: locationUpdate.accuracy || 0,
    timestamp: locationUpdate.timestamp,
  };

  // Check if this is demo location data (Vienna coordinates)
  const isDemoData =
    locationUpdate.latitude === 48.1465 &&
    locationUpdate.longitude === 17.1235 &&
    locationUpdate.speed === 15.5;

  // If this is demo data, set the demo flag
  if (isDemoData) {
    dashboardState.wasInDemoMode = true;
  }

  // If this is real location data (not demo) and we were previously in demo mode, reset speed display
  if (!isDemoData && dashboardState.wasInDemoMode) {
    logger(
      '🔄 Dashboard: Transitioning from demo mode to real location, resetting speed display'
    );
    updateSpeedDisplay(0, 'STATIONARY');
    dashboardState.wasInDemoMode = false;
    clearSpeedDisplayStorage();
    return;
  }

  // Simple speed display update - just read current values
  const speed = parseFloat(localStorage.getItem('tripOverlaySpeed')) || 0;
  const currentMode = localStorage.getItem('tripOverlayMode') || 'STATIONARY';
  updateSpeedDisplay(speed, currentMode);

  // Robust: clear speed display storage if not cycling or speed <= 0 and not in demo mode
  const params = new URLSearchParams(window.location.search);
  const isDemo = params.get('demo') === 'true';
  if (!isDemo && (currentMode !== 'CYCLING' || speed <= 0)) {
    clearSpeedDisplayStorage();
  }

  // Only update connection status if it's changed
  if (!dashboardState.isConnected) {
    dashboardState.isConnected = true;
    updateConnectionStatus(
      'Connected and receiving location data',
      'connected'
    );
    logger('✅ Dashboard: Location data flow established');
  }
  updateLocationDisplay();

  // Only fetch weather on the first location update
  if (!dashboardState.hasFetchedInitialWeather) {
    logger(
      '🌤️ Dashboard: First location received, fetching initial weather...'
    );
    updateWeatherData();
    dashboardState.hasFetchedInitialWeather = true;
  }
}
function updateLocationDisplay() {
  const pos = dashboardState.lastPosition;
  if (!pos) {
    logger.warn('⚠️ Dashboard: No position data for location display');
    updateCombinedLocation('--');
    return;
  }

  // Throttle reverse geocoding to prevent API spam
  const now = Date.now();
  const lastGeocode = dashboardState.lastGeocodeTime || 0;
  const timeSinceLastGeocode = now - lastGeocode;

  const shouldGeocode =
    !dashboardState.lastGeocodedPosition ||
    timeSinceLastGeocode > 30000 ||
    getDistanceFromLastGeocode(pos) > 0.1; // 0.1km = ~100m

  if (shouldGeocode) {
    updateCombinedLocation('Detecting location...');
    logger(
      '🌍 Dashboard: Starting reverse geocoding for:',
      pos.latitude,
      pos.longitude
    );
    dashboardState.lastGeocodeTime = now;
    dashboardState.lastGeocodedPosition = {
      lat: pos.latitude,
      lon: pos.longitude,
    };
    reverseGeocode(pos.latitude, pos.longitude);
  } else {
    // If we have a location name and we are not geocoding, just keep it.
    if (dashboardState.lastLocationName) {
      updateCombinedLocation(dashboardState.lastLocationName);
    } else {
      // Otherwise, show coordinates as a fallback.
      updateCombinedLocation(
        `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`
      );
    }
  }
}

function getDistanceFromLastGeocode(currentPos) {
  if (!dashboardState.lastGeocodedPosition) {
    return Infinity;
  }

  const lastPos = dashboardState.lastGeocodedPosition;
  return calculateDistance(
    { lat: lastPos.lat, lon: lastPos.lon },
    { lat: currentPos.latitude, lon: currentPos.longitude }
  );
}

async function reverseGeocode(lat, lon) {
  try {
    // Validate coordinates
    if (
      !isFinite(lat) ||
      !isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      throw new Error(`Invalid coordinates: ${lat}, ${lon}`);
    }

    logger('🌐 Dashboard: Fetching address from OpenStreetMap...');

    // Add timeout and proper headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TripOverlay/1.0 (Cycling Trip Tracker)',
        },
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Geocoding failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid geocoding response format');
    }

    if (data && data.address) {
      // Extract location components with priority order
      const district =
        data.address.district ||
        data.address.borough ||
        data.address.neighbourhood ||
        data.address.suburb ||
        data.address.quarter ||
        data.address.city_district;

      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.municipality;

      const country = data.address.country;

      // Build location string: "District, City, Country" or "City, Country"
      const locationParts = [];
      if (district && district !== city) {
        locationParts.push(district);
      }
      if (city) {
        locationParts.push(city);
      }
      if (country) {
        locationParts.push(country);
      }

      const location = locationParts.filter(Boolean).join(', ');
      dashboardState.lastLocationName = location; // Store the successful location name
      logger('📍 Dashboard: Location resolved to:', location);
      logger('🏘️ Dashboard: Address components:', {
        district: district || 'none',
        city: city || 'none',
        country: country || 'none',
      });

      updateCombinedLocation(location || '--');
    } else {
      logger.warn('⚠️ Dashboard: No address data in geocoding response');
      updateCombinedLocation('Location unavailable');
    }
  } catch (error) {
    dashboardState.lastLocationName = ''; // Clear the name on error
    logger.error('❌ Dashboard: Reverse geocoding failed:', error);

    // Handle different error types gracefully
    if (error.name === 'AbortError') {
      updateCombinedLocation('Location lookup timed out');
    } else if (
      error.name === 'TypeError' &&
      error.message.includes('Failed to fetch')
    ) {
      updateCombinedLocation('Network error');
    } else if (error.message.includes('Invalid coordinates')) {
      updateCombinedLocation('Invalid GPS coordinates');
    } else {
      updateCombinedLocation('Location unavailable');
    }
  }
}

// --- Weather ---
async function updateWeatherData() {
  const pos = dashboardState.lastPosition;
  if (!pos) {
    logger.warn('⚠️ Dashboard: No position data for weather update');
    return;
  }
  try {
    const units = CONFIG.weather.useMetric ? 'metric' : 'imperial';
    const weatherUrl = `/weather?lat=${pos.latitude}&lon=${pos.longitude}&units=${units}`;
    logger('🌤️ Dashboard: Fetching weather from proxy:', weatherUrl);

    // Add timeout and network error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(weatherUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error details from response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: 'Invalid response format',
          message: response.statusText,
        };
      }

      throw new Error(
        `Weather fetch failed: ${response.status} - ${errorData.error || 'Unknown error'} - ${errorData.message || 'No message'}`
      );
    }

    const data = await response.json();

    // Validate weather data structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid weather data format received');
    }

    // Set timezone from API response if available
    if (data.timezone) {
      dashboardState.timezone = data.timezone;
      logger(`⏰ Dashboard: Timezone updated to ${data.timezone} from API`);
    }

    dashboardState.weather = data;
    updateWeatherDisplay(data);

    // Clear any existing timer and start the 5-minute interval
    clearTimeout(dashboardState.timers.weather);
    dashboardState.timers.weather = setTimeout(
      updateWeatherData,
      CONFIG.weather.updateInterval
    );
    logger(
      `⏰ Dashboard: Weather updated. Next update in ${CONFIG.weather.updateInterval / 1000}s.`
    );
  } catch (error) {
    console.error('❌ Dashboard: Weather update failed:', error);

    // Handle different error types
    if (error.name === 'AbortError') {
      logger.warn(
        '⏰ Dashboard: Weather request timed out, will retry on next interval'
      );
      updateCombinedWeather('⏰', '--°', 'Request timed out');
    } else if (
      error.name === 'TypeError' &&
      error.message.includes('Failed to fetch')
    ) {
      logger.warn('🌐 Dashboard: Network error, will retry on next interval');
      updateCombinedWeather('🌐', '--°', 'Network error');
    } else {
      logger.warn(
        '⚠️ Dashboard: Weather service error, will retry on next interval'
      );
      updateCombinedWeather('⚠️', '--°', 'Service unavailable');
    }

    // Set fallback text for older elements
    setText(elements.weatherDescription, 'Weather unavailable');

    // Still schedule next update to retry
    clearTimeout(dashboardState.timers.weather);
    dashboardState.timers.weather = setTimeout(
      updateWeatherData,
      CONFIG.weather.updateInterval
    );
  }
}

function updateWeatherDisplay(weather) {
  if (!weather || !weather.current) {
    logger.warn('⚠️ Dashboard: Invalid weather data for display');
    updateCombinedWeather('🌤', '--°', 'Loading...');
    renderHourlyForecast([]);
    return;
  }
  const current = weather.current;
  const tempUnit = CONFIG.weather.useMetric ? 'C' : 'F';
  const temp = `${current.temp.toFixed(1)}°${tempUnit}`;
  const feelsLike =
    current.feels_like !== undefined
      ? `${current.feels_like.toFixed(1)}°${tempUnit}`
      : null;
  const humidity =
    current.humidity !== undefined ? `${current.humidity}%` : null;
  let wind =
    current.wind_speed !== undefined
      ? `${(current.wind_speed * 3.6).toFixed(1)} km/h`
      : null;
  if (wind && current.wind_deg !== undefined) {
    wind += ` ${degToCompass(current.wind_deg)}`;
  }
  const desc = current.weather[0].description || 'Unknown';
  const weatherIcon = current.weather[0].icon || '01d'; // Use OWM icon, fallback to clear day

  logger(
    `🌡️ Dashboard: Weather updated - ${temp} ${desc} (icon: ${weatherIcon})`
  );

  updateCombinedWeather(weatherIcon, temp, desc);

  // Display sunrise and sunset times
  if (weather.current.sunrise && weather.current.sunset) {
    const sunriseTime = new Date(
      weather.current.sunrise * 1000
    ).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: weather.timezone,
    });
    const sunsetTime = new Date(
      weather.current.sunset * 1000
    ).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: weather.timezone,
    });
    updateCombinedSunriseSunset(
      `Sunrise ${sunriseTime} · Sunset ${sunsetTime}`
    );
  } else {
    updateCombinedSunriseSunset('');
  }

  // Show 'feels like' and humidity on the first line
  const firstLineDetails = [];
  if (feelsLike) {
    firstLineDetails.push(`Feels like: ${feelsLike}`);
  }
  if (humidity) {
    firstLineDetails.push(`Humidity: ${humidity}`);
  }

  // Show wind and UVI on the second line
  const secondLineDetails = [];
  if (wind) {
    secondLineDetails.push(`Wind: ${wind}`);
  }

  // Add UVI if available
  const uvi = current.uvi !== undefined ? current.uvi : null;
  if (uvi !== null) {
    const uviClass = getUviClass(uvi);
    const uviText = `UV Index: <span class="${uviClass}" style="font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace; letter-spacing: 0.5px;">${uvi.toFixed(1)}</span>`;
    secondLineDetails.push(uviText);
  }

  // Update the display
  if (combinedElements.weatherSecondaryDetails) {
    const hasFirstLine = firstLineDetails.length > 0;
    const hasSecondLine = secondLineDetails.length > 0;

    // Show the container if we have any details
    combinedElements.weatherSecondaryDetails.style.display =
      hasFirstLine || hasSecondLine ? '' : 'none';

    // Update first line (feels like and humidity)
    const firstLineElement =
      combinedElements.weatherSecondaryDetails.querySelector(
        '.weather-secondary-line:first-child'
      );
    if (firstLineElement) {
      if (hasFirstLine) {
        firstLineElement.style.display = '';
        firstLineElement.innerHTML = firstLineDetails.join(' · ');
      } else {
        firstLineElement.style.display = 'none';
      }
    }

    // Update second line (wind and UVI)
    const secondLineElement =
      combinedElements.weatherSecondaryDetails.querySelector(
        '.weather-secondary-line:last-child'
      );
    if (secondLineElement) {
      if (hasSecondLine) {
        secondLineElement.style.display = '';
        secondLineElement.innerHTML = secondLineDetails.join(' · ');
      } else {
        secondLineElement.style.display = 'none';
      }
    }
  }

  // Render hourly forecast (next 5 hours)
  if (weather && Array.isArray(weather.hourly)) {
    renderHourlyForecast(
      weather.hourly.slice(1, 6),
      tempUnit,
      weather.timezone
    );
  } else {
    renderHourlyForecast([]);
  }
}

// Render the next 5 hours of forecast below the main dashboard card
function renderHourlyForecast(hourly, tempUnit = 'C', timeZone = undefined) {
  const container = document.getElementById('dashboard-hourly');
  if (!container) {
    return;
  }
  // Remove offline note logic; only show 'No forecast data' if empty
  if (!Array.isArray(hourly) || hourly.length === 0) {
    container.innerHTML =
      '<div style="width:100%;text-align:center;color:#bbb;font-size:0.95em;">No forecast data</div>';
    return;
  }
  container.innerHTML = hourly
    .map(hour => {
      const dt = new Date(hour.dt * 1000);
      const hourStr = dt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone,
      });
      const icon = hour.weather[0]?.icon || '01d';
      const desc = hour.weather[0]?.description || '';
      const temp = `${hour.temp.toFixed(1)}°${tempUnit}`;
      return `
        <div class="hourly-forecast-block">
          <div class="hourly-forecast-time">${hourStr}</div>
          <img class="hourly-forecast-icon" src="${OWM_ICON_BASE_URL}${icon}@2x.png" alt="${desc}" onerror="this.style.display='none'" />
          <div class="hourly-forecast-temp">${temp}</div>
          <div class="hourly-forecast-desc">${desc}</div>
        </div>
      `;
    })
    .join('');
}

// --- Status & Demo ---
function updateConnectionStatus(message, type) {
  logger(`📡 Dashboard: Connection status changed to "${message}" (${type})`);
  setText(elements.connectionStatus, message);
  setClass(elements.connectionStatus, `corner-detail status-${type}`);
}
function startDemoMode() {
  logger('🎭 Dashboard: Starting demo mode with Vienna coordinates');

  // Set the demo mode flag
  dashboardState.wasInDemoMode = true;

  setTimeout(() => {
    const demoData = {
      latitude: 48.1465,
      longitude: 17.1235,
      accuracy: 5,
      speed: 15.5, // Add demo speed for testing
    };

    // Set demo cycling mode for speed display testing
    if (!window.appState) {
      window.appState = {};
    }
    window.appState.currentMode = 'CYCLING';

    // Populate localStorage for speed display in dashboard demo mode
    localStorage.setItem('tripOverlaySpeed', demoData.speed.toFixed(1));
    localStorage.setItem('tripOverlayMode', window.appState.currentMode);

    logger('🎭 Dashboard: Injecting demo location data:', demoData);
    logger('🚴 Dashboard: Demo mode set to CYCLING for speed display testing');
    handleLocationData(demoData);
  }, 2000);
  updateConnectionStatus('Demo mode', 'connected');
}

// --- Cleanup ---
window.addEventListener('beforeunload', () => {
  Object.values(dashboardState.timers).forEach(timer => {
    if (timer) {
      clearInterval(timer);
    }
  });
  if (dashboardState.rtirtLocationListener) {
    dashboardState.rtirtLocationListener.remove();
  }
});

// --- Update Combined Dashboard ---
function updateCombinedLocation(locationText) {
  if (combinedElements.location) {
    combinedElements.location.textContent = locationText || '--';
  }
}

// --- Update Combined Weather with OpenWeatherMap Icons ---
function updateCombinedWeather(weatherIcon, temp, desc) {
  if (combinedElements.weatherIcon) {
    const el = combinedElements.weatherIcon;
    el.innerHTML = '';
    el.className = 'weather-icon';

    // Use OpenWeatherMap icon if available
    if (weatherIcon && weatherIcon.length === 3) {
      const img = document.createElement('img');
      img.src = `${OWM_ICON_BASE_URL}${weatherIcon}@2x.png`;
      img.alt = desc;
      img.style.height = '1.2em';
      img.style.verticalAlign = 'middle';
      img.style.display = 'inline-block';
      img.onerror = () => {
        // Fallback to emoji if image fails to load
        const weatherCode = dashboardState.weather?.current?.weather[0]?.id;
        const fallbackEmoji = WEATHER_ICONS[weatherCode] || '🌤';
        el.textContent = fallbackEmoji;
        el.className = 'weather-icon';
      };
      el.appendChild(img);
    } else {
      // Fallback to emoji if no icon provided
      const weatherCode = dashboardState.weather?.current?.weather[0]?.id;
      const fallbackEmoji = WEATHER_ICONS[weatherCode] || '🌤';
      el.textContent = fallbackEmoji;
      el.className = 'weather-icon';
    }
  }
  if (combinedElements.weatherTemp) {
    combinedElements.weatherTemp.textContent = temp || '--°';
  }
  if (combinedElements.weatherDesc) {
    combinedElements.weatherDesc.textContent = desc || 'Loading...';
  }
}

function updateCombinedTime(dateStr, timeStr, tzStr) {
  if (document.getElementById('date-part')) {
    document.getElementById('date-part').textContent = dateStr || '--';
  }
  if (document.getElementById('time-part')) {
    document.getElementById('time-part').textContent = timeStr || '--:--:--';
  }
  if (document.getElementById('timezone-part')) {
    document.getElementById('timezone-part').textContent = tzStr || '--';
  }
}

function updateCombinedSunriseSunset(text) {
  if (combinedElements.sunriseSunset) {
    combinedElements.sunriseSunset.textContent = text;
  }
}

// Function to detect emoji support
function supportsEmoji() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const smile = '😀';

  ctx.textBaseline = 'top';
  ctx.font = '32px Arial';
  ctx.fillText(smile, 0, 0);

  return ctx.getImageData(16, 16, 1, 1).data[0] !== 0;
}

// Helper: Convert wind degrees to compass direction
function degToCompass(num) {
  const val = Math.floor(num / 22.5 + 0.5);
  const arr = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  return arr[val % 16];
}

// Helper: Get UV Index color class based on value
function getUviClass(uvi) {
  if (uvi <= 2) {
    return 'uvi-low';
  } else if (uvi <= 5) {
    return 'uvi-moderate';
  } else if (uvi <= 7) {
    return 'uvi-high';
  } else if (uvi <= 10) {
    return 'uvi-very-high';
  } else {
    return 'uvi-extreme';
  }
}

// --- Speed Display Functions ---
function updateSpeedDisplay(speed, mode) {
  if (
    !combinedElements.speedDisplay ||
    !combinedElements.speedNumMph ||
    !combinedElements.speedNumKmh
  ) {
    return;
  }

  // Only show speed display when in cycling mode and speed > 0
  if (mode === 'CYCLING' && speed > 0) {
    const mph = (speed * 0.621371).toFixed(1);
    combinedElements.speedNumMph.textContent = mph;
    combinedElements.speedNumKmh.textContent = speed.toFixed(1);
    combinedElements.speedDisplay.style.display = 'inline-flex';
  } else {
    combinedElements.speedDisplay.style.display = 'none';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}

window.addEventListener('storage', event => {
  if (event.key === 'tripOverlaySpeed' || event.key === 'tripOverlayMode') {
    const speed = parseFloat(localStorage.getItem('tripOverlaySpeed')) || 0;
    const mode = localStorage.getItem('tripOverlayMode') || 'STATIONARY';
    updateSpeedDisplay(speed, mode);
  }
});
