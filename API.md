# Trip Overlay API Reference

This document outlines all available console functions and URL parameters for the Trip Overlay project. The React + TypeScript version maintains **100% backward compatibility** with all existing commands and parameters.

## 🎮 Console Functions

> **Note:** Console functions work identically in both React and legacy versions. For cloud-based environments like IRLToolkit, use the equivalent URL parameters.

Access these functions via your browser's developer console (F12 in Chrome/Firefox).

### Enhanced React API

The React version provides an enhanced global API with TypeScript support:

```javascript
// Enhanced status function with React state
TripOverlay.getStatus();              // Complete system status
TripOverlay.getReactState();          // React-specific state info
TripOverlay.getHookStatus();          // Custom hooks status

// All original commands work identically
TripOverlay.controls.addDistance(10); // Add 10km
TripOverlay.controls.resetTrip();     // Reset everything
showConsoleCommands();                // Show all available commands
```

### Distance Manipulation

#### `TripOverlay.controls.addDistance(km)` or `addDistance(km)`

Adds or subtracts distance from the current trip total.

- **`km`** (number): The distance to add in kilometers. Use a negative value to subtract.
- **React Enhancement**: Full TypeScript validation and React state integration

**Examples:**
```javascript
// Both methods work identically:
TripOverlay.controls.addDistance(10.5);  // React API (recommended)
addDistance(10.5);                       // Legacy API (still works)
addDistance(-5);                         // Subtract distance
```

---

#### `TripOverlay.controls.setDistance(km)` or `setDistance(km)`

Sets the total distance traveled to a specific value.

- **`km`** (number): The target distance in kilometers (must be ≥ 0).
- **React Enhancement**: Zustand store updates with persistence

**Examples:**
```javascript
TripOverlay.controls.setDistance(100);   // React API (recommended)
setDistance(100);                        // Legacy API (still works)
```

---

#### `TripOverlay.controls.jumpToProgress(percent)` or `jumpToProgress(percent)`

Jumps to a specific percentage of the trip's completion.

- **`percent`** (number): The target percentage (0-100).
- **React Enhancement**: Type-safe percentage validation

**Examples:**
```javascript
TripOverlay.controls.jumpToProgress(50); // React API (recommended)
jumpToProgress(50);                      // Legacy API (still works)
```

### Trip Configuration

#### `TripOverlay.controls.setTotalDistance(km)` or `setTotalDistance(km)`

Changes the total trip distance target.

- **`km`** (number): The new total trip distance in kilometers (must be > 0).
- **React Enhancement**: Updates React configuration state

**Examples:**
```javascript
TripOverlay.controls.setTotalDistance(500); // React API (recommended)
setTotalDistance(500);                      // Legacy API (still works)
```

### Unit Conversion

#### `TripOverlay.controls.convertToMiles()` or `convertToMiles()`

Switches the display to Imperial units (miles).

- **React Enhancement**: Updates Zustand store and persists preference

**Examples:**
```javascript
TripOverlay.controls.convertToMiles();   // React API (recommended)
convertToMiles();                        // Legacy API (still works)
```

---

#### `TripOverlay.controls.convertToKilometers()` or `convertToKilometers()`

Switches the display to Metric units (kilometers).

- **React Enhancement**: Updates Zustand store and persists preference

**Examples:**
```javascript
TripOverlay.controls.convertToKilometers(); // React API (recommended)
convertToKilometers();                      // Legacy API (still works)
```

### Reset Functions

#### `TripOverlay.controls.resetTripProgress()` or `resetTripProgress()`

Completely resets all trip data to zero, including total distance, today's distance, and start location.

- **React Enhancement**: Clears all Zustand stores and localStorage

**Examples:**
```javascript
TripOverlay.controls.resetTripProgress(); // React API (recommended)
resetTripProgress();                      // Legacy API (still works)
```

---

#### `TripOverlay.controls.resetTodayDistance()` or `resetTodayDistance()`

Resets only the "today's distance" counter.

- **React Enhancement**: Updates React state with proper re-rendering

**Examples:**
```javascript
TripOverlay.controls.resetTodayDistance(); // React API (recommended)
resetTodayDistance();                      // Legacy API (still works)
```

---

#### `TripOverlay.controls.resetAutoStartLocation()` or `resetAutoStartLocation()`

Clears the auto-detected start location, forcing a re-detection on the next GPS update.

- **React Enhancement**: Updates location state in React store

**Examples:**
```javascript
TripOverlay.controls.resetAutoStartLocation(); // React API (recommended)
resetAutoStartLocation();                      // Legacy API (still works)
```

### Data Management

#### `TripOverlay.controls.exportTripData()` or `exportTripData()`

Downloads a backup file of the current trip progress.

- **React Enhancement**: Exports complete React state including Zustand stores

**Examples:**
```javascript
TripOverlay.controls.exportTripData();   // React API (recommended)
exportTripData();                        // Legacy API (still works)
```

---

#### `TripOverlay.controls.importTripData(jsonString)` or `importTripData(jsonString)`

Restores trip progress from a backup file's JSON content.

- **`jsonString`** (string): The JSON content from a backup file.
- **React Enhancement**: Type-safe import with React state validation

**Examples:**
```javascript
// Import from backup file content
const backupData = '{"totalDistance":371,"traveledDistance":150}';
TripOverlay.controls.importTripData(backupData); // React API (recommended)
importTripData(backupData);                      // Legacy API (still works)
```

