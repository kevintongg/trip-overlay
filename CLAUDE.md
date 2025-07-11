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

# Trip Overlay - React + TypeScript Implementation

## Overview

This project has been successfully migrated from vanilla JavaScript to **React + TypeScript + Vite** while maintaining 100% backward compatibility with existing streaming workflows. The overlay system provides real-time GPS tracking for live streaming, with specialized displays for motorbike/cycling trips.

## 🎯 Current Status: MIGRATION COMPLETE ✅

### What's New in React Implementation

- **Modern Stack**: React 19 + TypeScript + Vite + Zustand + React Query
- **Type Safety**: Complete TypeScript coverage with strict mode
- **Enhanced Performance**: Optimized builds, code splitting, hot reloading
- **Better Architecture**: Clean separation of concerns with custom hooks and stores
- **Enhanced Weather Function**: TypeScript weather proxy with improved validation
- **Development Experience**: ESLint, Prettier, Vitest testing framework

### Preserved Compatibility

- **Console Commands**: All existing commands work identically (`TripOverlay.controls.*`)
- **URL Parameters**: All 15+ parameters function exactly as before
- **Visual Design**: Pixel-perfect recreation using original CSS files
- **OBS Integration**: Full browser source compatibility maintained
- **Streaming Workflows**: Zero changes required for existing setups

## 🚀 Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Access overlays
# Trip overlay: http://localhost:5173/index-react.html
# Dashboard: http://localhost:5173/dashboard-react.html
```

### Production Build

```bash
# Build for production
pnpm run build

# Preview build
pnpm run preview
```

## 📁 Project Structure

```
trip-overlay/
├── src/                          # React source code
│   ├── components/
│   │   ├── TripOverlay.tsx       # Main trip progress overlay
│   │   └── Dashboard.tsx         # Weather/location dashboard
│   ├── hooks/                    # Custom React hooks
│   │   ├── useTripProgress.ts    # Trip state management
│   │   ├── useRtirlSocket.ts     # RTIRL connection
│   │   ├── useWeatherData.ts     # Weather API integration
│   │   ├── useConsoleCommands.ts # Console API
│   │   └── useURLParameters.ts   # URL parameter processing
│   ├── store/                    # Zustand state stores
│   │   ├── tripStore.ts          # Trip progress state
│   │   ├── connectionStore.ts    # Connection state
│   │   └── weatherStore.ts       # Weather state
│   ├── types/                    # TypeScript definitions
│   │   ├── trip.ts               # Trip-related types
│   │   ├── weather.ts            # Weather API types
│   │   └── rtirl.ts              # RTIRL API types
│   ├── utils/                    # Utility functions (migrated)
│   │   ├── config.ts             # Configuration (migrated)
│   │   ├── gps.ts                # GPS utilities (migrated)
│   │   ├── logger.ts             # Logging (migrated)
│   │   └── globalConsoleAPI.ts   # Console commands setup
│   └── styles/                   # Original CSS files
│       ├── trip-progress.css     # Trip overlay styles
│       └── dashboard.css         # Dashboard styles
├── functions/
│   ├── weather.js                # Original weather function
│   └── weather.ts                # Enhanced TypeScript version
├── index-react.html              # React trip overlay entry
├── dashboard-react.html          # React dashboard entry
├── index.html                    # Original vanilla JS (backup)
├── dashboard.html                # Original vanilla JS (backup)
└── legacy files...               # Preserved for reference
```

## 🎮 Console Commands (Unchanged)

All existing console commands work identically to the vanilla JS version:

```javascript
// Status and debugging
TripOverlay.getStatus(); // Complete system status
showConsoleCommands(); // Show help

// Distance control
TripOverlay.controls.addDistance(10.5); // Add distance
TripOverlay.controls.setDistance(100); // Set total distance
TripOverlay.controls.jumpToProgress(50); // Jump to 50%

// Management
TripOverlay.controls.resetTripProgress(); // Reset all
TripOverlay.controls.resetTodayDistance(); // Reset today
TripOverlay.controls.exportTripData(); // Download backup
TripOverlay.controls.importTripData(json); // Import backup

