// Dashboard Overlay - Optimized for Streaming, IRLToolkit, and Cloud OBS
// Clean, DRY, and robust implementation

// Configuration
const CONFIG = {
  rtirl: {
    userId: '41908566',
    demoMode: false,
  },
  weather: {
    updateInterval: 600000,
    useMetric: true,
  },
  time: {
    use24Hour: true,
    showSeconds: true,
    updateInterval: 1000,
  },
};

// Application state
const dashboardState = {
  timers: {},
  lastPosition: null,
  isConnected: false,
  weather: null,
  timezone: null,
  rtirtLocationListener: null,
};

// DOM elements cache
const elements = {};

// Weather condition mapping for Open-Meteo WMO codes
const weatherIcons = {
  0: '☀', // Clear sky - basic sun symbol
  1: '🌤', // Mainly clear - keep if supported, fallback below
  2: '⛅', // Partly cloudy - basic cloud with sun
  3: '☁', // Overcast - basic cloud
  45: '🌫', // Fog - keep if supported
  48: '🌫', // Depositing rime fog
  51: '🌦', // Drizzle: Light
  53: '🌦', // Drizzle: Moderate
  55: '🌦', // Drizzle: Dense
  56: '🌧', // Freezing Drizzle: Light
  57: '🌧', // Freezing Drizzle: Dense
  61: '🌧', // Rain: Slight
  63: '🌧', // Rain: Moderate
  65: '🌧', // Rain: Heavy
  66: '🌧', // Freezing Rain: Light
  67: '🌧', // Freezing Rain: Heavy
  71: '❄', // Snow fall: Slight - basic snowflake
  73: '❄', // Snow fall: Moderate
  75: '❄', // Snow fall: Heavy
  77: '❄', // Snow grains
  80: '🌦', // Rain showers: Slight
  81: '🌦', // Rain showers: Moderate
  82: '🌦', // Rain showers: Violent
  85: '❄', // Snow showers slight
  86: '❄', // Snow showers heavy
  95: '⛈', // Thunderstorm: Slight or moderate
  96: '⛈', // Thunderstorm with slight hail
  99: '⛈', // Thunderstorm with heavy hail
};

// Weather condition descriptions for Open-Meteo WMO codes
const weatherDescriptions = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

// Text fallbacks for weather icons
const weatherIconFallbacks = {
  0: 'SUN', // Clear sky
  1: 'SUN', // Mainly clear
  2: 'PART', // Partly cloudy
  3: 'CLOUD', // Overcast
  45: 'FOG', // Fog
  48: 'FOG', // Depositing rime fog
  51: 'DRIZZLE', // Drizzle: Light
  53: 'DRIZZLE', // Drizzle: Moderate
  55: 'DRIZZLE', // Drizzle: Dense
  56: 'RAIN', // Freezing Drizzle: Light
  57: 'RAIN', // Freezing Drizzle: Dense
  61: 'RAIN', // Rain: Slight
  63: 'RAIN', // Rain: Moderate
  65: 'RAIN', // Rain: Heavy
  66: 'RAIN', // Freezing Rain: Light
  67: 'RAIN', // Freezing Rain: Heavy
  71: 'SNOW', // Snow fall: Slight
  73: 'SNOW', // Snow fall: Moderate
  75: 'SNOW', // Snow fall: Heavy
  77: 'SNOW', // Snow grains
  80: 'SHOWER', // Rain showers: Slight
  81: 'SHOWER', // Rain showers: Moderate
  82: 'SHOWER', // Rain showers: Violent
  85: 'SNOW', // Snow showers slight
  86: 'SNOW', // Snow showers heavy
  95: 'STORM', // Thunderstorm: Slight or moderate
  96: 'STORM', // Thunderstorm with slight hail
  99: 'STORM', // Thunderstorm with heavy hail
};

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

