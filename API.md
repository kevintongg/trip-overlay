# Trip Overlay API Reference

This document outlines all available console functions and URL parameters for the Trip Overlay project.

## 🎮 Console Functions

> **Note:** Console functions only work in local OBS setups. IRLToolkit cloud users must use URL parameters.

Access via browser console (F12 in Chrome/Firefox):

### Distance Manipulation

#### `addDistance(km)`

Adds or subtracts distance from the current trip total.

**Parameters:**

- `km` (number) - Distance to add in kilometers. Use negative values to subtract.

**Examples:**

```javascript
addDistance(10.5); // Add 10.5km to current total
addDistance(-5); // Subtract 5km from current total
```

**Returns:** Visual feedback and console confirmation

---

#### `setDistance(km)`

Sets the total distance to a specific value.

**Parameters:**

- `km` (number) - Target distance in kilometers (must be ≥ 0)

**Examples:**

```javascript
setDistance(100); // Set total distance to exactly 100km
setDistance(0); // Reset to 0km
```

**Returns:** Visual feedback and console confirmation

---

#### `jumpToProgress(percent)`

Jumps to a specific percentage of trip completion.

**Parameters:**

- `percent` (number) - Target percentage (0-100)

**Examples:**

```javascript
jumpToProgress(50); // Jump to 50% completion (102.5km of 205km trip)
jumpToProgress(0); // Jump to start (0km)
jumpToProgress(100); // Jump to finish (205km)
```

**Returns:** Visual feedback and console confirmation

### Unit Conversion

#### `convertToMiles()`

Switches the display to Imperial units (miles).

**Parameters:** None

**Examples:**

```javascript
convertToMiles(); // "12.50 km" becomes "7.77 mi"
```

**Returns:** Console confirmation and immediate UI update

---

#### `convertToKilometers()`

Switches the display to Metric units (kilometers).

**Parameters:** None

**Examples:**

```javascript
convertToKilometers(); // "7.77 mi" becomes "12.50 km"
```

**Returns:** Console confirmation and immediate UI update

### Trip Configuration

#### `setTotalDistance(km)`

Changes the total trip distance target.

**Parameters:**

- `km` (number) - New trip distance in kilometers (must be > 0)

**Examples:**

```javascript
setTotalDistance(500); // Change from 205km to 500km trip
setTotalDistance(100); // Change to shorter 100km trip
```

**Returns:** Console confirmation and recalculated progress percentage

### Reset Functions

#### `resetTripProgress()`

Completely resets all trip data to zero.

**Parameters:** None

**Examples:**

```javascript
resetTripProgress(); // Reset everything: total=0, today=0, units=km
```

**Side Effects:**

- Clears localStorage
- Resets unit preference to kilometers
- Restarts demo mode if active
- Resets start location if using auto-detect

---

#### `resetTodayDistance()`

Resets only today's distance counter, keeping total progress.

**Parameters:** None

**Examples:**

```javascript
resetTodayDistance(); // Total: 180km, Today: 25km → Today: 0km
```

**Returns:** Visual feedback confirming daily reset

---

#### `resetAutoStartLocation()`

Clears the auto-detected start location for re-detection.

**Parameters:** None

**Examples:**

```javascript
resetAutoStartLocation(); // Force re-detection on next GPS update
```

**Note:** Only relevant when `USE_AUTO_START = true`

### Data Management

#### `exportTripData()`

Downloads a backup file of current trip progress.

**Parameters:** None

**Examples:**

```javascript
exportTripData(); // Downloads "trip-backup-2024-01-15.json"
```

**Returns:** Downloads JSON file to local computer

---

#### `importTripData(jsonString)`

Restores trip progress from a backup file.

**Parameters:**

- `jsonString` (string) - JSON content from a backup file

**Examples:**

```javascript
// Paste content from backup file:
importTripData(
  '{"totalDistanceTraveled":150.5,"todayDistanceTraveled":25.0,...}'
);
```

**Returns:** Restores all saved data and updates UI

### Help & Documentation

#### `showConsoleCommands()`

Displays a comprehensive help guide in the console.

**Parameters:** None

**Examples:**

```javascript
showConsoleCommands(); // Shows full command reference with examples
```

**Returns:** Formatted help text in console

---

## 🌐 URL Parameters

> **Note:** URL parameters work in all environments, including IRLToolkit cloud.

### Demo & Testing

#### `?demo=true`

Enables demo mode for testing without RTIRL connection.

**Examples:**

```
https://yoursite.com/trip-overlay/?demo=true
```

**Behavior:**

- Simulates GPS data starting from current progress
- Adds 0.5km every 2 seconds
- Respects manual console commands
- Shows demo status in console

### Reset Operations

#### `?reset=trip`

Resets entire trip progress to zero.

**Examples:**

```
https://yoursite.com/trip-overlay/?reset=trip
```

**Equivalent to:** `resetTripProgress()`

---

#### `?reset=today`

Resets only today's distance counter.

**Examples:**

```
https://yoursite.com/trip-overlay/?reset=today
```

**Equivalent to:** `resetTodayDistance()`

---

#### `?reset=location`

Resets auto-detected start location.

**Examples:**

```
https://yoursite.com/trip-overlay/?reset=location
```

