# Contributing to Trip Overlay

Thank you for your interest in contributing to the IRL Trip Overlay project! This guide will help you get started.

## 🚀 Quick Start for Contributors

### Prerequisites

- Node.js 18+ (for development tools)
- pnpm package manager
- Basic understanding of JavaScript, HTML, CSS

### Development Setup

```bash
git clone https://github.com/yourusername/trip-overlay.git
cd trip-overlay
pnpm install
```

### Testing Your Changes

**Option 1: Direct File Access (Recommended - No Server Needed)**

```bash
# Open directly in browser - simplest method
# Just double-click index.html or use these URLs in browser:

# Windows:
file:///C:/path/to/trip-overlay/index.html
file:///C:/path/to/trip-overlay/index.html?demo=true

# Mac/Linux:
file:///Users/username/trip-overlay/index.html
file:///Users/username/trip-overlay/index.html?demo=true
```

**Option 2: Local Server (Rarely Needed)**

```bash
# Only if you absolutely need HTTPS or production simulation:
python -m http.server 8000    # Basic Python server
# OR
npx serve . -p 8000          # Node.js alternative

# Access at: http://localhost:8000
# Test with demo mode: http://localhost:8000?demo=true
```

**When might you need a server?**

- ❌ **Normal development** - Direct file access works perfectly
- ❌ **Testing RTIRL connection** - WebSocket works from file://
- ❌ **Testing localStorage** - Works fine from file://
- ❌ **Testing in OBS** - OBS accepts file:// URLs
- ✅ **HTTPS-only browser APIs** - Very rare edge case
- ✅ **Production environment simulation** - If you're paranoid

### Code Quality

```bash
# Lint code (check for issues)
pnpm run lint

# Format code (auto-fix style)
pnpm run format

# Check formatting
pnpm run format:check
```

## 📁 Project Structure

```
trip-overlay/
├── index.html           # Main overlay interface
├── js/
│   └── script.js        # Core application logic (~1000 lines)
├── css/
│   └── style.css        # Overlay styling
├── assets/
│   ├── cycling.gif      # Avatar animation for cycling
│   └── example.gif      # Demo screenshot
├── docs/
│   ├── README.md        # Main documentation
│   ├── SETUP-GUIDE.md   # Quick setup guide
│   ├── IRLTOOLKIT-GUIDE.md  # Cloud streaming guide
│   └── COMPATIBILITY.md # Feature matrix
└── package.json         # Dependencies and scripts
```

## 🎯 Key Components

### Core Application (`js/script.js`)

- **State Management** - `appState` object with connection status, UI state
- **GPS Handling** - `handleRtirtData()` processes RTIRL WebSocket data
- **UI Updates** - `updateDisplayElements()` with optimized DOM manipulation
- **Persistence** - `loadPersistedData()` / `savePersistedData()` for localStorage
- **Console Commands** - Testing functions accessible via browser console

### Styling (`css/style.css`)

- **OBS Transparency** - Critical `background-color: rgba(0,0,0,0)` for streaming
- **Responsive Design** - Flexbox layout for different screen sizes
- **Stream-Friendly** - Semi-transparent backgrounds, readable text shadows

### Controls & Integration

- **Hotkeys** - Ctrl+H, Ctrl+Shift+R for local OBS users
- **URL Parameters** - `?demo=true`, `?reset=today` for cloud environments
- **RTIRL WebSocket** - Real-time GPS data integration

## 🛠️ Development Guidelines

### Code Style

- **ES2022+ Features** - Use modern JavaScript (optional chaining, nullish coalescing)
- **Async/Await** - Prefer over Promise chains
- **Error Handling** - Wrap risky operations in try/catch
- **Performance** - Cache DOM elements, debounce UI updates
- **Validation** - Always validate GPS coordinates and distance values

### Console Functions

All testing functions should be globally accessible:

```javascript
// Make functions available in browser console
window.addDistance = addDistance;
window.convertToMiles = convertToMiles;
```

### Naming Conventions

- **Functions** - camelCase (`updateDisplayElements`)
- **Constants** - SCREAMING_SNAKE_CASE (`TOTAL_DISTANCE_KM`)
- **DOM Elements** - descriptive IDs (`distance-traveled`, `progress-bar`)
- **CSS Classes** - kebab-case (`.data-box`, `.control-panel`)

### Performance Considerations

- **DOM Caching** - Store element references in `domElements` object
- **Debounced Updates** - Use `UI_UPDATE_DEBOUNCE` for smooth animations
- **Memory Management** - Clean up timers and event listeners
- **GPS Throttling** - Limit updates to prevent UI lag

## 🧪 Testing

### Manual Testing Scenarios

```javascript
// Test in browser console
showConsoleCommands(); // See all available functions

// Distance manipulation
addDistance(50); // Add 50km
setDistance(100); // Set exact distance
jumpToProgress(75); // Jump to 75% completion

// Unit conversion
convertToMiles(); // Switch to Imperial
convertToKilometers(); // Switch to Metric

// State management
resetTodayDistance(); // Reset daily counter
resetTripProgress(); // Full reset
```

### Edge Cases to Test

- GPS coordinate validation (NaN, Infinity, out-of-range)
- Network interruptions (RTIRL disconnection)
- localStorage quota exceeded
- Rapid GPS updates (performance)
- Browser refresh (persistence)
- Unit conversion with existing data

### Cross-Platform Testing

