# Trip Overlay Refactoring Plan

This document outlines a plan to refactor the `trip-overlay` codebase, focusing on reducing redundancy, improving modularity, and adhering to best practices.

## Current State Analysis

The project currently consists of three main JavaScript files:

- `functions/weather.js`: A Cloudflare Worker/Function for proxying OpenWeatherMap API requests.
- `js/dashboard.js`: Handles the display of time, weather, and connection status on the dashboard.
- `js/script.js`: Manages trip progress, distance calculation, movement mode detection, and persistence.

**Key Issues Identified:**

1.  **Redundant RTIRL Logic:** Both `js/dashboard.js` and `js/script.js` contain significant duplication in handling RTIRL (RealtimeIRL) connection, location data processing, and demo mode.
2.  **Global Scope Pollution:** Several functions and variables are exposed globally (`window.getDashboardStatus`, `window.addDistance`, etc.), which can lead to naming conflicts and make code harder to reason about.
3.  **Scattered Configuration:** Configuration values (e.g., RTIRL user ID, demo mode flags, movement thresholds) are duplicated or spread across `js/dashboard.js` and `js/script.js`.
4.  **Complex Movement Mode Detection:** The logic in `js/script.js` for inferring movement modes (stationary, walking, cycling) based on speed and distance is intricate and might be over-engineered for the core purpose.
5.  **Mixed Responsibilities:** While generally well-separated, there are some overlaps in concerns, particularly around location data processing.

## Refactoring Goals

1.  **DRY (Don't Repeat Yourself):** Eliminate redundant code, especially for RTIRL integration.
2.  **Modularity:** Create smaller, focused modules with clear responsibilities.
3.  **Centralized Configuration:** Consolidate all application-wide configuration into a single, easily manageable location.
4.  **Improved Maintainability:** Make the codebase easier to understand, debug, and extend.
5.  **Best Practices:** Move away from global scope pollution and towards more encapsulated patterns.
6.  **Performance (Minor):** Ensure existing performance optimizations (debouncing, `requestAnimationFrame`) are maintained or improved.

## Refactoring Plan

The refactoring will be executed in several phases:

### Phase 1: Centralize Configuration

**Objective:** Create a single source of truth for all application configuration.

1.  **Create `utils/config.js`:**
    - Move `CONFIG` object from `js/dashboard.js`.
    - Move `RTIRL_USER_ID`, `TOTAL_DISTANCE_KM`, `DEMO_MODE`, `MOVEMENT_MODES`, `MODE_SWITCH_DELAY`, `UI_UPDATE_DEBOUNCE`, `SAVE_DEBOUNCE_DELAY`, `USE_AUTO_START`, `MANUAL_START_LOCATION` from `js/script.js`.
    - Export this configuration object.
2.  **Update `js/dashboard.js` and `js/script.js`:**
    - Import configuration from `utils/config.js` instead of defining it locally.

### Phase 2: Consolidate RTIRL Integration

**Objective:** Create a dedicated module for handling all RTIRL connection and raw location data processing.

1.  **Create `utils/rtirl.js`:**
    - Move RTIRL connection logic (`initRTIRL` from `dashboard.js`, `connectToRtirl` from `script.js`).
    - Move `handleLocationData` (from `dashboard.js`) and `handleRtirtData` (from `script.js`) core logic into this module. This module will be responsible for receiving raw RTIRL data, managing the connection status, and providing a clean interface for other modules to subscribe to processed location updates.
    - Manage `isConnected` and `lastPosition` state within this module.
    - Encapsulate demo mode logic related to RTIRL data generation.
    - Export functions to initialize RTIRL and register callbacks for location updates.
2.  **Update `js/dashboard.js` and `js/script.js`:**
    - Remove all redundant RTIRL connection and raw data handling code.
    - Import and use the new `utils/rtirl.js` module to get location updates. Each file will register its own callback to receive location data relevant to its specific concerns (e.g., `dashboard.js` for weather updates, `script.js` for distance calculation).

### Phase 3: Refine Module Responsibilities

**Objective:** Ensure each main JavaScript file has a clear and distinct responsibility.

1.  **Refine `js/script.js`:**
    - Focus solely on trip progress: distance calculation, progress bar updates, persistence (localStorage), and control panel interactions.
    - Simplify movement mode detection if possible, or ensure it's clearly encapsulated.
    - Remove any weather-related or time-related logic.
2.  **Refine `js/dashboard.js`:**
    - Focus solely on dashboard display: time, weather, and general connection status UI updates.
    - Remove any trip-progress related logic.
3.  **Refine `functions/weather.js`:**
    - Consider adding caching for OpenWeatherMap responses using Cloudflare's Cache API to reduce external API calls and improve performance.
    - Add more robust input validation for `lat` and `lon`.

### Phase 4: Clean Up Global Scope and Utilities

**Objective:** Reduce global scope pollution and create shared utility functions.

1.  **Encapsulate Global Functions:**
    - Move debugging functions (e.g., `getDashboardStatus`, `getStatus`, console commands) into a dedicated `utils/debug.js` module or make them conditional on a debug flag.
    - Remove direct `window.functionName = function` assignments where possible.
2.  **Create `utils/dom.js` (Optional):**
    - If `$` (getElementById shorthand), `setText`, `setClass` are used frequently across modules, move them to a shared `utils/dom.js` file.

## Verification

After each phase, the following will be verified:

- **Functionality:** Ensure all existing features (time display, weather, RTIRL connection, distance tracking, persistence, demo mode, URL parameters, console commands) continue to work as expected.
- **No Regressions:** Run existing tests (if any) or perform manual testing to confirm no new bugs were introduced.
- **Code Quality:** Check for adherence to new modularity and best practice guidelines.
- **Linting/Formatting:** Ensure code passes `eslint` and `prettier` checks.

This plan aims to create a more maintainable, scalable, and understandable codebase for the `trip-overlay` project.
