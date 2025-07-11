# 🚴‍♂️ IRL Trip Overlay Setup Guide

## Quick Start for IRL Streamers

### 1. **Development Environment Setup**

**Prerequisites:**
- Node.js 18+ installed
- pnpm package manager
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Installation:**

```bash
# Clone or download the repository
git clone <repository-url>
cd trip-overlay

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### 2. **Test the Overlay (Demo Mode)**

Access the React overlay in your browser:

```
# Development server (recommended)
http://localhost:5173/index-react.html?demo=true
http://localhost:5173/dashboard-react.html?demo=true

# Legacy vanilla JS (backup)
http://localhost:5173/index.html?demo=true
http://localhost:5173/dashboard.html?demo=true
```

You should see the overlay simulate cycling movement and distance tracking.

### 3. **Configure for Your Trip**

#### Environment Setup (Required)

Create and configure your environment variables:

```bash
# Copy the template file
cp .env.example .env.local

# Edit .env.local with your values:
VITE_RTIRL_USER_ID=your_rtirl_user_id_here
VITE_OPENCAGE_API_KEY=your_opencage_key_here  # Optional but recommended
VITE_OWM_API_KEY=your_openweather_key_here    # For weather features
```

**Environment Variables Explained:**

- **VITE_RTIRL_USER_ID**: Your RTIRL user ID (required for live GPS)
- **VITE_OPENCAGE_API_KEY**: Faster, higher-quality geocoding (optional)
- **VITE_OWM_API_KEY**: Weather data integration (required for weather)

#### Trip Distance Configuration

You can set the total distance using URL parameters:

`?setTotalTraveled=500` (to set total distance to 500km)
`?totalDistance=371` (Vienna to Zagreb default)

### 4. **Add to OBS Studio**

#### For Development (React Dev Server)

1. **Add Browser Source**:
   - Source → Add → Browser Source
   - Name: "Trip Overlay (React)"
   - URL: `http://localhost:5173/index-react.html`
   - Width: 1920, Height: 1080
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

#### For Production (Built Files)

1. **Build the project**:
   ```bash
   pnpm run build
   ```

2. **Add Browser Source**:
   - Source → Add → Browser Source
   - Name: "Trip Overlay"
   - URL: `file:///full/path/to/dist/index-react.html`
   - Width: 1920, Height: 1080
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

3. **Position the Overlay**:
   - Drag to top of screen
   - Resize as needed
   - Set blend mode to "Normal"
   - (The overlay is top-aligned by default. You can adjust in CSS if needed.)

### 5. **Stream Controls**

**Console Commands (F12 Browser Console):**

```javascript
// All original commands still work in React version
TripOverlay.getStatus();              // Complete system status
TripOverlay.controls.addDistance(10); // Add 10km
TripOverlay.controls.resetTrip();     // Reset everything
showConsoleCommands();                // Show all commands
```

**URL Parameters (Cloud/OBS Control):**

While streaming, you can use URL parameters to control the overlay. For example, to reset the daily distance, you would add `?reset=today` to the URL in your OBS browser source.

For a full list of commands, see the [API.md](./API.md) file.

### 6. **URL Parameters for Stream Management**

Add these to your OBS browser source URL:

```
?stream=true              # Enables stream mode
?controls=true            # Shows controls initially
?demo=true               # Demo mode for testing
?reset=today             # Reset today's distance on load
?export=true             # Auto-download backup on load
?setTotalTraveled=500    # Set total trip distance to 500km
```

**React Development Examples:**
```
http://localhost:5173/index-react.html?stream=true&controls=false
http://localhost:5173/dashboard-react.html?demo=true&weather=true
```

**Production Examples:**
```
file:///path/to/dist/index-react.html?stream=true&controls=false
https://your-site.pages.dev/index-react.html?demo=true
```

## 📱 RTIRL Setup

