# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

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

1.  **Trip Progress Overlay** (`index.html` + `js/trip-progress.js`)
    - Real-time GPS distance tracking
    - Animated progress bar with avatar
    - Smart movement detection (stationary/walking/cycling/vehicle)
    - localStorage persistence for trip data

2.  **Dashboard Overlay** (`dashboard.html` + `js/dashboard.js`)
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

## Gemini Specific Guidance

- **Prioritize existing conventions**: When making changes, always adhere to the existing code style, naming conventions, and architectural patterns found in the project.
- **Utilize `pnpm`**: The project uses `pnpm` for package management. Use `pnpm install`, `pnpm run lint`, etc.
- **ES6 Modules**: Be aware that the project heavily utilizes ES6 modules.
- **Centralized Configuration**: Refer to `utils/config.js` for all centralized configuration.
- **Testing**: Use the `?demo=true` URL parameter for testing without a live RTIRL connection.
- **Cloudflare Functions**: The `functions/weather.js` file is a Cloudflare Function.
