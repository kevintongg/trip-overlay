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
  0: '☀️', // Clear sky
  1: '🌤️', // Mainly clear
  2: '⛅', // Partly cloudy
  3: '☁️', // Overcast
  45: '🌫️', // Fog
  48: '🌫️', // Depositing rime fog
  51: '🌦️', // Drizzle: Light
  53: '🌦️', // Drizzle: Moderate
  55: '🌦️', // Drizzle: Dense
  56: '🌧️', // Freezing Drizzle: Light
  57: '🌧️', // Freezing Drizzle: Dense
  61: '🌧️', // Rain: Slight
  63: '🌧️', // Rain: Moderate
  65: '🌧️', // Rain: Heavy
  66: '🌧️', // Freezing Rain: Light
  67: '🌧️', // Freezing Rain: Heavy
  71: '🌨️', // Snow fall: Slight
  73: '🌨️', // Snow fall: Moderate
  75: '🌨️', // Snow fall: Heavy
  77: '🌨️', // Snow grains
  80: '🌦️', // Rain showers: Slight
  81: '🌦️', // Rain showers: Moderate
  82: '🌦️', // Rain showers: Violent
  85: '🌨️', // Snow showers slight
  86: '🌨️', // Snow showers heavy
  95: '⛈️', // Thunderstorm: Slight or moderate
  96: '⛈️', // Thunderstorm with slight hail
  99: '⛈️', // Thunderstorm with heavy hail
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

// --- Combined Dashboard DOM Cache ---
const combinedElements = {
  location: document.getElementById('location-combined'),
  weatherIcon: document.getElementById('weather-icon-combined'),
  weatherTemp: document.getElementById('weather-temp-combined'),
  weatherDesc: document.getElementById('weather-desc-combined'),
  date: document.getElementById('date-combined'),
  time: document.getElementById('time-combined'),
  timezone: document.getElementById('timezone-combined'),
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
  cacheDOM();
  handleURLParameters();
  initTime();
  initRTIRL();
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
    return;
  }
  if (!window.RealtimeIRL) {
    return updateConnectionStatus('Library not loaded', 'error');
  }
  try {
    const streamer = RealtimeIRL.forStreamer('twitch', CONFIG.rtirl.userId);
    dashboardState.rtirtLocationListener =
      streamer.addLocationListener(handleLocationData);
    updateConnectionStatus('Connecting to RTIRL...', 'connecting');
  } catch (e) {
    updateConnectionStatus('Connection failed', e.message);
  }
}
function handleLocationData(data) {
  if (!data || !data.latitude || !data.longitude) {
    return;
  }
  dashboardState.lastPosition = {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy || 0,
    timestamp: Date.now(),
  };
  dashboardState.isConnected = true;
  updateConnectionStatus('Connected', 'connected');
  updateLocationDisplay();
  updateWeatherData();
}
function updateLocationDisplay() {
  const pos = dashboardState.lastPosition;
  if (!pos) {
    updateCombinedLocation('--');
    return;
  }
  updateCombinedLocation('Detecting location...');
  reverseGeocode(pos.latitude, pos.longitude);
}
async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    );
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    const data = await response.json();
    if (data && data.address) {
      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.municipality;
      const country = data.address.country;
      const location = [city, country].filter(Boolean).join(', ');
      updateCombinedLocation(location || '--');
    }
  } catch {
    updateCombinedLocation('Location unavailable');
  }
}

// --- Weather ---
async function updateWeatherData() {
  const pos = dashboardState.lastPosition;
  if (!pos) {
    return;
  }
  try {
    const tempUnit = CONFIG.weather.useMetric ? 'celsius' : 'fahrenheit';
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${pos.latitude}&longitude=${pos.longitude}&current=temperature_2m,apparent_temperature,weather_code&temperature_unit=${tempUnit}&timezone=auto`
    );
    if (!response.ok) {
      throw new Error('Weather fetch failed');
    }
    const weather = await response.json();
    dashboardState.weather = weather;
    updateWeatherDisplay(weather);
    clearTimeout(dashboardState.timers.weather);
    dashboardState.timers.weather = setTimeout(
      updateWeatherData,
      CONFIG.weather.updateInterval
    );
  } catch {
    setText(elements.weatherDescription, 'Weather unavailable');
  }
}
function updateWeatherDisplay(weather) {
  if (!weather || !weather.current) {
    updateCombinedWeather('🌤️', '--°', 'Loading...');
    return;
  }
  const current = weather.current;
  const tempUnit = CONFIG.weather.useMetric ? 'C' : 'F';
  const temp = `${Math.round(current.temperature_2m)}°${tempUnit}`;
  const desc = weatherDescriptions[current.weather_code] || 'Unknown';
  const icon = weatherIcons[current.weather_code] || '🌤️';
  updateCombinedWeather(icon, temp, desc);
}

// --- Status & Demo ---
function updateConnectionStatus(message, type) {
  setText(elements.connectionStatus, message);
  setClass(elements.connectionStatus, `corner-detail status-${type}`);
}
function startDemoMode() {
  setTimeout(() => {
    handleLocationData({ latitude: 48.2082, longitude: 16.3738, accuracy: 5 });
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
function updateCombinedWeather(icon, temp, desc) {
  if (combinedElements.weatherIcon) {
    combinedElements.weatherIcon.textContent = icon || '🌤️';
  }
  if (combinedElements.weatherTemp) {
    combinedElements.weatherTemp.textContent = temp || '--°';
  }
  if (combinedElements.weatherDesc) {
    combinedElements.weatherDesc.textContent = desc || 'Loading...';
  }
}
function updateCombinedTime(dateStr, timeStr, tzStr) {
  if (combinedElements.date) {
    combinedElements.date.textContent = dateStr || '--';
  }
  if (combinedElements.time) {
    combinedElements.time.textContent = timeStr || '--:--:--';
  }
  if (combinedElements.timezone) {
    combinedElements.timezone.textContent = tzStr || '--';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}
