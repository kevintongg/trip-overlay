// Centralized Configuration for Trip Overlay - TypeScript Version
import type { ConfigType, WeatherIcons } from '../types/config';

// Get environment variables with fallbacks
const getRTIRLUserId = (): string => {
  return import.meta.env.VITE_RTIRL_USER_ID || '41908566';
};

const isDemoMode = (): boolean => {
  return (
    import.meta.env.VITE_DEMO_MODE === 'true' ||
    new URLSearchParams(window.location.search).get('demo') === 'true'
  );
};

// Core application configuration
export const CONFIG: ConfigType = {
  // RTIRL Configuration
  rtirl: {
    userId: getRTIRLUserId(),
    demoMode: isDemoMode(),
  },

  // Trip Progress Configuration
  trip: {
    totalDistanceKm: 371.0, // Distance from Vienna to Zagreb
    useAutoStart: false,
    manualStartLocation: { lat: 48.209, lon: 16.3531 }, // Vienna
  },

  // Weather Configuration
  weather: {
    updateInterval: 600000, // 10 minutes
    useMetric: true,
  },

  // Time Configuration
  time: {
    use24Hour: true,
    showSeconds: true,
    updateInterval: 1000,
  },

  // Movement Detection Configuration
  movement: {
    modes: {
      STATIONARY: {
        maxSpeed: 0.5, // Lower threshold for better walking detection
        minMovementM: 0.5, // More sensitive to small movements
        gpsThrottle: 5000, // Check less often when still
        avatar: '/stationary.png',
      },
      WALKING: {
        maxSpeed: 7.5, // Up to 7.5 km/h (robust walking/cycling threshold)
        minMovementM: 0.5, // More sensitive to small movements
        gpsThrottle: 2000,
        avatar: '/walking.gif',
      },
      CYCLING: {
        maxSpeed: 35, // Up to 35 km/h
        minMovementM: 1, // More robust: 1m minimum for cycling
        gpsThrottle: 500,
        avatar: '/cycling.gif',
      },
    },
    modeSwitchDelay: 10000, // 10 seconds
  },

  // Performance Configuration
  performance: {
    uiUpdateDebounce: 100,
    saveDebounceDelay: 500,
  },
};

// Weather condition mapping for OpenWeatherMap codes (fallback emojis)
// Note: In cloud environments, these may not display properly
export const WEATHER_ICONS: WeatherIcons = {
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

// OpenWeatherMap icon base URL
export const OWM_ICON_BASE_URL = 'https://openweathermap.org/img/wn/';

// URL parameter utilities
export const getURLParam = (key: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
};

// Validation utilities
export const validateDistance = (d: number): number => {
  return typeof d === 'number' && isFinite(d) && d >= 0
    ? Math.min(d, 50000)
    : 0;
};

export const validateCoordinates = (
  c: { lat: number; lon: number } | null
): boolean => {
  return (
    c !== null &&
    typeof c.lat === 'number' &&
    typeof c.lon === 'number' &&
    isFinite(c.lat) &&
    isFinite(c.lon) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lon >= -180 &&
    c.lon <= 180
  );
};

export const sanitizeUIValue = (v: number): number => {
  return !isFinite(v) || v < 0 ? 0 : Math.min(v, 999999);
};
