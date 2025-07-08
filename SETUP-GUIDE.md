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

#### Environment Setup (Recommended)

Copy and configure your environment variables:

```bash
# Copy the template file
cp env-template .env.local

# Edit .env.local with your values:
VITE_RTIRL_USER_ID=your_rtirl_user_id_here
VITE_OPENCAGE_API_KEY=your_opencage_key_here  # Optional but recommended
```

**Why OpenCage API?**

- **Faster location updates**: 5-10x faster than free alternatives
- **Better accuracy**: More reliable city/country detection
- **Free tier**: 2,500 requests/day (plenty for streaming)
- **Fallback**: Without key, automatically uses free Nominatim

#### Trip Distance Configuration

You can set the total distance using the `setTotalTraveled` URL parameter:

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

## API Keys Setup

### OpenCage Geocoding API (Optional but Recommended)

The location service can use OpenCage for higher quality reverse geocoding instead of the free Nominatim fallback.

#### Benefits of OpenCage over Nominatim:
- **Higher quality results** - Better formatted addresses
- **Better international coverage** - More accurate for non-English locations  
- **Faster response times** - Dedicated infrastructure
- **Priority support** - Professional service level

#### Getting OpenCage API Key:
1. **Visit**: https://opencagedata.com/
2. **Sign up** for free account (no credit card required)
3. **Free tier**: 2,500 requests/day (perfect for personal streaming)
4. **Copy your API key** from the dashboard

#### Configuration:
```bash
# Copy the environment template
cp env-template .env.local

# Edit .env.local and add your OpenCage API key
VITE_OPENCAGE_API_KEY=your_actual_opencage_api_key_here
```

### Weather API Setup (Required for Weather Features)

Weather functionality requires an OpenWeatherMap API key configured in two places:

#### Getting OpenWeatherMap API Key:
1. **Visit**: https://openweathermap.org/api/one-call-3
2. **Sign up** for free account
3. **Free tier**: 1,000 calls/day (sufficient for streaming use)
4. **Copy your API key** (may take a few hours to activate)

#### Local Development Configuration:
```bash
# Create/edit .dev.vars file for local Cloudflare Functions
echo "OWM_API_KEY=your_openweathermap_api_key_here" > .dev.vars

# Also add to .env.local for direct API fallback (optional)
echo "VITE_OWM_API_KEY=your_openweathermap_api_key_here" >> .env.local
```

#### Production Configuration:
1. **Cloudflare Pages Dashboard** → Your project → **Settings** → **Environment variables**
2. **Add variable**: `OWM_API_KEY` = `your_openweathermap_api_key_here`
3. **Redeploy** to apply changes

### Testing API Keys

#### Test OpenCage locally:
```bash
# Start dev server
pnpm dev

# Open dashboard and check location geocoding in browser console
# Should show "OpenCage provider succeeded" instead of "Nominatim provider"
```

#### Test Weather API locally:
```bash
# Use Wrangler for local functions testing
pnpm wrangler pages dev dist --local

# Test weather endpoint directly
curl "http://localhost:8788/functions/weather?lat=46.76&lon=17.25&units=metric"
# Should return JSON weather data, not HTML
```

## Local Development with Functions

⚠️ **Important**: Vite dev server doesn't support Cloudflare Functions. For full testing:

```bash
# Build the project first
pnpm build

# Run with Wrangler for functions support  
pnpm wrangler pages dev dist --local

# Access overlays at:
# http://localhost:8788/trip.html
# http://localhost:8788/dashboard.html
```
