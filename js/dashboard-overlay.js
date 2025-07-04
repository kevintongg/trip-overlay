// Dashboard Overlay - Optimized for Streaming, IRLToolkit, and Cloud OBS
// Clean, DRY, and robust implementation

// Configuration
const CONFIG = {
  rtirl: {
    userId: '41908566',
    demoMode: false,
  },
  weather: {
    updateInterval: 300000, // 5 minutes
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
  timezoneAbbr: null,
  rtirtLocationListener: null,
  hasFetchedInitialWeather: false, // Flag to control initial fetch
};

// DOM elements cache
const elements = {};

// OpenWeatherMap icon base URL
const OWM_ICON_BASE_URL = 'https://openweathermap.org/img/wn/';

// Weather condition mapping for OpenWeatherMap codes (fallback emojis)
const weatherIcons = {
  200: '⛈',
  201: '⛈',
  202: '⛈',
  210: '⛈',
  211: '⛈',
  212: '⛈',
  221: '⛈',
  230: '⛈',
  231: '⛈',
  232: '⛈',
  300: '🌦',
  301: '🌦',
  302: '🌦',
  310: '🌦',
  311: '🌦',
  312: '🌦',
  313: '🌦',
  314: '🌦',
  321: '🌦',
  500: '🌧',
  501: '🌧',
  502: '🌧',
  503: '🌧',
  504: '🌧',
  511: '❄',
  520: '🌦',
  521: '🌦',
  522: '🌦',
  531: '🌦',
  600: '❄',
  601: '❄',
  602: '❄',
  611: '🌨',
  612: '🌨',
  613: '🌨',
  615: '🌨',
  616: '🌨',
  620: '🌨',
  621: '🌨',
  622: '🌨',
  701: '🌫',
  711: '🌫',
  721: '🌫',
  731: '🌫',
  741: '🌫',
  751: '🌫',
  761: '🌫',
  762: '🌫',
  771: '🌫',
  781: '🌪',
  800: '☀',
  801: '🌤',
  802: '⛅',
  803: '☁',
  804: '☁',
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
  weatherHumidity: document.getElementById('weather-humidity-combined'),
  weatherSecondaryDetails: document.getElementById('weather-secondary-details'),
  sunriseSunset: document.getElementById('sunrise-sunset-combined'),
  weatherExtra: document.getElementById('weather-extra-combined'),
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

  // Only fetch weather on the first location update
  if (!dashboardState.hasFetchedInitialWeather) {
    console.log(
      '🌤️ Dashboard: First location received, fetching initial weather...'
    );
    updateWeatherData();
    dashboardState.hasFetchedInitialWeather = true;
  }
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
    const units = CONFIG.weather.useMetric ? 'metric' : 'imperial';
    const weatherUrl = `/weather?lat=${pos.latitude}&lon=${pos.longitude}&units=${units}`;
    console.log('🌤️ Dashboard: Fetching weather from proxy:', weatherUrl);

    const response = await fetch(weatherUrl);
    const data = await response.json();

    if (!response.ok) {
      // Throw an error with the detailed message from the proxy
      throw new Error(
        `Weather fetch failed: ${response.status} - ${data.error || 'Unknown error'} - ${data.message || 'No message'}`
      );
    }

    // Set timezone from API response if available
    if (data.timezone) {
      dashboardState.timezone = data.timezone;
      console.log(
        `⏰ Dashboard: Timezone updated to ${data.timezone} from API`
      );
    }

    dashboardState.weather = data;
    updateWeatherDisplay(data);

    // Clear any existing timer and start the 5-minute interval
    clearTimeout(dashboardState.timers.weather);
    dashboardState.timers.weather = setTimeout(
      updateWeatherData,
      CONFIG.weather.updateInterval
    );
    console.log(
      `⏰ Dashboard: Weather updated. Next update in ${CONFIG.weather.updateInterval / 1000}s.`
    );
  } catch (error) {
    console.error('❌ Dashboard: Weather update failed:', error);
    setText(elements.weatherDescription, 'Weather unavailable');
  }
}

function updateWeatherDisplay(weather) {
  if (!weather || !weather.current) {
    console.log('⚠️ Dashboard: Invalid weather data for display');
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

  console.log(
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
      timeZone: weather.timezone,
    });
    const sunsetTime = new Date(
      weather.current.sunset * 1000
    ).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: weather.timezone,
    });
    updateCombinedSunriseSunset(`🌅 ${sunriseTime} 🌇 ${sunsetTime}`);
  } else {
    updateCombinedSunriseSunset('');
  }

  // Show 'feels like' and humidity in the main card
  const secondaryDetails = [];
  if (feelsLike) {
    secondaryDetails.push(`Feels like: ${feelsLike}`);
  }
  if (humidity) {
    secondaryDetails.push(`Humidity: ${humidity}`);
  }
  if (wind) {
    secondaryDetails.push(`Wind: ${wind}`);
  }

  if (combinedElements.weatherSecondaryDetails) {
    combinedElements.weatherSecondaryDetails.textContent =
      secondaryDetails.join(' · ');
    combinedElements.weatherSecondaryDetails.style.display =
      secondaryDetails.length > 0 ? '' : 'none';
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
  console.log(
    `📡 Dashboard: Connection status changed to "${message}" (${type})`
  );
  setText(elements.connectionStatus, message);
  setClass(elements.connectionStatus, `corner-detail status-${type}`);
}
function startDemoMode() {
  console.log('🎭 Dashboard: Starting demo mode with Vienna coordinates');
  setTimeout(() => {
    const demoData = {
      latitude: 48.1465,
      longitude: 17.1235,
      accuracy: 5,
    };
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
        const fallbackEmoji = weatherIcons[weatherCode] || '🌤';
        el.textContent = fallbackEmoji;
        el.className = 'weather-icon';
      };
      el.appendChild(img);
    } else {
      // Fallback to emoji if no icon provided
      const weatherCode = dashboardState.weather?.current?.weather[0]?.id;
      const fallbackEmoji = weatherIcons[weatherCode] || '🌤';
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

function updateCombinedSunriseSunset(text) {
  if (combinedElements.sunriseSunset) {
    combinedElements.sunriseSunset.textContent = text;
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
    timezoneAbbr: dashboardState.timezoneAbbr,
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}