**Equivalent to:** `resetAutoStartLocation()`

#### `?reset=trip,today,location`

Performs multiple reset operations.

**Examples:**

```
https://yoursite.com/trip-overlay/?reset=trip,today,location
```

**Behavior:** Executes all specified reset types in sequence

### Data Management

#### `?export=true`

Triggers automatic backup download.

**Examples:**

```
https://yoursite.com/trip-overlay/?export=true
```

**Equivalent to:** `exportTripData()`

---

#### `?import=...`

Imports trip data from URL-encoded JSON.

**Examples:**

```
https://yoursite.com/trip-overlay/?import=%7B%22totalDistanceTraveled%22%3A150%7D
```

**Note:** JSON must be URL-encoded. Rarely used directly.

### Configuration & Adjustments

#### `?units=miles` or `?units=km`

Switches display units between Imperial and Metric.

**Examples:**

```
https://yoursite.com/trip-overlay/?units=miles
https://yoursite.com/trip-overlay/?units=km
```

**Use cases:** International streamers, audience preferences

---

#### `?totalDistance=X`

Overrides trip distance without code changes.

**Examples:**

```
https://yoursite.com/trip-overlay/?totalDistance=500
```

**Use cases:** Multi-trip streamers, different routes

---

#### `?addDistance=X`

Adds or subtracts distance from current progress.

**Examples:**

```
https://yoursite.com/trip-overlay/?addDistance=10     // Add 10km
https://yoursite.com/trip-overlay/?addDistance=-5    // Subtract 5km
```

**Use cases:** Stream corrections, GPS adjustments

---

#### `?setDistance=X`

Sets total distance to exact value.

**Examples:**

```
https://yoursite.com/trip-overlay/?setDistance=100
```

**Use cases:** Positioning overlay, corrections

---

#### `?jumpTo=X`

Jumps to specific percentage (0-100) of trip completion.

**Examples:**

```
https://yoursite.com/trip-overlay/?jumpTo=50     // Jump to 50%
https://yoursite.com/trip-overlay/?jumpTo=75     // Jump to 75%
```

**Use cases:** Demo positioning, testing different stages

### Stream Controls

#### `?controls=true`

Shows the control panel interface.

**Examples:**

```
https://yoursite.com/trip-overlay/?controls=true
```

**Note:** Not recommended for live streams (controls visible to viewers)

---

#### `?stream=true`

Enables stream-friendly mode with hidden hotkey controls.

**Examples:**

```
https://yoursite.com/trip-overlay/?stream=true
```

**Features:**

- Clean overlay for viewers
- Ctrl+H toggles hidden controls
- Ctrl+Shift+R for quick daily reset
- Auto-hides controls after 15 seconds

**Note:** Only works in local OBS (hotkeys don't work in cloud browsers)

---

## 📊 Return Values & Feedback

### Console Output

All functions provide console feedback:

```javascript
addDistance(10);
// Console: "✅ Added 10.00km (50.00km → 60.00km)"

convertToMiles();
// Console: "✅ Converted display to miles (Imperial units)"
```

### Visual Feedback

Functions show temporary notifications in the overlay:

- ✅ **Success** - Green background, 3 seconds
- ⚠️ **Warning** - Yellow background, 3 seconds
- ❌ **Error** - Red background, 3 seconds

### State Persistence

Changes are automatically saved to:

- **localStorage** - Survives page refresh
- **Backup files** - Manual export/import for cross-device transfer

---

## 🚨 Error Handling

### Invalid Parameters

```javascript
addDistance('hello'); // ❌ Error: requires a number
setDistance(-5); // ❌ Error: requires positive number
jumpToProgress(150); // ❌ Error: must be 0-100
```

### Network Issues

```javascript
// RTIRL connection failures are handled gracefully:
// - Exponential backoff reconnection
// - Console warnings for debugging
// - Visual feedback for connection status
```

### Storage Failures

```javascript
// localStorage quota exceeded:
// - Functions continue to work
// - Console warnings about failed saves
// - Graceful degradation to memory-only mode
```

---

## 🛠️ Advanced Usage

### Chaining Operations

```javascript
// Set up a specific test scenario:
convertToMiles();
setDistance(100);
addDistance(25.5);
// Result: 77.98 mi total distance
```

### Demo Mode Automation

```javascript
// In demo mode (?demo=true):
jumpToProgress(90); // Jump to 90% completion
// Demo continues from new position: 90.5%, 91%, 91.5%...
```

### Rapid Testing

```javascript
// Quick test cycle:
showConsoleCommands(); // See all options
resetTripProgress(); // Clean start
jumpToProgress(50); // Jump to middle
convertToMiles(); // Test unit conversion
exportTripData(); // Save test state
```

---

## 📱 Platform Compatibility

| Feature           | Local OBS            | IRLToolkit Cloud      |
| ----------------- | -------------------- | --------------------- |
| Console Functions | ✅ Full support      | ❌ Not available      |
| URL Parameters    | ✅ Full support      | ✅ Full support       |
| Hotkeys           | ✅ Works             | ❌ No keyboard input  |
| File Export       | ✅ Downloads locally | ✅ Downloads to cloud |

**Recommendation:** Use console functions for development, URL parameters for production cloud environments.
