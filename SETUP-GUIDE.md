# 🏍️ IRL Trip Overlay Setup Guide

## Quick Start for IRL Streamers

### 1. **Test the Overlay (Demo Mode)**

Open `index.html` and add `?demo=true` to the URL:

```
file:///path/to/index.html?demo=true
```

You should see the overlay simulate a trip from 0km to 205km over a few minutes.

### 2. **Configure for Your Trip**

Edit `js/script.js` and update these values:

```javascript
// Your RTIRL user ID (find this at rtirl.com in your profile)
const RTIRL_USER_ID = 'YOUR_ACTUAL_RTIRL_ID';

// Total distance of your planned trip (in kilometers)
const TOTAL_DISTANCE_KM = 205.0; // Change this to your trip distance

// Choose start location method:
const USE_AUTO_START = false; // Set to true for automatic detection
const MANUAL_START_LOCATION = { lat: 50.0755, lon: 14.4378 }; // Your start coordinates
```

### 3. **Add to OBS Studio**

1. **Add Browser Source**:
   - Source → Add → Browser Source
   - Name: "Trip Overlay"
   - URL: `file:///full/path/to/index.html`
   - Width: 1920, Height: 1080
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

2. **Position the Overlay**:
   - Drag to bottom of screen
   - Resize as needed
   - Set blend mode to "Normal"

### 4. **Stream Controls (Hidden from Viewers)**

While streaming, use these hotkeys:

- **Ctrl + H**: Toggle control panel (auto-hides after 15s)
- **Ctrl + Shift + R**: Reset today's distance
- **Ctrl + Shift + B**: Download backup
- **Ctrl + Shift + T**: Reset entire trip (with confirmation)

### 5. **URL Parameters for Stream Management**

Add these to your OBS browser source URL:

```
?stream=true              # Enables stream mode
?controls=true            # Shows controls initially
?demo=true               # Demo mode for testing
?reset=today             # Reset today's distance on load
?export=true             # Auto-download backup on load
```

Example: `file:///path/to/index.html?stream=true&controls=false`

## 📱 RTIRL Setup

1. **Create Account**: Sign up at [rtirl.com](https://rtirl.com)
2. **Find Your User ID**: Check your profile page
3. **Mobile App**: Install RTIRL app on your phone
4. **Start Streaming**: Begin GPS broadcast from the app
5. **Overlay Connection**: The overlay will automatically connect

## 🔧 Troubleshooting

### Overlay Not Updating

- ✅ Check RTIRL_USER_ID is correct
- ✅ Ensure RTIRL app is broadcasting
- ✅ Check browser console for connection errors
- ✅ Try refreshing the browser source in OBS

### GPS Jumps/Weird Distances

- The overlay automatically filters GPS jumps >200km/h
- Check console for "GPS jump detected" warnings
- Consider using manual start location in areas with poor GPS

### Performance Issues

- ✅ Enable "Shutdown source when not visible" in OBS
- ✅ Close browser dev tools during stream
- ✅ The overlay is optimized for 8+ hour streams

### Demo Mode Not Working

- Make sure you're using `?demo=true` in the URL
- Check browser console for errors
- Try opening in a modern browser (Chrome/Firefox/Edge)

## 🎯 Advanced Configuration

### Custom Trip Distance

```javascript
// For longer trips, update this value
const TOTAL_DISTANCE_KM = 1500.0; // e.g., for a cross-country trip
```

### Auto-Start vs Manual Start

```javascript
// AUTO: Detects start location from first GPS reading
const USE_AUTO_START = true;

// MANUAL: Set exact start coordinates
const USE_AUTO_START = false;
const MANUAL_START_LOCATION = { lat: 52.52, lon: 13.405 }; // Berlin
```

### Performance Tuning

```javascript
// Adjust these constants in script.js for different update rates
const GPS_UPDATE_THROTTLE = 1000; // GPS update frequency (ms)
const UI_UPDATE_DEBOUNCE = 100; // UI smoothness (ms)
const SAVE_DEBOUNCE_DELAY = 500; // Save frequency (ms)
```

## 📊 Data Persistence

### Backup Your Progress

- Use **Ctrl + Shift + B** to download JSON backup
- Store backups before switching streaming setups

### Restore Progress

- Import backup via browser console: `importTripData(jsonString)`
- Or use URL parameter: `?import=<encoded-json>`

### Cross-Device Setup

1. Export data from computer A
2. Import data to computer B
3. Continue stream seamlessly

## 🚨 Important Notes

- **Test everything** in demo mode first
- **Always backup** progress before major changes
- **Monitor browser console** for connection issues
- **The overlay auto-saves** every 500ms during travel
- **Daily resets** happen automatically with 6-hour grace period
- **Compatible** with all major browsers and OBS versions

## 📞 Support

If something doesn't work:

1. Check browser console for errors
2. Test in demo mode first
3. Verify RTIRL connection
4. Check OBS browser source settings

Good luck with your IRL stream! 🎥🏍️
