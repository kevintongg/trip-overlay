# Contributing to Trip Overlay

Thank you for your interest in contributing to the IRL Trip Overlay project! This guide will help you get started with the **React + TypeScript** implementation.

## 🚀 Quick Start for Contributors

### Prerequisites

- **Node.js 18+** (for React development)
- **pnpm** package manager
- **Modern IDE** with TypeScript support (VS Code recommended)
- **Basic understanding** of React, TypeScript, HTML, CSS

### Development Setup

```bash
git clone https://github.com/yourusername/trip-overlay.git
cd trip-overlay
pnpm install

# Start development server
pnpm run dev

# Access React overlays at:
# http://localhost:5173/index-react.html
# http://localhost:5173/dashboard-react.html
```

### Testing Your Changes

**React Development Server (Primary Method)**

```bash
# Start development server with hot reloading
pnpm run dev

# Access React overlays at:
http://localhost:5173/index-react.html?demo=true
http://localhost:5173/dashboard-react.html?demo=true

# Features:
# ✅ Hot module reloading
# ✅ TypeScript error checking
# ✅ ESLint integration
# ✅ Source maps for debugging
```

**Production Build Testing**

```bash
# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Access at: http://localhost:4173
# Built files in: dist/
```

**Legacy File Testing (Backup)**

```bash
# Original vanilla JS files still work:
file:///path/to/trip-overlay/index.html?demo=true
file:///path/to/trip-overlay/dashboard.html?demo=true

# Use for compatibility testing only
```

**When do you need different approaches?**

- ✅ **Normal development** - React dev server (`pnpm dev`)
- ✅ **TypeScript development** - Dev server with type checking
- ✅ **Hot reloading** - React dev server
- ✅ **Production testing** - Build + preview (`pnpm run build && pnpm run preview`)
- ✅ **OBS integration** - Production build or legacy files
- ❌ **Direct file access** - Not needed for React development

### Code Quality

```bash
# TypeScript type checking
pnpm run type-check

# Lint code (ESLint + TypeScript)
pnpm run lint

# Auto-fix linting issues
pnpm run lint:fix

# Format code (Prettier)
pnpm run format

# Check formatting
pnpm run format:check

# Run all quality checks
pnpm run test
```

## 📁 Project Structure

```
trip-overlay/
├── src/                          # React + TypeScript source
│   ├── components/
│   │   ├── TripOverlay.tsx       # Main trip overlay component
│   │   └── Dashboard.tsx         # Weather/location dashboard
│   ├── hooks/
│   │   ├── useTripProgress.ts    # Trip state management
│   │   ├── useRtirlSocket.ts     # RTIRL WebSocket connection
│   │   ├── useWeatherData.ts     # Weather API integration
│   │   ├── useConsoleCommands.ts # Console API setup
│   │   └── useURLParameters.ts   # URL parameter processing
│   ├── store/
│   │   ├── tripStore.ts          # Zustand trip state
│   │   ├── connectionStore.ts    # Connection state
│   │   └── weatherStore.ts       # Weather data state
│   ├── types/
│   │   ├── trip.ts               # Trip-related TypeScript types
│   │   ├── weather.ts            # Weather API types
│   │   └── rtirl.ts              # RTIRL API types
│   ├── utils/
│   │   ├── config.ts             # Centralized configuration
│   │   ├── gps.ts                # GPS utility functions
│   │   ├── logger.ts             # Logging utility
│   │   └── globalConsoleAPI.ts   # Console commands setup
│   └── styles/                   # CSS files (preserved)
│       ├── trip-progress.css     # Trip overlay styles
│       └── dashboard.css         # Dashboard styles
├── index-react.html              # React trip overlay entry
├── dashboard-react.html          # React dashboard entry
├── functions/
│   ├── weather.js                # Original weather function
│   └── weather.ts                # Enhanced TypeScript version
├── assets/                       # Static assets
├── dist/                         # Built files (after pnpm build)
├── legacy files...               # Original vanilla JS (backup)
│   ├── index.html               # Legacy trip overlay
│   ├── dashboard.html           # Legacy dashboard
│   ├── js/                      # Legacy JavaScript
│   └── utils/                   # Legacy utilities
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── documentation files...       # Setup guides, API docs, etc.
```

## 🎯 Key Components

### React Components (`src/components/`)

- **TripOverlay.tsx** - Main trip progress overlay with React hooks
- **Dashboard.tsx** - Weather and location dashboard component
- **Type-safe props** - Full TypeScript interfaces for all components
- **React hooks integration** - Custom hooks for state management