1. **Create Account**: Sign up at [rtirl.com](https://rtirl.com)
2. **Find Your User ID**: Check your profile page
3. **Mobile App**: Install RTIRL app on your phone
4. **Start Streaming**: Begin GPS broadcast from the app
5. **Overlay Connection**: The overlay will automatically connect

## 🔧 Troubleshooting

### Development Server Issues

- ✅ Check Node.js 18+ is installed: `node --version`
- ✅ Install dependencies: `pnpm install`
- ✅ Start dev server: `pnpm run dev`
- ✅ Access React overlays at `localhost:5173`

### Overlay Not Updating

- ✅ Check VITE_RTIRL_USER_ID in `.env.local`
- ✅ Ensure RTIRL app is broadcasting
- ✅ Check browser console (F12) for connection errors
- ✅ Try refreshing the browser source in OBS
- ✅ Verify environment variables are loaded

### Build Issues

- ✅ Run `pnpm run build` to create production files
- ✅ Check `dist/` folder for built files
- ✅ Use `pnpm run preview` to test built version

### GPS Jumps/Weird Distances

- The overlay automatically filters GPS jumps >200km/h
- Check console for "GPS jump detected" warnings
- Enhanced GPS validation in React version

### Performance Issues

- ✅ Enable "Shutdown source when not visible" in OBS
- ✅ Close browser dev tools during stream
- ✅ React version has improved performance optimizations
- ✅ Use production build for streaming: `pnpm run build`

### Demo Mode Not Working

- Make sure you're using `?demo=true` in the URL
- Try React version: `localhost:5173/index-react.html?demo=true`
- Check browser console (F12) for errors
- Ensure dev server is running: `pnpm run dev`

## 🎯 Advanced Configuration

### Custom Trip Distance

**React Version (Recommended):**
- Use environment variables in `.env.local`
- Use URL parameters: `?totalDistance=1500`
- Use console commands: `TripOverlay.controls.setTotalDistance(1500)`

**Legacy Configuration (for reference):**
```javascript
// Old vanilla JS method - now handled by React state management
const TOTAL_DISTANCE_KM = 1500.0; // e.g., for a cross-country trip
```

### TypeScript Configuration

The React version includes full TypeScript support:

```typescript
// Type-safe configuration in src/utils/config.ts
export const CONFIG = {
  trip: {
    totalDistanceKm: 371.0, // Vienna to Zagreb
    useAutoStart: false,
    manualStartLocation: { lat: 48.209, lon: 16.3531 },
  },
  // ... more configuration
};
```

## 📊 Data Persistence

### Backup Your Progress (React Version)

```javascript
// Console commands (all original commands work)
TripOverlay.controls.exportTripData();  // Download JSON backup
TripOverlay.controls.importTripData(jsonData); // Restore from backup

// Enhanced React state management
TripOverlay.getStatus(); // Complete state including React store
```

### Restore Progress

- Import backup via browser console: `TripOverlay.controls.importTripData(jsonString)`
- Or use URL parameter: `?import=<encoded-json>`
- React version includes improved data validation

### Cross-Device Setup

1. Export data from computer A: `TripOverlay.controls.exportTripData()`
2. Import data to computer B: `TripOverlay.controls.importTripData(backup)`
3. Continue stream seamlessly with React state persistence
4. All data persists in localStorage with enhanced error handling

## 🚨 Important Notes

### React Migration Benefits

- **Enhanced Performance**: Optimized React rendering and state management
- **Type Safety**: Full TypeScript integration prevents runtime errors
- **Better Architecture**: Cleaner separation of concerns and reusable components
- **Improved Testing**: Unit tests and better debugging capabilities
- **Modern Development**: Hot reloading, ESLint, Prettier integration

### Compatibility

- **100% Backward Compatible**: All console commands and URL parameters work identically
- **Legacy Support**: Original vanilla JS files preserved as backup
- **Stream Workflow**: Zero changes required for existing OBS setups
- **Browser Support**: Modern browsers required (Chrome 90+, Firefox 88+)

### Best Practices

- **Test everything** in demo mode first: `?demo=true`
- **Always backup** progress before major changes
- **Monitor browser console** (F12) for connection issues
- **Use production builds** for streaming: `pnpm run build`
- **The React overlay auto-saves** with enhanced persistence
- **Daily resets** happen automatically with 6-hour grace period

## 📞 Support

### React Version Issues

1. **Development Problems**: 
   - Check Node.js version: `node --version` (need 18+)
   - Verify dependencies: `pnpm install`
   - Check environment file: `.env.local` exists
   - Start dev server: `pnpm run dev`

2. **Build/Production Issues**:
   - Run build: `pnpm run build`
   - Test build: `pnpm run preview`
   - Check dist folder contains built files

3. **Legacy Compatibility**:
   - Original files available as backup in repository
   - All console commands work identically
   - URL parameters unchanged

### General Troubleshooting

1. Check browser console (F12) for errors
2. Test in demo mode first: `?demo=true`
3. Verify RTIRL connection and user ID
4. Check OBS browser source settings
5. Try React version: `index-react.html`

Good luck with your IRL stream! 🎥🚴‍♂️

## 🔄 React vs Legacy

| Feature | React Version | Legacy Version |
|---------|---------------|----------------|
| **Performance** | ✅ Optimized | ✅ Good |
| **Type Safety** | ✅ Full TypeScript | ❌ None |
| **Development** | ✅ Hot reload, modern tools | ⚠️ Manual refresh |
| **Console Commands** | ✅ 100% compatible | ✅ Original |
| **URL Parameters** | ✅ 100% compatible | ✅ Original |
| **Browser Support** | Chrome 90+, Firefox 88+ | Chrome 63+, Firefox 60+ |
| **Build Required** | ✅ For production | ❌ Direct file access |

**Recommendation**: Use React version for development and production. Legacy files remain as backup.

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
