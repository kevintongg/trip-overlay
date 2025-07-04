# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time GPS tracking overlay for live streaming cycling/bike trips. It connects to RTIRL (Real-Time IRL) API to display progress tracking with animated avatars and weather information. The project is designed for IRL streamers using OBS and cloud platforms like IRLToolkit, specifically optimized for cycling trips from Vienna to Zagreb.

## Development Commands

### Code Quality

- `pnpm install` - Install development dependencies
- `pnpm run lint` - Run ESLint code linting
- `pnpm run lint:fix` - Auto-fix ESLint issues
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

### Testing

- Open `index.html` or `dashboard.html` directly in browser (file:// URLs work)
- Use `?demo=true` URL parameter for testing without RTIRL connection
- Optional: `pnpm wrangler pages dev .` for local server testing with weather functions

## Architecture

### Core Components

**Two Main Overlays:**

1. **Trip Progress Overlay** (`index.html` + `js/trip-progress.js`)
   - Real-time GPS distance tracking
   - Animated progress bar with avatar
   - Smart movement detection (stationary/walking/cycling/vehicle)
   - localStorage persistence for trip data

2. **Dashboard Overlay** (`dashboard.html` + `js/dashboard.js`)
   - Real-time location display
   - Weather information with OpenWeatherMap integration
   - Time/timezone display
   - Optimized for streaming dashboards

**Key Features:**

- **RTIRL Integration**: WebSocket connection to Real-Time IRL API for live GPS data
- **Smart Movement Detection**: Automatically detects movement type based on speed
- **GPS Drift Protection**: Filters out stationary GPS noise with configurable thresholds
- **Persistence**: localStorage for trip progress across sessions
- **Weather Integration**: Cloudflare Functions proxy for OpenWeatherMap API
- **Cloud-Friendly**: URL parameters for control in cloud environments (IRLToolkit)

### File Structure

```
├── index.html              # Main trip progress overlay (ES6 module)
├── dashboard.html  # Dashboard with weather/location (ES6 module)
├── js/
│   ├── trip-progress.js    # Main trip tracking logic (ES6 module)
│   ├── dashboard.js # Dashboard functionality (ES6 module)
│   └── legacy_script.js    # Older implementation (legacy)
├── utils/                  # Shared ES6 modules
│   ├── config.js          # Centralized configuration
│   ├── rtirl.js           # Shared RTIRL connection logic
│   └── status.js          # Unified status reporting
├── css/
│   ├── trip-progress.css   # Trip overlay styles
│   └── dashboard.css # Dashboard styles
├── functions/
│   └── weather.js          # Cloudflare Functions weather proxy
├── assets/                 # Avatar images and icons
└── [extensive documentation]
```

### State Management

- **Trip Progress**: Uses localStorage for persistence with manual backup/restore
- **Movement Detection**: Sophisticated permissible mode system with GPS drift protection
- **Weather Cache**: Automatic caching with 5-minute intervals and error recovery
- **Connection State**: Shared RTIRL connection state across both overlays
- **Memory Management**: Automatic cache cleanup and timer management
- **Error Recovery**: Comprehensive async error handling with graceful fallbacks

## Key Configuration

### Centralized Configuration (`utils/config.js`)

All configuration is now centralized in a single module:

```javascript
export const CONFIG = {
  // RTIRL Configuration
  rtirl: {
    userId: '41908566', // Replace with your real RTIRL user ID
    demoMode: false,
  },

  // Trip Progress Configuration
  trip: {
    totalDistanceKm: 371.0, // Distance from Vienna to Zagreb
    useAutoStart: false,
    manualStartLocation: { lat: 48.209, lon: 16.3531 }, // Vienna
  },

  // Movement Detection Configuration
  movement: {
    modes: {
      STATIONARY: { maxSpeed: 2, minMovementM: 1, gpsThrottle: 5000 },
      WALKING: { maxSpeed: 10, minMovementM: 1, gpsThrottle: 2000 },
      CYCLING: { maxSpeed: 35, minMovementM: 5, gpsThrottle: 1500 },
    },
    modeSwitchDelay: 10000, // 10 seconds
  },

  // Weather Configuration
  weather: { updateInterval: 300000, useMetric: true }, // 5 minutes

  // Time Configuration
  time: { use24Hour: true, showSeconds: true, updateInterval: 1000 },

  // Performance Configuration
  performance: { uiUpdateDebounce: 100, saveDebounceDelay: 500 },
};
```

### Usage in Modules

```javascript
// Trip Progress (js/trip-progress.js)
import { CONFIG, getURLParam, isDemoMode } from '../utils/config.js';
import { initRTIRL, addLocationCallback } from '../utils/rtirl.js';

// Dashboard Overlay (js/dashboard.js)
import { CONFIG, WEATHER_ICONS } from '../utils/config.js';
import { initRTIRL, getConnectionState } from '../utils/rtirl.js';
```

## Enhanced Features & Debugging

### Comprehensive Status Functions

Enhanced debugging with unified status reporting:

```javascript
// Trip Progress Status (enhanced)
getStatus(); // Now includes shared RTIRL state and cross-page awareness

// Dashboard Status (enhanced)
getDashboardStatus(); // Now includes trip context and better diagnostics

// Unified Status (new)
getFullStatus(); // Combines data from both overlays when available
```

### Error Recovery & Validation

- **Async Error Handling**: All external API calls have timeout protection (8-10 seconds)
- **Input Validation**: URL parameters validated with appropriate limits
- **Memory Management**: Distance cache automatically cleaned to prevent memory leaks
- **Network Recovery**: Graceful handling of weather API failures, geocoding timeouts
- **GPS Validation**: Comprehensive coordinate validation and drift protection

### Performance Improvements

- **Shared RTIRL Module**: Eliminates code duplication between overlays
- **Memory Leak Fixes**: Fixed unbounded cache growth in distance calculations
- **Optimized Updates**: Maintained existing debouncing and requestAnimationFrame optimizations
- **Better Logging**: Reduced console spam in demo mode with intelligent throttling

## Special Control Methods

### Local OBS (Full Control)

- Browser console functions: `resetTripProgress()`, `resetTodayDistance()`, `exportTripData()`
- Keyboard shortcuts (when `?stream=true`)
- URL parameters
- On-screen controls (`?controls=true`)

### Cloud/IRLToolkit (Limited Control)

- **Only URL parameters work** (no console access)
- `?reset=today` - Reset daily distance
- `?reset=trip` - Reset entire trip
- `?export=true` - Download backup
- `?reset=location` - Re-detect start location

## Weather Integration

Uses Cloudflare Functions (`functions/weather.js`) as proxy to OpenWeatherMap API:

- Requires `OWM_API_KEY` environment variable
- Handles CORS and API key security
- Supports metric/imperial units
- Includes comprehensive error handling

## Important Notes

### Architecture Requirements

- **ES6 Modules**: Requires modern browsers with ES6 module support
- **Module Structure**: Uses centralized configuration and shared utilities
- **Breaking Change**: Requires updated HTML files with `type="module"` script tags

### Technical Features

- **GPS Validation**: Comprehensive protection against invalid coordinates, GPS jumps, and drift
- **Permissible Mode System**: Sophisticated movement detection with graceful mode transitions
- **Performance**: Debounced UI updates, throttled GPS processing, and memory leak prevention
- **Persistence Limitations**: localStorage is domain/hosting-specific
- **Movement Detection**: Automatic mode switching based on cycling speed thresholds (up to 35 km/h)
- **Error Handling**: Comprehensive async error recovery with timeout protection
- **Memory Management**: Automatic cleanup of caches, timers, and event listeners

## Cloud Environment Compatibility

### IRLToolkit Constraints

- **Limited Unicode/Emoji Support**: Hardcoded emojis in code may not display properly
- **No Console Access**: Browser console (F12) unavailable in cloud environment
- **No Keyboard Input**: Keyboard shortcuts cannot be sent to cloud browser
- **URL Parameters Only**: Primary control method for cloud environments

### Working in Cloud

- **OpenWeatherMap Icons**: Web-based icons work fine (retrieved via URLs)
- **Emoji Fallbacks**: May need text alternatives for hardcoded unicode in `weatherIcons` object
- **URL Parameter Control**: Fully functional for all management tasks
- **LocalStorage**: Works within cloud browser context

## Known Technical Debt

### Code Duplication Issues

- **RTIRL Logic**: Duplicated between `trip-progress.js` and `dashboard.js`
- **Configuration**: Scattered across multiple files
- **Global Functions**: Several debugging functions exposed globally
- **See REFACTORING_PLAN.md**: Detailed plan for consolidation and cleanup

## Development Workflow

1. **Local Development**: Open HTML files directly in browser
2. **Testing**: Use `?demo=true` for simulated GPS data
3. **Code Quality**: Run `pnpm run lint` and `pnpm run format` before commits
4. **Deployment**: Works with any static hosting (GitHub Pages, Netlify, etc.)

## Production Considerations

- Configure RTIRL_USER_ID for each user
- Set up weather API key in Cloudflare environment
- Use HTTPS hosting for browser source compatibility
- Consider localStorage backup strategy for multi-device usage