// --- Initialization ---
function initializeDashboard() {
  console.log('🚀 Dashboard: Starting initialization...');
  console.log('📋 Dashboard: Configuration:', CONFIG);

  // Check emoji support and add class if needed
  if (!supportsEmoji()) {
    document.body.classList.add('no-emoji');
    console.log(
      '⚠️ Dashboard: Limited emoji support detected, using text fallbacks'
    );
  }

  cacheDOM();
  handleURLParameters();
  initTime();
  initRTIRL();

  console.log('✅ Dashboard: Initialization complete');
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
    CONFIG.rtirl.demoMode = true;
    // Default to Vienna timezone in demo mode unless overridden
    if (!dashboardState.timezone) {
      dashboardState.timezone = 'Europe/Vienna';
    }
    startDemoMode();
  }
}

// --- Time ---
function initTime() {
  console.log('⏰ Dashboard: Initializing time display');
  console.log('⚙️ Dashboard: Time config:', {
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
  const tzAbbr = getTimezoneAbbreviation(timeZone);

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
function initRTIRL() {
  if (CONFIG.rtirl.demoMode) {
    console.log('🎭 Dashboard: Demo mode enabled');
    return;
  }
  if (!window.RealtimeIRL) {
    console.log('❌ Dashboard: RTIRL library not loaded');
    return updateConnectionStatus('Library not loaded', 'error');
  }
  try {
    console.log('🔌 Dashboard: Connecting to RTIRL...');
    console.log('📋 Dashboard: User ID:', CONFIG.rtirl.userId);
    const streamer = RealtimeIRL.forStreamer('twitch', CONFIG.rtirl.userId);
    dashboardState.rtirtLocationListener =
      streamer.addLocationListener(handleLocationData);
    updateConnectionStatus('Connecting to RTIRL...', 'connecting');
    console.log('✅ Dashboard: RTIRL listener attached successfully');
  } catch (e) {
    console.log('❌ Dashboard: Failed to initialize RTIRL:', e);
    updateConnectionStatus('Connection failed', 'error');
  }
}
function handleLocationData(data) {
  if (!data || !data.latitude || !data.longitude) {
    console.log('📍 Dashboard: Location is hidden or streamer is offline');
    updateCombinedLocation('Location hidden');
    return;
  }

  console.log(
    `📍 Dashboard: Location received - ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`
  );

  dashboardState.lastPosition = {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy || 0,
    timestamp: Date.now(),
  };
  dashboardState.isConnected = true;
  updateConnectionStatus('Connected', 'connected');
  console.log('✅ Dashboard: Connection status updated to connected');
  updateLocationDisplay();
  updateWeatherData();
}
function updateLocationDisplay() {
  const pos = dashboardState.lastPosition;
  if (!pos) {
    console.log('⚠️ Dashboard: No position data for location display');
    updateCombinedLocation('--');
    return;
  }
  updateCombinedLocation('Detecting location...');
  console.log(
    '🌍 Dashboard: Starting reverse geocoding for:',
    pos.latitude,
    pos.longitude
  );
  reverseGeocode(pos.latitude, pos.longitude);
}
async function reverseGeocode(lat, lon) {
  try {
    console.log('🌐 Dashboard: Fetching address from OpenStreetMap...');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`
    );
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    const data = await response.json();

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
      console.log('📍 Dashboard: Location resolved to:', location);
      console.log('🏘️ Dashboard: Address components:', {
        district: district || 'none',
        city: city || 'none',
        country: country || 'none',
      });

      updateCombinedLocation(location || '--');
    } else {
      console.log('⚠️ Dashboard: No address data in geocoding response');
      updateCombinedLocation('Location unavailable');
    }
  } catch (error) {
    console.log('❌ Dashboard: Reverse geocoding failed:', error);
    updateCombinedLocation('Location unavailable');
  }
}

// --- Weather ---
async function updateWeatherData() {
  const pos = dashboardState.lastPosition;
  if (!pos) {
    console.log('⚠️ Dashboard: No position data for weather update');
    return;
  }
  try {
    const tempUnit = CONFIG.weather.useMetric ? 'celsius' : 'fahrenheit';
    // Request both current and hourly forecast (next 6 hours)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${pos.latitude}&longitude=${pos.longitude}&current=temperature_2m,apparent_temperature,weather_code&hourly=temperature_2m,weather_code&temperature_unit=${tempUnit}&timezone=auto`;
    console.log('🌤️ Dashboard: Fetching weather from:', weatherUrl);

    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`Weather fetch failed: ${response.status}`);
    }
    const weather = await response.json();

    dashboardState.weather = weather;
    updateWeatherDisplay(weather);
    clearTimeout(dashboardState.timers.weather);
    dashboardState.timers.weather = setTimeout(
      updateWeatherData,
      CONFIG.weather.updateInterval
    );
    console.log(
      `⏰ Dashboard: Weather updated successfully, next scheduled update in ${CONFIG.weather.updateInterval / 1000}s (or when location changes)`
    );
  } catch (error) {
    console.log('❌ Dashboard: Weather update failed:', error);
    setText(elements.weatherDescription, 'Weather unavailable');
  }
}
function updateWeatherDisplay(weather) {
  if (!weather || !weather.current) {
    console.log('⚠️ Dashboard: Invalid weather data for display');
    updateCombinedWeather('🌤', '--°', 'Loading...');
    return;
  }
  const current = weather.current;
  const tempUnit = CONFIG.weather.useMetric ? 'C' : 'F';
  const temp = `${current.temperature_2m.toFixed(1)}°${tempUnit}`;
  const feelsLike =
    current.apparent_temperature !== undefined
      ? `${current.apparent_temperature.toFixed(1)}°${tempUnit}`
      : null;
  const desc = weatherDescriptions[current.weather_code] || 'Unknown';
  const icon = getWeatherIcon(current.weather_code);

  console.log(`🌡️ Dashboard: Weather updated - ${temp} ${desc}`);

  updateCombinedWeather(icon, temp, desc);

  // Show 'feels like' in the main card if the element exists
  const feelsLikeEl = document.getElementById('weather-feels-like-combined');
  if (feelsLikeEl) {
    feelsLikeEl.textContent = feelsLike ? `Feels like: ${feelsLike}` : '';
    feelsLikeEl.style.display = feelsLike ? '' : 'none';
  }
}

// --- Status & Demo ---
function updateConnectionStatus(message, type) {
  console.log(
    `📡 Dashboard: Connection status changed to "${message}" (${type})`
  );
  setText(elements.connectionStatus, message);
  setClass(elements.connectionStatus, `corner-detail status-${type}`);
}
function startDemoMode() {
  console.log('🎭 Dashboard: Starting demo mode with Vienna coordinates');
  setTimeout(() => {
    const demoData = { latitude: 48.2082, longitude: 16.3738, accuracy: 5 };
    console.log('🎭 Dashboard: Injecting demo location data:', demoData);
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

// --- Weather Icon Fallback Logic ---
function getWeatherIconType(weatherCode) {
  // Returns { type: 'emoji' | 'svg' | 'text', value: string }
  const emoji = weatherIcons[weatherCode] || '🌤';
  const svgMap = {
    0: 'weather-sunny.svg', // Clear sky
    1: 'weather-sunny.svg', // Mainly clear
    2: 'weather-partly-cloudy.svg', // Partly cloudy
    3: 'weather-cloudy.svg', // Overcast
    45: 'weather-fog.svg', // Fog
    48: 'weather-fog.svg', // Depositing rime fog
    51: 'weather-drizzle.svg', // Drizzle: Light
    53: 'weather-drizzle.svg', // Drizzle: Moderate
    55: 'weather-drizzle.svg', // Drizzle: Dense
    56: 'weather-mixed.svg', // Freezing Drizzle: Light (sleet)
    57: 'weather-mixed.svg', // Freezing Drizzle: Dense (sleet)
    61: 'weather-showers.svg', // Rain: Slight (showers)
    63: 'weather-rain.svg', // Rain: Moderate
    65: 'weather-heavy-rain.svg', // Rain: Heavy
    66: 'weather-mixed.svg', // Freezing Rain: Light (sleet)
    67: 'weather-mixed.svg', // Freezing Rain: Heavy (sleet)
    71: 'weather-snow.svg', // Snow fall: Slight
    73: 'weather-snow.svg', // Snow fall: Moderate
    75: 'weather-heavy-snow.svg', // Snow fall: Heavy
    77: 'weather-hail.svg', // Snow grains (hail)
    80: 'weather-showers.svg', // Rain showers: Slight
    81: 'weather-showers.svg', // Rain showers: Moderate
    82: 'weather-heavy-rain.svg', // Rain showers: Violent
    85: 'weather-snow-showers.svg', // Snow showers slight
    86: 'weather-snow-showers.svg', // Snow showers heavy
    95: 'weather-thunderstorm.svg', // Thunderstorm: Slight or moderate
    96: 'weather-thunderstorm.svg', // Thunderstorm with slight hail
    99: 'weather-thunderstorm.svg', // Thunderstorm with heavy hail
  };
  const svg = svgMap[weatherCode] || 'weather-sunny.svg';
  const text = weatherIconFallbacks[weatherCode] || 'WEATHER';

  if (supportsEmoji()) {
    return { type: 'emoji', value: emoji };
  }
  // Check if SVG exists (assume yes for demo)
  if (svg) {
    return { type: 'svg', value: svg };
  }
  return { type: 'text', value: text };
}

// --- Update Combined Weather with Fallbacks ---
function updateCombinedWeather(icon, temp, desc) {
  if (combinedElements.weatherIcon) {
    // Determine which icon type to use
    const weatherCode = dashboardState.weather?.current?.weather_code;
    const iconInfo = getWeatherIconType(weatherCode);
    const el = combinedElements.weatherIcon;
    el.innerHTML = '';
    el.className = 'weather-icon';
    if (iconInfo.type === 'emoji') {
      el.textContent = iconInfo.value;
    } else if (iconInfo.type === 'svg') {
      const img = document.createElement('img');
      img.src = `assets/${iconInfo.value}`;
      img.alt = desc;
      img.style.height = '1.2em';
      img.style.verticalAlign = 'middle';
      img.style.display = 'inline-block';
      el.appendChild(img);
    } else {
      el.textContent = iconInfo.value;
      el.className = 'weather-icon weather-icon-fallback';
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
  const combined = [dateStr || '--', timeStr || '--:--:--', tzStr || '--'].join(
    ' · '
  );
  if (combinedElements.date) {
    combinedElements.date.textContent = combined;
  }
  // Hide the separate time and timezone elements if present
  if (combinedElements.time) {
    combinedElements.time.textContent = '';
  }
  if (combinedElements.timezone) {
    combinedElements.timezone.textContent = '';
  }
}

// --- Debug Status Function ---
function getDashboardStatus() {
  const status = {
    config: CONFIG,
    state: dashboardState,
    isConnected: dashboardState.isConnected,
    lastPosition: dashboardState.lastPosition,
    weather: dashboardState.weather,
    timezone: dashboardState.timezone,
    timers: Object.keys(dashboardState.timers).map(key => ({
      name: key,
      active: !!dashboardState.timers[key],
    })),
  };

  console.log('🔍 Dashboard Status:', status);
  console.log('📊 Dashboard Elements:', combinedElements);

  // Check if elements are properly connected
  const elementsStatus = {};
  Object.keys(combinedElements).forEach(key => {
    const element = combinedElements[key];
    elementsStatus[key] = {
      found: !!element,
      content: element?.textContent || 'N/A',
    };
  });
  console.log('🎯 Dashboard DOM Elements:', elementsStatus);

  return status;
}

// Make it available globally for console access
window.getDashboardStatus = getDashboardStatus;

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

// Function to get weather icon with fallback
function getWeatherIcon(weatherCode) {
  const icon = weatherIcons[weatherCode] || '🌤';
  const fallback = weatherIconFallbacks[weatherCode] || 'WEATHER';

  if (!supportsEmoji()) {
    return fallback;
  }

  return icon;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}
