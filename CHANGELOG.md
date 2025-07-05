# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/en/2.0.0/).

## [Unreleased]

### Added
- **Timestamped Logger** [`56257c2`](https://github.com/kevintongg/trip-overlay/commit/56257c260fabccf104c92894e7e4239d1b3c366b): Introduced `utils/logger.js` to provide consistent, timestamped, and leveled logging (`log`, `warn`, `error`). This centralizes logging, making it easier to manage and debug.
- **`setTotalTraveled` URL Parameter** [`71087e7`](https://github.com/kevintongg/trip-overlay/commit/71087e72a4bcebdf4b7a2a6d380e53f074650b73): Restored the functionality to set the total traveled distance via URL parameter, which was inadvertently removed during previous refactoring.
- **Hourly Weather Forecast** [`9444a46`](https://github.com/kevintongg/trip-overlay/commit/9444a460db34538439d76b8451ec61ec7b73208a): Added an hourly weather forecast card to the dashboard, displaying temperature and weather icons for the next few hours.
- **Weather Icons (SVG)** [`f522513`](https://github.com/kevintongg/trip-overlay/commit/f522513468b6ad9840481d0183c54ee9ecafecd3): Introduced a comprehensive set of SVG weather icons for various conditions, with fallback mechanisms for emoji and text.
- **`pnpm-workspace.yaml`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Added a pnpm workspace configuration file, indicating a move towards a monorepo structure for better dependency management.
- **`LICENSE` File** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Included the MIT License file to explicitly define the project's licensing.
- **`CLAUDE.md`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Added a guide for interacting with Claude Code, outlining project structure, commands, and architectural details.
- **`REFACTORING_PLAN.md`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Documented the planned refactoring phases, outlining goals and solutions for code modularity, centralization, and global scope reduction.
- **`COMPATIBILITY.md`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Introduced a detailed feature compatibility matrix across different environments (Local OBS, IRLToolkit Cloud).
- **`BACKUP-GUIDE.md`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Provided step-by-step instructions for backing up and restoring trip data.
- **`IRLTOOLKIT-GUIDE.md`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Added a specific guide for IRLToolkit cloud users, detailing setup and limitations.
- **`API.md`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Documented all available console functions and URL parameters.
- **`utils/config.js`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Centralized configuration for the entire application.
- **`utils/gps.js`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Shared GPS calculation utilities.
- **`utils/rtirl.js`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c3d31fb20925e200765cfe92d04651f5c9): Shared RTIRL connection logic.
- **`setTodayDistance` URL parameter** [`b47e551`](https://github.com/kevintongg/trip-overlay/commit/b47e551): Added the ability to set today's traveled distance via URL parameter.

### Changed
- **Refactored Logging** [`56257c2`](https://github.com/kevintongg/trip-overlay/commit/56257c2), [`71087e7`](https://github.com/kevintongg/trip-overlay/commit/71087e7): Replaced direct `console.log`, `console.warn`, and `console.error` calls in `js/dashboard.js`, `js/trip-progress.js`, and `utils/rtirl.js` with the new `logger` utility. This standardizes output and improves debuggability (DRY, KISS).
- **Timestamp Format** [`56257c2`](https://github.com/kevintongg/trip-overlay/commit/56257c2): Changed the timestamp format in the logger to 24-hour time for consistency.
- **Dashboard Weather Display** [`424fb9d`](https://github.com/kevintongg/trip-overlay/commit/424fb9d): Enhanced the weather display on the dashboard to include "feels like" temperature and a more streamlined layout.
- **Dashboard Layout and Styling** [`5cf5e79`](https://github.com/kevintongg/trip-overlay/commit/5cf5e79): Adjusted padding, box-shadow, border, min/max width of the dashboard combined card for improved visual presentation.
- **Trip Progress Overlay Styling** [`9b99e1fea`](https://github.com/kevintongg/trip-overlay/commit/9b99e1fea): Modified the size and positioning of the overlay container, progress bar, avatar, and data display elements for better visual appeal and responsiveness.
- **Weather API Integration** [`ac95f4cd`](https://github.com/kevintongg/trip-overlay/commit/ac95f4cd): Switched the weather data source from OpenWeatherMap to Open-Meteo in `js/dashboard.js` and `functions/weather.js`.
- **Location Display** [`0d92a4d`](https://github.com/kevintongg/trip-overlay/commit/0d92a4d): Simplified the location display in the dashboard, prioritizing city and country, and adjusted CSS for better text handling.
- **Movement Detection Logic** [`1e6230c`](https://github.com/kevintongg/trip-overlay/commit/1e6230c): Refined the movement mode detection in `js/script.js` (now `js/legacy_script.js`), introducing a 'VEHICLE' mode and updating speed thresholds. Simplified the mode switching logic by removing explicit `modeSwitchTimeout` and directly updating the avatar based on the detected mode.
- **File Renaming** [`5c8c0eb`](https://github.com/kevintongg/trip-overlay/commit/5c8c0eb), [`f8dc61d`](https://github.com/kevintongg/trip-overlay/commit/f8dc61d), [`ececf72`](https://github.com/kevintongg/trip-overlay/commit/ececf72), [`fb9be2b`](https://github.com/kevintongg/trip-overlay/commit/fb9be2b):
    - `css/dashboard-overlay.css` renamed to `css/dashboard.css`.
    - `dashboard-overlay.html` renamed to `dashboard.html`.
    - `functions/weather-proxy.js` renamed to `functions/weather.js`.
    - `js/dashboard-overlay.js` renamed to `js/dashboard.js`.
    - `js/trip-progress.js` renamed to `js/script.js` (later renamed back to `js/trip-progress.js` and `js/script.js` became `js/legacy_script.js`).
    - `css/trip-progress.css` renamed to `css/style.css`.
- **Documentation Updates** [`2dcd2cc`](https://github.com/kevintongg/trip-overlay/commit/2dcd2cc), [`86ff67a`](https://github.com/kevintongg/trip-overlay/commit/86ff67a), [`be57ffeb`](https://github.com/kevintongg/trip-overlay/commit/be57ffeb), [`0ac75b2`](https://github.com/kevintongg/trip-overlay/commit/0ac75b2), [`52aa991`](https://github.com/kevintongg/trip-overlay/commit/52aa991), [`e842b4a`](https://github.com/kevintongg/trip-overlay/commit/e842b4a), [`f8dc61d`](https://github.com/kevintongg/trip-overlay/commit/f8dc61d), [`ececf72`](https://github.com/kevintongg/trip-overlay/commit/ececf72), [`fb9be2b`](https://github.com/kevintongg/trip-overlay/commit/fb9be2b), [`9444a46`](https://github.com/kevintongg/trip-overlay/commit/9444a46), [`4aa24f9`](https://github.com/kevintongg/trip-overlay/commit/4aa24f9), [`ac95f4cd`](https://github.com/kevintongg/trip-overlay/commit/ac95f4cd), [`0d92a4d`](https://github.com/kevintongg/trip-overlay/commit/0d92a4d), [`1e6230c`](https://github.com/kevintongg/trip-overlay/commit/1e6230c), [`3465d5e`](https://github.com/kevintongg/trip-overlay/commit/3465d5e), [`424fb9d`](https://github.com/kevintongg/trip-overlay/commit/424fb9d), [`8a2f04d`](https://github.com/kevintongg/trip-overlay/commit/8a2f04d), [`8aa12cd`](https://github.com/kevintongg/trip-overlay/commit/8aa12cd), [`22ffd02`](https://github.com/kevintongg/trip-overlay/commit/22ffd02), [`9b99e1fea`](https://github.com/kevintongg/trip-overlay/commit/9b99e1fea), [`9c61f4dc1`](https://github.com/kevintongg/trip-overlay/commit/9c61f4dc1), [`66c1a5ef`](https://github.com/kevintongg/trip-overlay/commit/66c1a5ef), [`b47e551`](https://github.com/kevintongg/trip-overlay/commit/b47e551), [`7c0e13e`](https://github.com/kevintongg/trip-overlay/commit/7c0e13e), [`96470dab`](https://github.com/kevintongg/trip-overlay/commit/96470dab), [`fe22782`](https://github.com/kevintongg/trip-overlay/commit/fe22782), [`aade510`](https://github.com/kevintongg/trip-overlay/commit/aade510), [`3465d5e`](https://github.com/kevintongg/trip-overlay/commit/3465d5e), [`1e6230c`](https://github.com/kevintongg/trip-overlay/commit/1e6230c), [`0d92a4d`](https://github.com/kevintongg/trip-overlay/commit/0d92a4d), [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c), [`f522513`](https://github.com/kevintongg/trip-overlay/commit/f522513), [`5cf5e79`](https://github.com/kevintongg/trip-overlay/commit/5cf5e79), [`424fb9d`](https://github.com/kevintongg/trip-overlay/commit/424fb9d), [`8a2f04d`](https://github.com/kevintongg/trip-overlay/commit/8a2f04d), [`8aa12cd`](https://github.com/kevintongg/trip-overlay/commit/8aa12cd), [`22ffd02`](https://github.com/kevintongg/trip-overlay/commit/22ffd02), [`9b99e1fea`](https://github.com/kevintongg/trip-overlay/commit/9b99e1fea), [`9c61f4dc1`](https://github.com/kevintongg/trip-overlay/commit/9c61f4dc1), [`66c1a5ef`](https://github.com/kevintongg/trip-overlay/commit/66c1a5ef), [`4aa24f9`](https://github.com/kevintongg/trip-overlay/commit/4aa24f9), [`ac95f4cd`](https://github.com/kevintongg/trip-overlay/commit/ac95f4cd), [`2dcd2cc`](https://github.com/kevintongg/trip-overlay/commit/2dcd2cc), [`9444a46`](https://github.com/kevintongg/trip-overlay/commit/9444a46), [`fb9be2b`](https://github.com/kevintongg/trip-overlay/commit/fb9be2b), [`ececf72`](https://github.com/kevintongg/trip-overlay/commit/ececf72), [`f8dc61d`](https://github.com/kevintongg/trip-overlay/commit/f8dc61d), [`e842b4a`](https://github.com/kevintongg/trip-overlay/commit/e842b4a), [`52aa991`](https://github.com/kevintongg/trip-overlay/commit/52aa991), [`0ac75b2`](https://github.com/kevintongg/trip-overlay/commit/0ac75b2), [`be57ffeb`](https://github.com/kevintongg/trip-overlay/commit/be57ffeb), [`86ff67a`](https://github.com/kevintongg/trip-overlay/commit/86ff67a), [`0ba24da`](https://github.com/kevintongg/trip-overlay/commit/0ba24da), [`d1fd43b`](https://github.com/kevintongg/trip-overlay/commit/d1fd43b), [`28248e2`](https://github.com/kevintongg/trip-overlay/commit/28248e2), [`14af2f7`](https://github.com/kevintongg/trip-overlay/commit/14af2f7), [`971df32`](https://github.com/kevintongg/trip-overlay/commit/971df32), [`f7f6861`](https://github.com/kevintongg/trip-overlay/commit/f7f6861), [`02bcdb9`](https://github.com/kevintongg/trip-overlay/commit/02bcdb9), [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52), [`7531997`](https://github.com/kevintongg/trip-overlay/commit/7531997), [`bda4c99`](https://github.com/kevintongg/trip-overlay/commit/bda4c99), [`2dc3f8a`](https://github.com/kevintongg/trip-overlay/commit/2dc3f8a), [`71087e7`](https://github.com/kevintongg/trip-overlay/commit/71087e7): Various `.md` files (`README.md`, `IRLTOOLKIT-GUIDE.md`, `SETUP-GUIDE.md`, `CONTRIBUTING.md`) were updated to reflect changes in file names, project focus (cycling vs. motorbiking), and new features.
- **Project Focus Shift (Motorbike to Cycling)** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c): The overlay has been re-themed for cycling, with updated avatars and default trip settings.

### Removed
- **Redundant Weather Icons** [`56257c2`](https://github.com/kevintongg/trip-overlay/commit/56257c2): Deleted unused SVG weather icons from the `assets` directory to clean up the codebase (YAGNI).
- **`REFACTORING_PLAN.md`** [`2dcd2cc`](https://github.com/kevintongg/trip-overlay/commit/2dcd2cc): Removed the refactoring plan document after the refactoring was completed.
- **`dashboard.html.bak`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c): Removed a backup HTML file.
- **`js/dashboard.js.bak`** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c): Removed a backup JavaScript file.
- **`utils/status.js`** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Removed this module, indicating a simplification of status reporting.
- **`setTotalTraveled` URL Parameter Functionality** [`be57ffeb`](https://github.com/kevintongg/trip-overlay/commit/be57ffeb): Removed the implementation for this URL parameter from `js/trip-progress.js` (later restored).
- **Sunrise/Sunset Display** [`f8dc61d`](https://github.com/kevintongg/trip-overlay/commit/f8dc61d): Removed the sunrise/sunset display from the dashboard to simplify the layout.
- **Hourly Forecast Card** [`5cf5e79`](https://github.com/kevintongg/trip-overlay/commit/5cf5e79): Removed the hourly forecast card from the dashboard.
- **`degToCompass` Function** [`e842b4a`](https://github.com/kevintongg/trip-overlay/commit/e842b4a): Removed this helper function from `js/dashboard.js`.
- **`Response` Global** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c): Removed `Response` from ESLint globals, indicating it's no longer directly used in the global scope.
- **`wrangler` and Related Dependencies** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c): Removed `wrangler` and associated Cloudflare Pages/Workers dependencies from `package.json` and `pnpm-lock.yaml`, suggesting a shift away from that specific development setup (KISS, YAGNI).
- **`CLAUDE.md`** [`0ac75b2`](https://github.com/kevintongg/trip-overlay/commit/0ac75b2): Removed the Claude Code guidance document.
- **`REFACTORING_PLAN.md`** [`0ac75b2`](https://github.com/kevintongg/trip-overlay/commit/0ac75b2): Removed the refactoring plan document.
- **`utils/config.js`, `utils/gps.js`, `utils/logger.js`, `utils/rtirl.js`** [`0ac75b2`](https://github.com/kevintongg/trip-overlay/commit/0ac75b2): These files were temporarily removed during a rollback, effectively reverting modularization and centralization. (Note: These were later reintroduced).
- **Vehicle Mode** [`22ffd02`](https://github.com/kevintongg/trip-overlay/commit/22ffd02): Removed the vehicle movement mode to simplify the application's movement detection logic.

### Fixed
- **Typo in `MOVEMENT_MODES.STATIONary`** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Corrected a typo in the movement modes configuration.
- **Accuracy Logging** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Fixed accuracy logging to gracefully handle "unknown" values.
- **GPS Jump Detection** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Improved GPS jump detection logic to prevent false positives.
- **URL Parameter Handling** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Ensured URL parameter parsing is robust and handles various input types correctly.
- **Import Data Validation** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Added validation for import data size to prevent DoS attacks.
- **Temperature Rounding** [`8a2f04d`](https://github.com/kevintongg/trip-overlay/commit/8a2f04d): Rounded temperature values to one decimal place for better presentation.
- **Overlay Positioning** [`9b99e1fea`](https://github.com/kevintongg/trip-overlay/commit/9b99e1fea): Adjusted CSS for overlay positioning to ensure correct display.
- **Avatar Update Logic** [`1e6230c`](https://github.com/kevintongg/trip-overlay/commit/1e6230c): Ensured avatar updates correctly reflect the detected movement mode.
- **Console Command Output** [`b45310b`](https://github.com/kevintongg/trip-overlay/commit/b45310b): Standardized console command output for clarity.
- **Hotkeys** [`b45310b`](https://github.com/kevintongg/trip-overlay/commit/b45310b): Ensured hotkeys function correctly in stream mode.
- **Error Handling** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Implemented more comprehensive error handling for API calls and data processing.
- **Memory Leaks** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Addressed potential memory leaks related to distance caching.
- **Emoji Support** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Implemented fallback mechanisms for platforms with limited emoji support.
- **Weather Icon Normalization** [`9c61f4dc1`](https://github.com/kevintongg/trip-overlay/commit/9c61f4dc1): Ensured consistency across all weather icons by standardizing the XML declaration and SVG structure.
- **Dashboard Element Positioning** [`3465d5e`](https://github.com/kevintongg/trip-overlay/commit/3465d5e): Fixed positioning of dashboard card elements.
- **Dashboard Layout Simplification** [`28248e2`](https://github.com/kevintongg/trip-overlay/commit/28248e2): Hid the hourly forecast section on the dashboard to streamline the user interface.
- **Sunrise/Sunset Emojis** [`971df32`](https://github.com/kevintongg/trip-overlay/commit/971df32): Replaced emoji format with text labels and 24-hour time for cloud OBS compatibility.
- **Weather Update Interval** [`7531997`](https://github.com/kevintongg/trip-overlay/commit/7531997): Changed weather update interval from 10 minutes to 5 minutes.
- **Dashboard Time Formatting** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Minor adjustment to time formatting in dashboard.
- **Dashboard File Renaming** [`d1fd43b`](https://github.com/kevintongg/trip-overlay/commit/d1fd43b): Renamed dashboard files for clarity.
- **Refactoring Plan Clarification** [`0ba24da`](https://github.com/kevintongg/trip-overlay/commit/0ba24da): Clarified the refactoring plan.
- **Weather Icon and Dashboard Style Updates** [`4aa24f9`](https://github.com/kevintongg/trip-overlay/commit/4aa24f9): Refreshed weather icons and enhanced dashboard styling.
- **OpenWeatherMap API Update** [`ac95f4cd`](https://github.com/kevintongg/trip-overlay/commit/ac95f4cd): Updated to OpenWeatherMap API.
- **Documentation Updates** [`2dcd2cc`](https://github.com/kevintongg/trip-overlay/commit/2dcd2cc): Updated documentation.
- **Refactoring Rollback** [`fb9be2b`](https://github.com/kevintongg/trip-overlay/commit/fb9be2b): Rolled back some refactoring changes.
- **CSS Positioning Adjustments** [`ececf72`](https://github.com/kevintongg/trip-overlay/commit/ececf72): Adjusted CSS for positioning.
- **File Renaming** [`f8dc61d`](https://github.com/kevintongg/trip-overlay/commit/f8dc61d): Renamed files.
- **Wind & Humidity Display** [`52aa991`](https://github.com/kevintongg/trip-overlay/commit/52aa991): Added wind and humidity display.
- **General Fixes** [`0ac75b2`](https://github.com/kevintongg/trip-overlay/commit/0ac75b2): Implemented various fixes.
- **Claude Stuff** [`be57ffeb`](https://github.com/kevintongg/trip-overlay/commit/be57ffeb): Added Claude-related content.
- **New URL Param and MD Updates** [`86ff67a`](https://github.com/kevintongg/trip-overlay/commit/86ff67a): Added new URL parameter and updated markdown files.
- **Hourly Forecast Section Hiding** [`d1fd43b`](https://github.com/kevintongg/trip-overlay/commit/d1fd43b): Hid the hourly forecast section in the dashboard overlay.
- **Dashboard Layout Simplification** [`28248e2`](https://github.com/kevintongg/trip-overlay/commit/28248e2): Simplified dashboard layout.
- **Merge Remote-Tracking Branch** [`14af2f7`](https://github.com/kevintongg/trip-overlay/commit/14af2f7), [`02bcdb9`](https://github.com/kevintongg/trip-overlay/commit/02bcdb9), [`7531997`](https://github.com/kevintongg/trip-overlay/commit/7531997), [`bda4c99`](https://github.com/kevintongg/trip-overlay/commit/bda4c99), [`2dc3f8a`](https://github.com/kevintongg/trip-overlay/commit/2dc3f8a): Merged remote-tracking branches.
- **Refactoring and Production Fixes** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Completed refactoring and production fixes for IRL streaming.
- **Movement Mode Switching Logic** [`0d92a4d`](https://github.com/kevintongg/trip-overlay/commit/0d92a4d): Improved movement mode switching logic.
- **Location Accuracy and Display** [`4c5262c`](https://github.com/kevintongg/trip-overlay/commit/4c5262c): Improved location accuracy and display.
- **Hourly Forecast Card Removal** [`5cf5e79`](https://github.com/kevintongg/trip-overlay/commit/5cf5e79): Removed hourly forecast card.
- **Weather Display and Layout Enhancements** [`424fb9d`](https://github.com/kevintongg/trip-overlay/commit/424fb9d): Enhanced weather display and layout.
- **Temperature Rounding** [`8a2f04d`](https://github.com/kevintongg/trip-overlay/commit/8a2f04d): Rounded temperature to one decimal place.
- **Progress Bar Percentage Display** [`8aa12cd`](https://github.com/kevintongg/trip-overlay/commit/8aa12cd): Enhanced progress bar with percentage display.
- **Vehicle Mode Removal** [`22ffd02`](https://github.com/kevintongg/trip-overlay/commit/22ffd02): Removed vehicle mode.
- **Overlay Size and Style Adjustments** [`9b99e1fea`](https://github.com/kevintongg/trip-overlay/commit/9b99e1fea): Reduced overlay size and adjusted styles.
- **Weather Icon Normalization** [`9c61f4dc1`](https://github.com/kevintongg/trip-overlay/commit/9c61f4dc1): Normalized weather icons.
- **Merge Remote-Tracking Branch** [`66c1a5ef`](https://github.com/kevintongg/trip-overlay/commit/66c1a5ef): Merged remote-tracking branch.
- **Weather Icons and Dashboard Styles Update** [`4aa24f9`](https://github.com/kevintongg/trip-overlay/commit/4aa24f9): Updated weather icons and dashboard styles.
- **OpenWeatherMap API Update** [`ac95f4cd`](https://github.com/kevintongg/trip-overlay/commit/ac95f4cd): Updated to OpenWeatherMap API.
- **Documentation Updates** [`2dcd2cc`](https://github.com/kevintongg/trip-overlay/commit/2dcd2cc): Updated documentation.
- **Hourly Weather Addition** [`9444a46`](https://github.com/kevintongg/trip-overlay/commit/9444a46): Added hourly weather.
- **Refactoring** [`fb9be2b`](https://github.com/kevintongg/trip-overlay/commit/fb9be2b): Performed refactoring.
- **Positioning Adjustments** [`ececf72`](https://github.com/kevintongg/trip-overlay/commit/ececf72): Adjusted positioning.
- **File Renaming** [`f8dc61d`](https://github.com/kevintongg/trip-overlay/commit/f8dc61d): Renamed files.
- **Sunrise/Sunset Display** [`e842b4a`](https://github.com/kevintongg/trip-overlay/commit/e842b4a): Added sunrise/sunset display.
- **Wind & Humidity Addition** [`52aa991`](https://github.com/kevintongg/trip-overlay/commit/52aa991): Added wind and humidity.
- **General Fixes** [`0ac75b2`](https://github.com/kevintongg/trip-overlay/commit/0ac75b2): Implemented various fixes.
- **Claude Stuff** [`be57ffeb`](https://github.com/kevintongg/trip-overlay/commit/be57ffeb): Added Claude-related content.
- **New URL Param and MD Updates** [`86ff67a`](https://github.com/kevintongg/trip-overlay/commit/86ff67a): Added new URL parameter and updated markdown files.
- **Refactoring Plan Clarification** [`0ba24da`](https://github.com/kevintongg/trip-overlay/commit/0ba24da): Clarified refactoring plan.
- **Dashboard Hourly Forecast Hiding** [`d1fd43b`](https://github.com/kevintongg/trip-overlay/commit/d1fd43b): Hid the hourly forecast section in the dashboard overlay.
- **Dashboard Layout Simplification** [`28248e2`](https://github.com/kevintongg/trip-overlay/commit/28248e2): Simplified dashboard layout.
- **Merge Remote-Tracking Branch** [`14af2f7`](https://github.com/kevintongg/trip-overlay/commit/14af2f7): Merged remote-tracking branch.
- **Sunrise/Sunset Emojis to Text** [`971df32`](https://github.com/kevintongg/trip-overlay/commit/971df32): Replaced sunrise/sunset emojis with text labels.
- **Comment Out Sunrise/Sunset Row** [`f7f6861`](https://github.com/kevintongg/trip-overlay/commit/f7f6861): Commented out sunrise/sunset row in dashboard.
- **Merge Remote-Tracking Branch** [`02bcdb9`](https://github.com/kevintongg/trip-overlay/commit/02bcdb9): Merged remote-tracking branch.
- **Complete Refactoring and Production Fixes** [`1d4fa52`](https://github.com/kevintongg/trip-overlay/commit/1d4fa52): Completed refactoring and production fixes for IRL streaming.
- **Merge Branch** [`7531997`](https://github.com/kevintongg/trip-overlay/commit/7531997), [`bda4c99`](https://github.com/kevintongg/trip-overlay/commit/bda4c99), [`2dc3f8a`](https://github.com/kevintongg/trip-overlay/commit/2dc3f8a): Merged branches.
- **Timestamped Logger and Standardized Output** [`71087e7`](https://github.com/kevintongg/trip-overlay/commit/71087e7): Introduced timestamped logger and standardized output.
- **Weather Icon Removal** [`56257c2`](https://github.com/kevintongg/trip-overlay/commit/56257c2): Removed weather icons.