### Custom Hooks (`src/hooks/`)

- **useTripProgress.ts** - Trip state management with Zustand
- **useRtirlSocket.ts** - WebSocket connection with auto-reconnect
- **useWeatherData.ts** - Weather API with React Query caching
- **useConsoleCommands.ts** - Console API setup with TypeScript
- **useURLParameters.ts** - URL parameter processing

### State Management (`src/store/`)

- **tripStore.ts** - Zustand store for trip data
- **connectionStore.ts** - RTIRL connection state
- **weatherStore.ts** - Weather data state
- **localStorage persistence** - Automatic state persistence
- **Type-safe stores** - Full TypeScript integration

### TypeScript Types (`src/types/`)

- **trip.ts** - Trip progress, GPS, movement detection types
- **weather.ts** - OpenWeatherMap API response types
- **rtirl.ts** - RTIRL WebSocket message types
- **Strict typing** - All external APIs fully typed

### Styling (Preserved CSS)

- **OBS Transparency** - Critical `background-color: rgba(0,0,0,0)` maintained
- **Responsive Design** - Original CSS preserved for compatibility
- **Stream-Friendly** - All original styling preserved
- **CSS Modules support** - Available for new components

### Enhanced Utilities (`src/utils/`)

- **config.ts** - TypeScript configuration with environment variables
- **gps.ts** - Enhanced GPS utilities with type safety
- **logger.ts** - Improved logging with type safety
- **globalConsoleAPI.ts** - Console commands with TypeScript support

### Controls & Integration

- **Hotkeys** - Ctrl+H, Ctrl+Shift+R for local OBS users
- **URL Parameters** - `?demo=true`, `?reset=today` for cloud environments
- **RTIRL WebSocket** - Real-time GPS data integration

## 🛠️ Development Guidelines

### Code Style (React + TypeScript)

- **TypeScript** - All new code must be TypeScript with strict typing
- **React Best Practices** - Functional components, hooks, proper state management
- **Modern JavaScript** - ES2022+ features, async/await, optional chaining
- **Error Handling** - Proper error boundaries and try/catch blocks
- **Performance** - React.memo, useMemo, useCallback where appropriate
- **Validation** - TypeScript interfaces + runtime validation for external data

### TypeScript Guidelines

```typescript
// Always define interfaces for props
interface TripOverlayProps {
  totalDistance: number;
  showControls?: boolean;
}

// Use proper types for hooks
const [distance, setDistance] = useState<number>(0);

// Type external API responses
interface RTIRLMessage {
  lat: number;
  lon: number;
  timestamp: number;
}
```

### Console Functions (Enhanced)

Console functions are now TypeScript-powered with better error handling:

```typescript
// Global console API with TypeScript
declare global {
  interface Window {
    TripOverlay: {
      getStatus: () => TripStatus;
      controls: {
        addDistance: (km: number) => void;
        resetTrip: () => void;
        // ... more typed functions
      };
    };
  }
}
```

### Naming Conventions

- **Components** - PascalCase (`TripOverlay`, `Dashboard`)
- **Hooks** - camelCase starting with `use` (`useTripProgress`)
- **Types/Interfaces** - PascalCase (`TripData`, `WeatherResponse`)
- **Functions** - camelCase (`updateDisplayElements`)
- **Constants** - SCREAMING_SNAKE_CASE (`TOTAL_DISTANCE_KM`)
- **Files** - kebab-case for utilities, PascalCase for components
- **CSS Classes** - kebab-case (preserved from original)

### Performance Considerations (React)

- **React Optimization** - Use React.memo, useMemo, useCallback appropriately
- **State Management** - Zustand for client state, React Query for server state
- **Debounced Updates** - Preserve `UI_UPDATE_DEBOUNCE` for smooth animations
- **Memory Management** - useEffect cleanup, automatic timer management
- **GPS Throttling** - React hooks for controlled GPS update frequency
- **Type Safety** - TypeScript prevents runtime performance issues
- **Bundle Optimization** - Vite code splitting and tree shaking

## 🧪 Testing

### TypeScript Testing

```bash
# Type checking
pnpm run type-check

# Unit tests (Vitest)
pnpm run test

# Test with UI
pnpm run test:ui

# Test coverage
pnpm run test:coverage
```

### Manual Testing Scenarios (React Version)

