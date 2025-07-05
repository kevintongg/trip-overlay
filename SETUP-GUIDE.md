# 🚴‍♂️ IRL Trip Overlay Setup Guide

## Quick Start for IRL Streamers

### 1. **Browser Requirements**

**Modern Browser Required**: The overlay now uses ES6 modules and requires:

- Chrome 63+ / Firefox 60+ / Safari 11+ / Edge 79+
- Local file access (file:// URLs work fine)

### 2. **Test the Overlay (Demo Mode)**

Open `index.html` and add `?demo=true` to the URL:

```
file:///path/to/index.html?demo=true
```

You should see the overlay simulate cycling movement and distance tracking.

### 3. **Configure for Your Trip**

Edit `utils/config.js` and update these values:

```javascript
// Your RTIRL user ID (find this at rtirl.com in your profile)
const RTIRL_USER_ID = 'YOUR_ACTUAL_RTIRL_ID';

// Total distance of your planned trip (in kilometers)
const TOTAL_DISTANCE_KM = 205.0; // Change this to your trip distance
```

Alternatively, you can set the total distance using the `setTotalTraveled` URL parameter:

`?setTotalTraveled=500` (to set total distance to 500km)

### 3. **Add to OBS Studio**

1. **Add Browser Source**:
   - Source → Add → Browser Source
   - Name: "Trip Overlay"
   - URL: `file:///full/path/to/index.html`
   - Width: 1920, Height: 1080
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

2. **Position the Overlay**:
   - Drag to top of screen
   - Resize as needed
   - Set blend mode to "Normal"
   - (The overlay is top-aligned by default. You can adjust the top margin in the CSS if needed.)

### 4. **Stream Controls**

While streaming, you can use URL parameters to control the overlay. For example, to reset the daily distance, you would add `?reset=today` to the URL in your OBS browser source.

For a full list of commands, see the [API.md](./API.md) file.

### 5. **URL Parameters for Stream Management**

Add these to your OBS browser source URL:

```
?stream=true              # Enables stream mode
?controls=true            # Shows controls initially
?demo=true               # Demo mode for testing
?reset=today             # Reset today's distance on load
?export=true             # Auto-download backup on load
?setTotalTraveled=500    # Set total trip distance to 500km
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

Or, you can use the `totalDistance` URL parameter:

`?totalDistance=1500`

## 📊 Data Persistence

### Backup Your Progress

- Use the `exportTripData()` console command to download a JSON backup.

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
