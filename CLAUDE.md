# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time GPS tracking overlay for live streaming motorbike/travel trips. It connects to RTIRL (Real-Time IRL) API to display progress tracking with animated avatars and weather information. The project is designed for IRL streamers using OBS and cloud platforms like IRLToolkit.

## Development Commands

### Code Quality
- `pnpm install` - Install development dependencies
- `pnpm run lint` - Run ESLint code linting
- `pnpm run lint:fix` - Auto-fix ESLint issues
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

### Testing
- Open `index.html` or `dashboard-overlay.html` directly in browser (file:// URLs work)
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

2. **Dashboard Overlay** (`dashboard-overlay.html` + `js/dashboard-overlay.js`)  
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
├── index.html              # Main trip progress overlay
├── dashboard-overlay.html  # Dashboard with weather/location
├── js/
│   ├── trip-progress.js    # Main trip tracking logic
│   ├── dashboard-overlay.js # Dashboard functionality
│   └── legacy_script.js    # Older implementation
├── css/
│   ├── trip-progress.css   # Trip overlay styles
│   └── dashboard-overlay.css # Dashboard styles
├── functions/
│   └── weather.js          # Cloudflare Functions weather proxy
├── assets/                 # Avatar images and icons
└── [extensive documentation]
```

### State Management
- **Trip Progress**: Uses localStorage for persistence with manual backup/restore
- **Movement Detection**: State machine tracking current movement mode
- **Weather Cache**: Automatic caching with 5-minute intervals
- **Connection State**: Tracks RTIRL WebSocket connection status

## Key Configuration

### Trip Progress (`js/trip-progress.js`)
```javascript
const RTIRL_USER_ID = '41908566';     // Replace with user's RTIRL ID
const TOTAL_DISTANCE_KM = 371.0;      // Total planned trip distance
const MOVEMENT_MODES = {              // Speed-based movement detection
  STATIONARY: { maxSpeed: 2, minMovementM: 1 },
  WALKING: { maxSpeed: 10, minMovementM: 1 },
  CYCLING: { maxSpeed: 35, minMovementM: 5 }
};
```

### Dashboard (`js/dashboard-overlay.js`)
```javascript
const CONFIG = {
  rtirl: { userId: '41908566' },
  weather: { updateInterval: 300000 },  // 5 minutes
  time: { use24Hour: true }
};
```

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

- **GPS Validation**: Comprehensive protection against invalid coordinates, GPS jumps, and drift
- **Performance**: Debounced UI updates and throttled GPS processing
- **Persistence Limitations**: localStorage is domain/hosting-specific
- **Movement Detection**: Automatic mode switching based on speed thresholds
- **Error Handling**: Graceful fallbacks for all external dependencies

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
- **RTIRL Logic**: Duplicated between `trip-progress.js` and `dashboard-overlay.js`
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