```javascript
// Enhanced console commands with TypeScript
TripOverlay.getStatus(); // Full system status
showConsoleCommands(); // All available functions

// Distance manipulation (type-safe)
TripOverlay.controls.addDistance(50); // Add 50km
TripOverlay.controls.setDistance(100); // Set exact distance
TripOverlay.controls.jumpToProgress(75); // Jump to 75%

// Unit conversion
TripOverlay.controls.convertToMiles(); // Switch to Imperial
TripOverlay.controls.convertToKilometers(); // Switch to Metric

// State management
TripOverlay.controls.resetTodayDistance(); // Reset daily
TripOverlay.controls.resetTripProgress(); // Full reset

// React-specific testing
TripOverlay.getReactState(); // React store state
TripOverlay.getHookStatus(); // Custom hooks status
```

### Component Testing

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { TripOverlay } from '../components/TripOverlay';

test('displays trip progress correctly', () => {
  render(<TripOverlay totalDistance={371} />);
  expect(screen.getByText(/progress/i)).toBeInTheDocument();
});
```

### Edge Cases to Test

- GPS coordinate validation (NaN, Infinity, out-of-range)
- Network interruptions (RTIRL disconnection)
- localStorage quota exceeded
- Rapid GPS updates (performance)
- Browser refresh (persistence)
- Unit conversion with existing data

### Cross-Platform Testing

- **React Dev Server** - `pnpm dev` for development
- **Production Build** - `pnpm build && pnpm preview` for final testing
- **Legacy Compatibility** - Test original vanilla JS files still work
- **Local OBS** - All features should work with React version
- **IRLToolkit Cloud** - URL parameters work with React version
- **Different Browsers** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers** - Touch-friendly controls preserved
- **TypeScript Compilation** - All builds must pass type checking

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

### GPS Validation (Enhanced TypeScript)

```typescript
interface GPSCoordinates {
  lat: number;
  lon: number;
}

function validateCoordinates(coords: unknown): coords is GPSCoordinates {
  // CRITICAL: Type-safe GPS validation
  return (
    typeof coords === 'object' &&
    coords !== null &&
    'lat' in coords &&
    'lon' in coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lon === 'number' &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lon) &&
    Math.abs(coords.lat) <= 90 &&
    Math.abs(coords.lon) <= 180
  );
}
```

### Streaming Compatibility (Preserved)

```css
body {
  /* CRITICAL: OBS transparency - NEVER change this */
  background-color: rgba(0, 0, 0, 0);
}
```

### Performance Optimization (React)

```typescript
// CRITICAL: React performance optimizations
const UI_UPDATE_DEBOUNCE = 100; // Preserved from original

// React-specific optimizations
const MemoizedTripOverlay = React.memo(TripOverlay);
const debouncedUpdate = useMemo(
  () => debounce(updateFunction, UI_UPDATE_DEBOUNCE),
  []
);
```

### Console API Compatibility (CRITICAL)

```typescript
// CRITICAL: Maintain 100% backward compatibility
// All existing console commands must work identically
window.TripOverlay = {
  getStatus: () => getReactTripStatus(),
  controls: {
    addDistance: (km: number) => addDistanceReact(km),
    resetTrip: () => resetTripReact(),
    // ... all original commands preserved
  },
};
```

## 📦 Adding New Features (React)

### 1. Feature Planning

- **React Architecture** - Plan component structure and state management
- **TypeScript Types** - Define interfaces for new data structures
- **Performance Impact** - Consider React rendering and 8+ hour streams
- **Backward Compatibility** - Ensure console commands and URL parameters work
- **Cross-platform** - Works in both local OBS AND IRLToolkit cloud

### 2. Implementation Checklist (React)

- [ ] **Plan TypeScript interfaces** - Define types in `src/types/`
- [ ] **Create React components** - Add to `src/components/`
- [ ] **Add custom hooks** - State logic in `src/hooks/`
- [ ] **Update Zustand stores** - State management in `src/store/`
- [ ] **Add utility functions** - Type-safe utilities in `src/utils/`
- [ ] **Preserve CSS styling** - Use existing CSS or add CSS modules
- [ ] **Add console commands** - Update `globalConsoleAPI.ts`
- [ ] **Add URL parameters** - Update `useURLParameters.ts`
- [ ] **Write tests** - Unit tests with Vitest
- [ ] **Test in demo mode** - `?demo=true` parameter
- [ ] **Type check** - `pnpm run type-check`
- [ ] **Update documentation** - All relevant .md files

### 3. React Component Pattern

```typescript
// src/components/NewFeature.tsx
interface NewFeatureProps {
  // Define props with TypeScript
}