- **Local OBS** - All features should work
- **IRLToolkit Cloud** - Only URL parameters work
- **Different Browsers** - Chrome, Firefox, Safari
- **Mobile Browsers** - Touch-friendly controls

## 🎨 UI/UX Guidelines

### Stream-Friendly Design

- **Transparent Background** - Critical for OBS overlay
- **Readable Text** - White text with dark shadows
- **Clean Layout** - Minimal distractions from stream content
- **Responsive** - Works on various overlay sizes

### Accessibility

- **High Contrast** - Ensure text is readable on any background
- **Large Touch Targets** - Buttons 44px+ for mobile
- **Screen Reader** - Use semantic HTML and ARIA labels
- **Keyboard Navigation** - All functions accessible via hotkeys

## 🛡️ Edge Cases & Error Handling

The Trip Overlay handles numerous edge cases to ensure stability during long streaming sessions:

### GPS Data Validation

- **Invalid coordinates** - Rejects NaN, Infinity, null, undefined values
- **Out-of-range coordinates** - Validates latitude (-90 to 90) and longitude (-180 to 180)
- **Suspicious 0,0 coordinates** - Common GPS error, automatically rejected for auto-start location
- **GPS jumps** - Detects impossibly large distances and shows warnings instead of crashing
- **Speed validation** - Sanity checks for realistic travel speeds (prevents teleportation bugs)

### Data Persistence

- **localStorage corruption** - Graceful fallback to default values if data is malformed
- **localStorage quota exceeded** - Handles storage limit errors without crashing
- **Import validation** - Validates backup file structure before restoring data

### Network & Connection

- **RTIRL connection errors** - Exponential backoff retry with jitter for WebSocket reconnections
- **Missing RTIRL_USER_ID** - Clear error messages when configuration is incomplete
- **Data validation** - All incoming WebSocket data is validated before processing

### UI & Performance

- **Performance throttling** - GPS updates limited to max 1 per second to prevent UI lag
- **UI overflow protection** - Distance displays capped at reasonable maximums
- **Progress bar safety** - Ensures 0-100% range, prevents negative or overflow values
- **DOM element fallbacks** - Handles missing DOM elements gracefully

### Time Zone & Travel

- **Timezone-aware daily resets** - 6-hour grace period for midnight streaming sessions
- **Cross-timezone travel** - Preserves sessions when traveling across time zones
- **Date validation** - Handles system clock changes and daylight saving time

### User Experience

- **Auto-start location accuracy** - Re-detection if first GPS reading seems inaccurate
- **Unit conversion safety** - Maintains precision when switching between miles/kilometers
- **State consistency** - All operations maintain consistent app state

## 🚨 Critical Areas (Handle with Care)

### GPS Validation

```javascript
function validateCoordinates(coords) {
  // CRITICAL: Prevents crashes from invalid GPS data
  // Must handle: null, undefined, NaN, Infinity, out-of-range values
}
```

### Streaming Compatibility

```css
body {
  /* CRITICAL: OBS transparency - NEVER change this */
  background-color: rgba(0, 0, 0, 0);
}
```

### Performance Optimization

```javascript
// CRITICAL: Prevents UI lag during long streams
const UI_UPDATE_DEBOUNCE = 100; // Don't change without testing
```

## 📦 Adding New Features

### 1. Feature Planning

- Check if feature works in both local OBS AND IRLToolkit cloud
- Consider performance impact on 8+ hour streams
- Ensure backward compatibility with existing saves

### 2. Implementation Checklist

- [ ] Add feature logic to `js/script.js`
- [ ] Add any new CSS styling to `css/style.css`
- [ ] Update HTML structure if needed
- [ ] Add console command if applicable
- [ ] Add URL parameter if cloud-compatible
- [ ] Test in demo mode
- [ ] Update documentation

### 3. Documentation Updates

- [ ] Add to main README.md if user-facing
- [ ] Update console function list
- [ ] Add to COMPATIBILITY.md if platform-specific
- [ ] Include in IRLTOOLKIT-GUIDE.md if cloud-relevant

## 🤝 Contribution Process

### 1. Before You Start

- Open an issue to discuss the feature/fix
- Check existing issues to avoid duplicates
- Consider if it fits the project scope (IRL streaming overlay)

### 2. Making Changes

- Fork the repository
- Create a feature branch (`feature/speed-display`)
- Make your changes following the guidelines above
- Test thoroughly (local + demo mode)

### 3. Pull Request

- Include clear description of changes
- List any breaking changes
- Add screenshots for UI changes
- Include testing instructions

### 4. Review Process

- Code review for style and performance
- Feature testing in multiple environments
- Documentation review
- Final approval and merge

## 🎯 Current Priorities

### High Priority

- Multi-language support for international streamers
- Speed/ETA calculations for viewer engagement
- Audio notifications for milestone celebrations

### Medium Priority

- Customizable themes (colors, fonts)
- Route segmentation for multi-day trips
- Mobile companion app for easier control

### Low Priority

- Advanced analytics dashboard
- Social media integration
- Map visualization

## 📞 Getting Help

- **General Questions** - Open a GitHub issue
- **Bug Reports** - Include browser, setup type (local/cloud), steps to reproduce
- **Feature Requests** - Explain the use case and why it's valuable for IRL streamers
- **Documentation** - Point out unclear sections or missing information

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant features
- Special thanks for critical bug fixes

Thank you for helping make IRL streaming better for everyone! 🏍️✨