### Help & Status

#### `showConsoleCommands()`

Displays a list of all available console commands.

- **React Enhancement**: Shows both React and legacy API methods

---

#### `TripOverlay.getStatus()` (New)

Returns comprehensive system status including React state, connection info, and trip data.

**Example:**
```javascript
const status = TripOverlay.getStatus();
console.log(status);
// Returns: {
//   version: "React + TypeScript",
//   reactState: {...},
//   tripData: {...},
//   connection: {...},
//   stores: {...}
// }
```

---

#### `TripOverlay.getReactState()` (New)

Returns React-specific state information.

---

#### `TripOverlay.getHookStatus()` (New)

Returns status of all custom React hooks.

---

### Location & Debugging

#### `debugLocationService()` or `TripOverlay.controls.debugLocationService()`

Comprehensive debugging tool for location service issues.

Tests the location geocoding service and displays:

- Available providers (OpenCage, Nominatim, Fallback)
- API key configuration status
- Cache statistics
- Live geocoding test
- **React Enhancement**: Includes React hook status and state

**Examples:**
```javascript
// Test current location
debugLocationService();
TripOverlay.controls.debugLocationService();

// Test specific coordinates
debugLocationService(48.2082, 16.3738);
TripOverlay.controls.debugLocationService(48.2082, 16.3738);
```

---

## 🌐 URL Parameters

URL parameters are the most flexible way to control the overlay, especially in cloud environments. **All original parameters work identically** in both React and legacy versions.

### React Version URLs

For the React implementation, use these entry points:
- **Development**: `http://localhost:5173/index-react.html`
- **Production**: `file:///path/to/dist/index-react.html`
- **Dashboard**: `http://localhost:5173/dashboard-react.html`

### Legacy Version URLs (Backup)

Original vanilla JS files are preserved:
- **Trip Overlay**: `file:///path/to/index.html`
- **Dashboard**: `file:///path/to/dashboard.html`

### Core Configuration

- `?totalDistance=X`: Sets the total trip distance. (e.g., `500`)
  - **React Enhancement**: Updates TypeScript configuration state
- `?units=miles` or `?units=km`: Sets the display units.
  - **React Enhancement**: Persists to Zustand store with localStorage

### Live Adjustments

- `?addDistance=X`: Adds or subtracts kilometers. (e.g., `10.5` or `-5`)
- `?setDistance=X`: Sets the current traveled distance. (e.g., `100`)
- `?setTodayDistance=X`: Sets today's distance only, without affecting the total. (e.g., `42`)
- `?jumpTo=X`: Jumps to a percentage of completion. (e.g., `50`)
- `?setTotalTraveled=X`: Sets the total trip distance. (e.g., `500`)

### Resets

- `?reset=trip`: Resets all progress.
- `?reset=today`: Resets today's distance.
- `?reset=location`: Resets the start location.
- `?resets=type1,type2`: Performs multiple resets. (e.g., `today,location`)

### Data Management

- `?export=true`: Triggers a backup download.
- `?import=...`: Imports data from a URL-encoded JSON string.

### UI and Controls

- `?controls=true`: Shows the on-screen control panel.
- `?stream=true`: Enables stream mode with hidden hotkey controls (`Ctrl+H`).

### Testing

- `?demo=true`: Enables demo mode for testing without a live RTIRL feed.
  - **React Enhancement**: Enhanced demo mode with TypeScript simulation
  - **Works with**: Both `index-react.html` and `dashboard-react.html`

### React-Specific Parameters (New)

- `?react=false`: Forces use of legacy vanilla JS version (compatibility mode)
- `?debug=react`: Shows React component tree in console
- `?devtools=true`: Enables React DevTools integration

### Examples with React

```
# Development with demo mode
http://localhost:5173/index-react.html?demo=true&controls=true

# Production with stream settings
file:///path/to/dist/index-react.html?stream=true&totalDistance=500

# Dashboard with weather
http://localhost:5173/dashboard-react.html?demo=true&units=miles

# Legacy compatibility mode
http://localhost:5173/index-react.html?react=false&demo=true
```

## 🔄 Compatibility Matrix

| Feature | React Version | Legacy Version | Cloud Compatible |
|---------|---------------|----------------|------------------|
| **Console Commands** | ✅ Enhanced | ✅ Original | ❌ |
| **URL Parameters** | ✅ 100% Compatible | ✅ Original | ✅ |
| **Demo Mode** | ✅ Enhanced | ✅ Original | ✅ |
| **TypeScript** | ✅ Full Support | ❌ None | N/A |
| **Hot Reloading** | ✅ Development | ❌ None | N/A |
| **Performance** | ✅ Optimized | ✅ Good | ✅ |
| **OBS Integration** | ✅ Works | ✅ Works | ✅ |

## 📋 Migration Notes

### For Existing Users

1. **No changes required** - All existing console commands and URL parameters work identically
2. **Enhanced functionality** - New React API provides additional features
3. **Backward compatibility** - Legacy files preserved as backup
4. **OBS sources** - Can switch to React version by changing HTML file path

### For Developers

1. **Use React API** - `TripOverlay.controls.*` methods recommended for new code
2. **TypeScript support** - Full type safety for all functions
3. **Enhanced debugging** - Better error messages and status information
4. **Modern development** - Hot reloading, ESLint, Prettier integration
