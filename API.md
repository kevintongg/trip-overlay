# Trip Overlay API Reference

This document outlines all available console functions and URL parameters for the Trip Overlay project.

## 🎮 Console Functions

> **Note:** Console functions are primarily for local testing and development. For cloud-based environments like IRLToolkit, use the equivalent URL parameters.

Access these functions via your browser's developer console (F12 in Chrome/Firefox).

### Distance Manipulation

#### `addDistance(km)`

Adds or subtracts distance from the current trip total.

- **`km`** (number): The distance to add in kilometers. Use a negative value to subtract.

**Example:** `addDistance(10.5)` or `addDistance(-5)`

---

#### `setDistance(km)`

Sets the total distance traveled to a specific value.

- **`km`** (number): The target distance in kilometers (must be ≥ 0).

**Example:** `setDistance(100)`

---

#### `jumpToProgress(percent)`

Jumps to a specific percentage of the trip's completion.

- **`percent`** (number): The target percentage (0-100).

**Example:** `jumpToProgress(50)`

### Trip Configuration

#### `setTotalDistance(km)`

Changes the total trip distance target.

- **`km`** (number): The new total trip distance in kilometers (must be > 0).

**Example:** `setTotalDistance(500)`

### Unit Conversion

#### `convertToMiles()`

Switches the display to Imperial units (miles).

---

#### `convertToKilometers()`

Switches the display to Metric units (kilometers).

### Reset Functions

#### `resetTripProgress()`

Completely resets all trip data to zero, including total distance, today's distance, and start location.

---

#### `resetTodayDistance()`

Resets only the "today's distance" counter.

---

#### `resetAutoStartLocation()`

Clears the auto-detected start location, forcing a re-detection on the next GPS update.

### Data Management

#### `exportTripData()`

Downloads a backup file of the current trip progress.

---

#### `importTripData(jsonString)`

Restores trip progress from a backup file's JSON content.

- **`jsonString`** (string): The JSON content from a backup file.

### Help

#### `showConsoleCommands()`

Displays a list of all available console commands.

---

## 🌐 URL Parameters

URL parameters are the most flexible way to control the overlay, especially in cloud environments.

### Core Configuration

- `?totalDistance=X`: Sets the total trip distance. (e.g., `500`)
- `?units=miles` or `?units=km`: Sets the display units.

### Live Adjustments

- `?addDistance=X`: Adds or subtracts kilometers. (e.g., `10.5` or `-5`)
- `?setDistance=X`: Sets the current traveled distance. (e.g., `100`)
- `?jumpTo=X`: Jumps to a percentage of completion. (e.g., `50`)

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