// Units
TripOverlay.controls.convertToMiles(); // Switch to miles
TripOverlay.controls.convertToKilometers(); // Switch to km
```

## 🔗 URL Parameters (Unchanged)

All existing URL parameters work exactly as before:

```
?demo=true                    # Demo mode
?addDistance=10.5             # Add distance on load
?setDistance=100              # Set total distance
?jumpTo=50                    # Jump to percentage
?reset=today                  # Reset today's distance
?units=miles                  # Switch to imperial
?controls=true                # Show control panel
```

## 🏗️ Architecture Overview

### State Management

- **Zustand**: Client state (trip progress, settings)
- **React Query**: Server state (weather data) with caching
- **localStorage**: Persistence layer for trip data

### Key React Hooks

```typescript
// Trip state management with persistence
const { totalDistance, traveledDistance, progressPercent, resetTrip } =
  useTripProgress();

// RTIRL connection with demo mode
const { isConnected, lastPosition } = useRtirlSocket();

// Weather data with caching
const { data: weatherData, isLoading } = useWeatherData(lat, lon);
```

### TypeScript Integration

- **Strict mode**: Full type safety
- **Interface definitions**: All external APIs typed
- **Custom types**: Trip state, weather responses, RTIRL data
- **Console API**: Typed global window interface

## 🧪 Testing

```bash
# Run test suite
pnpm run test

# Run with UI
pnpm run test --ui

# Lint code
pnpm run lint --fix
```

## 📦 Build System

### Development

- **Vite**: Fast development server with HMR
- **TypeScript**: Real-time type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting

### Production

- **Optimized builds**: Code splitting, minification
- **Asset optimization**: Image optimization, CSS bundling
- **Source maps**: Debug-friendly production builds
- **Modern output**: ES modules with legacy fallbacks

## 🌍 Deployment

### Cloudflare Pages Configuration

```yaml
Build command: pnpm run build
Build output directory: dist
Root directory: /
Node.js version: 18
Environment variables:
  - VITE_RTIRL_USER_ID: your_user_id
```

### Environment Variables

```env
# Frontend (React)
VITE_RTIRL_USER_ID=your_user_id
VITE_DEMO_MODE=false

# Backend (Cloudflare Functions)
OWM_API_KEY=your_openweather_api_key
```

## 🔄 Migration Benefits Achieved

### Developer Experience

- **Hot reloading**: Instant updates during development
- **TypeScript IntelliSense**: Better IDE support and error catching
- **Modern tooling**: ESLint, Prettier, Vitest testing
- **Component reuse**: Cleaner, more maintainable code

### Performance

- **Bundle optimization**: Smaller, more efficient builds
- **Code splitting**: Faster initial load times
- **React optimizations**: Efficient re-rendering
- **Asset optimization**: Better caching and compression

### Maintainability

- **Type safety**: Catch errors at compile time
- **Clean architecture**: Separation of concerns
- **Reusable components**: DRY principle adherence
- **Enhanced testing**: Unit and integration test coverage

### Streaming Compatibility

- **Zero breaking changes**: All existing workflows preserved
- **Enhanced reliability**: Better error handling and recovery
- **Improved debugging**: Better logging and status reporting
- **Future-proof**: Modern stack for continued development

## 🎯 What's Next

With the React migration complete, future enhancements can leverage:

- **New overlays**: Easy to create with shared components
- **Advanced features**: Real-time charts, analytics
- **Better UX**: Enhanced animations and interactions
- **Mobile support**: Responsive design improvements
- **API integrations**: Additional data sources

## 📚 Related Documentation

- **MIGRATION_PLAN.md**: Complete migration strategy and rationale
- **API.md**: Console commands and URL parameters reference
- **README.md**: General setup and usage instructions
- **CONTRIBUTING.md**: Development guidelines

## 🚦 Status Summary

✅ **Environment Setup**: React + TypeScript + Vite configured  
✅ **Component Migration**: TripOverlay and Dashboard implemented  
✅ **State Management**: Zustand stores and custom hooks  
✅ **API Integration**: RTIRL, weather, and console commands  
✅ **Build System**: Production-ready Vite configuration  
✅ **Streaming Compatibility**: All console commands and URL parameters  
✅ **Documentation**: Updated for React implementation  
✅ **Testing**: Basic test framework setup

**Result**: The React migration is complete and production-ready! 🎉

The overlay maintains all existing functionality while providing modern development experience and improved maintainability for future enhancements.