export const NewFeature: React.FC<NewFeatureProps> = ({ ...props }) => {
  // Use custom hooks for state
  const { state, actions } = useNewFeatureState();
  
  // Use React Query for API calls
  const { data, isLoading } = useQuery({
    queryKey: ['newFeature'],
    queryFn: fetchNewFeatureData,
  });
  
  return (
    // JSX with preserved CSS classes
    <div className="original-css-class">
      {/* Component content */}
    </div>
  );
};
```

### 3. Documentation Updates

- [ ] Add to main README.md if user-facing
- [ ] Update console function list
- [ ] Add to COMPATIBILITY.md if platform-specific
- [ ] Include in IRLTOOLKIT-GUIDE.md if cloud-relevant

## 📊 Performance & Location Services (React)

### React-Optimized Services

The React version includes enhanced services with TypeScript and React integration:

- **`useLocationService`**: React hook for OpenCage + Nominatim with caching
- **`useSpeedUpdates`**: React hook for intelligent speed detection
- **`usePersistence`**: React hook for localStorage with Zustand integration
- **`useTimerManager`**: React hook for timer management with automatic cleanup
- **React Query**: Server state management with automatic caching and invalidation

### Service Usage Patterns

```typescript
// Location data with React hook
const { locationData, isLoading } = useLocationService(lat, lon);

// Speed updates with React state
const { currentSpeed, averageSpeed } = useSpeedUpdates(gpsData);

// Persistent state with Zustand
const tripData = useTripStore((state) => state.tripData);
const updateTrip = useTripStore((state) => state.updateTrip);

// Timer management
const { startTimer, clearTimer } = useTimerManager();

// Weather data with React Query
const { data: weather } = useQuery({
  queryKey: ['weather', lat, lon],
  queryFn: () => fetchWeather(lat, lon),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Performance Benefits

- **React-specific optimizations**: useMemo, useCallback, React.memo
- **Automatic cleanup**: useEffect cleanup prevents memory leaks
- **Type safety**: TypeScript prevents runtime errors
- **Better caching**: React Query for server state, Zustand for client state
- **Development tools**: React DevTools for debugging performance

## 🤝 Contribution Process

### 1. Before You Start

- Open an issue to discuss the feature/fix
- Check existing issues to avoid duplicates
- Consider if it fits the project scope (IRL streaming overlay)
- Review new optimization services if your feature involves performance-critical operations

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

## 🎯 Current Priorities (React Era)

### High Priority

- **Enhanced React Components** - More reusable, type-safe components
- **Performance Optimization** - React-specific optimizations for long streams
- **Testing Coverage** - Comprehensive unit and integration tests
- **Documentation** - Complete TypeScript API documentation

### Medium Priority

- **Multi-language support** - React i18n for international streamers
- **Speed/ETA calculations** - React hooks for viewer engagement features
- **Audio notifications** - React-based milestone celebrations
- **Enhanced state management** - More sophisticated Zustand stores

### Low Priority

- **Customizable themes** - CSS-in-JS or CSS modules for theming
- **Route segmentation** - React components for multi-day trips
- **Mobile companion** - React Native or PWA development
- **Advanced analytics** - React dashboard with charts
- **Social media integration** - React hooks for API integration
- **Map visualization** - React map components

### React Migration Completed ✅

- ✅ **Core Components** - TripOverlay and Dashboard migrated
- ✅ **State Management** - Zustand stores implemented
- ✅ **TypeScript Integration** - Full type safety
- ✅ **Console API Compatibility** - 100% backward compatible
- ✅ **URL Parameter Support** - All original parameters work
- ✅ **Build System** - Vite with TypeScript and React
- ✅ **Development Experience** - Hot reloading, type checking, linting

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

Thank you for helping make IRL streaming better for everyone! 🚴‍♂️✨

## 🔄 React Migration Status

**Migration Complete** ✅

The project has been successfully migrated to React + TypeScript while maintaining 100% backward compatibility:

- **All console commands work identically** - `TripOverlay.controls.*`
- **All URL parameters preserved** - `?demo=true`, `?reset=today`, etc.
- **Enhanced development experience** - Hot reloading, type safety, modern tooling
- **Improved performance** - React optimizations for long streaming sessions
- **Legacy support** - Original vanilla JS files preserved as backup

**For New Contributors:**
- Start with React components in `src/components/`
- Use TypeScript for all new code
- Follow React hooks patterns
- Maintain console API compatibility
- Test both React and legacy versions
