# Migration Plan: Vanilla JS to React + TypeScript + Vite

## Overview
This document provides a comprehensive step-by-step migration plan from the current vanilla JavaScript implementation to a modern React + TypeScript + Vite stack.

## Step 0: Repository Management Strategy

### 0.1 Branch-Based Migration Approach
To use the same GitHub repository while safely migrating, we'll use a branch-based strategy that preserves the current deployment while developing the new version.

```bash
# Create and switch to migration branch
git checkout -b react-migration

# Ensure we're working from the latest main
git pull origin main
```

### 0.2 Directory Structure Strategy
We'll create the new React application alongside the existing vanilla JS files, allowing both versions to coexist during development and testing.

```
trip-overlay/                    # Existing repository root
├── assets/                      # Keep existing assets (shared)
├── css/                         # Keep existing (for fallback)
├── js/                          # Keep existing (for fallback)
├── utils/                       # Keep existing (for reference)
├── functions/                   # Migrate to TypeScript for better safety
│   ├── weather.js               # KEEP: Original (for rollback)
│   └── weather.ts               # NEW: TypeScript version
├── index.html                   # Keep existing (vanilla JS version)
├── dashboard.html               # Keep existing (vanilla JS version)
├── package.json                 # Update for new dependencies
├── .dev.vars                    # CRITICAL: OWM API key for local development
├── .env                         # NEW: Environment template (committed)
├── .env.local                   # NEW: Personal environment variables (gitignored)
├── .cursor/                     # NEW: Cursor IDE configuration
│   └── rules                    # NEW: Cursor-specific development rules
├── src/                         # NEW: React application source
│   ├── components/
│   ├── hooks/
│   ├── store/
│   ├── utils/                   # Migrated and typed versions
│   ├── types/
│   ├── TripOverlay.tsx
│   ├── Dashboard.tsx
│   ├── trip-main.tsx
│   └── dashboard-main.tsx
├── index-react.html             # NEW: React trip overlay entry
├── dashboard-react.html         # NEW: React dashboard entry
├── vite.config.ts               # NEW: Vite configuration
├── tsconfig.json                # NEW: TypeScript configuration
├── tailwind.config.js           # NEW: Tailwind configuration
└── vitest.config.ts             # NEW: Testing configuration
```

**Critical**: Ensure your `.dev.vars` file is present and properly configured before starting development. The weather functionality depends on this API key.

### 0.3 Cloudflare Pages Branch Deployment
Configure Cloudflare Pages to automatically deploy the migration branch for testing:

1. **Main branch** continues to serve the current vanilla JS version
2. **react-migration branch** deploys to a preview URL (e.g., `react-migration.trip-overlay.pages.dev`)
3. Test the React version thoroughly on the preview deployment
4. Once validated, merge to main and update the primary deployment

## Step 1: Environment Setup

### 1.1 Initialize New Vite Project Structure
```bash
# Initialize Vite React TypeScript project in the existing repository
# (Run this from the repository root)
pnpm create vite temp-react-setup --template react-ts

# Move Vite files to repository root (keeping existing files)
mv temp-react-setup/src ./src
mv temp-react-setup/vite.config.ts ./
mv temp-react-setup/tsconfig.json ./
mv temp-react-setup/tailwind.config.js ./ # (after Tailwind setup)

# Clean up temporary directory
rm -rf temp-react-setup

# Update package.json to include both old and new dependencies

# Install additional dependencies
pnpm add @types/node
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D @tailwindcss/typography
pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom

# Initialize Tailwind CSS
npx tailwindcss init -p

# CRITICAL: Configure environment variables before proceeding

# Create committed .env template for contributors
cat > .env << 'EOF'
# Environment variables template - safe to commit
# Contributors: copy these to .env.local and add your values

VITE_DEMO_MODE=false
VITE_RTIRL_USER_ID=
EOF

# Create personal .env.local (gitignored)
cat > .env.local << 'EOF'
# Personal environment variables - DO NOT COMMIT
VITE_RTIRL_USER_ID=41908566
VITE_DEMO_MODE=false
EOF

# Create .dev.vars file for local Cloudflare Functions development
echo "OWM_API_KEY=your_openweathermap_api_key_here" > .dev.vars

echo "⚠️  IMPORTANT: Update .dev.vars with your actual OpenWeatherMap API key"
echo "💡 Get your API key from: https://openweathermap.org/api/one-call-3"
echo "📝 Contributors will need to create their own .env.local with their RTIRL user ID"
```

### 1.2 Install shadcn-ui
```bash
# Initialize shadcn-ui
npx shadcn-ui@latest init

# Install core components we'll need
npx shadcn-ui@latest add button
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
```

### 1.3 Install Project Dependencies
```bash
# Core dependencies from current project
pnpm add @rtirl/api

# Additional utilities for React development
pnpm add clsx tailwind-merge
pnpm add zustand  # For state management
pnpm add @tanstack/react-query  # For API state management
```

### 1.4 Configure Vite
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index-react.html',        // React trip overlay
        dashboard: 'dashboard-react.html' // React dashboard
      }
    }
  },
  // During development, serve assets from existing directories
  publicDir: 'assets'
})
```

## Step 2: Component Breakdown & Multi-Overlay Strategy

### 2.1 Application Architecture Decision
**Strategy**: Single application with multiple entry points
- Use Vite's multi-page app configuration
- Shared components and state management
- Two separate HTML entry points for OBS browser sources

### 2.2 Component Hierarchy

#### Shared Components
```
src/
├── components/
│   ├── ui/              # shadcn-ui components
│   ├── core/
│   │   ├── ProgressBar.tsx
│   │   ├── Avatar.tsx
│   │   ├── WeatherWidget.tsx
│   │   ├── LocationDisplay.tsx
│   │   ├── SpeedDisplay.tsx
│   │   ├── TimeDisplay.tsx
│   │   └── ControlPanel.tsx
│   └── layout/
│       ├── OverlayContainer.tsx
│       └── DashboardContainer.tsx
├── hooks/
│   ├── useRtirlSocket.ts
│   ├── useTripProgress.ts
│   ├── useWeatherData.ts
│   ├── useLocalStorage.ts
│   └── useTimezone.ts
├── store/
│   ├── tripStore.ts
│   ├── weatherStore.ts
│   └── connectionStore.ts
├── utils/
│   ├── config.ts         # Migrated from utils/config.js
│   ├── gps.ts           # Migrated from utils/gps.js
│   ├── rtirl.ts         # Migrated from utils/rtirl.js
│   └── logger.ts        # Migrated from utils/logger.js
├── types/
│   ├── rtirl.ts
│   ├── weather.ts
│   ├── trip.ts
│   └── console.ts
├── TripOverlay.tsx       # Main trip progress overlay
├── Dashboard.tsx         # Dashboard overlay
├── trip-main.tsx         # Trip overlay entry point
├── dashboard-main.tsx    # Dashboard overlay entry point
└── main.tsx             # Shared initialization logic
```

#### Entry Points
```html
<!-- index-react.html (NEW React version) -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trip Overlay - React</title>
  <!-- Preserve OBS-compatible styling -->
  <style>
    body { 
      background-color: rgba(0, 0, 0, 0); 
      margin: 0; 
      font-family: 'Inter', sans-serif; 
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/trip-main.tsx"></script>
</body>
</html>

<!-- dashboard-react.html (NEW React version) -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard Overlay - React</title>
  <style>
    body { 
      background-color: rgba(0, 0, 0, 0); 
      margin: 0; 
      font-family: 'Inter', sans-serif; 
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/dashboard-main.tsx"></script>
</body>
</html>

<!-- Keep existing index.html and dashboard.html unchanged for fallback -->
```

### 2.3 Component Implementation Examples

#### ProgressBar Component
```typescript
// src/components/core/ProgressBar.tsx
import { Progress } from '@/components/ui/progress'
import { Avatar } from './Avatar'

interface ProgressBarProps {
  percentage: number
  totalDistance: number
  traveledDistance: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
}

export function ProgressBar({ 
  percentage, 
  totalDistance, 
  traveledDistance, 
  currentMode 
}: ProgressBarProps) {
  return (
    <div className="relative w-full max-w-[600px] mx-auto mb-2">
      <Progress value={percentage} className="h-3" />
      <Avatar 
        mode={currentMode} 
        position={percentage}
        className="absolute bottom-0.5 transform -translate-x-1/2"
        style={{% raw %}{{ left: `${percentage}%` }}{% endraw %}}
      />
      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
        {percentage.toFixed(1)}%
      </span>
    </div>
  )
}
```

#### WeatherWidget Component
```typescript
// src/components/core/WeatherWidget.tsx
interface WeatherWidgetProps {
  weather: WeatherData | null
  location: string
  isLoading: boolean
}

export function WeatherWidget({ weather, location, isLoading }: WeatherWidgetProps) {
  if (isLoading) {
    return <div className="animate-pulse">Loading weather...</div>
  }

  return (
    <Card className="bg-black/30 border-white/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl">{weather?.icon}</span>
          <div>
            <div className="text-xl font-bold">{weather?.temp}°</div>
            <div className="text-sm text-gray-300">{weather?.description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Step 3: Logic and State Migration

### 3.1 Custom Hooks Implementation

#### useRtirlSocket Hook
```typescript
// src/hooks/useRtirlSocket.ts
import { useEffect, useState } from 'react'
import { useConnectionStore } from '@/store/connectionStore'

export function useRtirlSocket() {
  const { setConnected, setPosition } = useConnectionStore()
  const [isDemo] = useState(() => 
    new URLSearchParams(window.location.search).get('demo') === 'true'
  )

  useEffect(() => {
    // Migrate RTIRL initialization logic from utils/rtirl.js
    // Convert to React hooks pattern
  }, [])

  return {
    isConnected: useConnectionStore(state => state.isConnected),
    lastPosition: useConnectionStore(state => state.lastPosition),
    isDemo
  }
}
```

#### useTripProgress Hook
```typescript
// src/hooks/useTripProgress.ts
import { useCallback } from 'react'
import { useTripStore } from '@/store/tripStore'
import { useLocalStorage } from './useLocalStorage'

export function useTripProgress() {
  const {
    totalDistance,
    traveledDistance,
    todayDistance,
    updateDistance,
    resetTrip,
    resetToday
  } = useTripStore()

  const [persistedData, setPersistentData] = useLocalStorage('tripProgress', {
    totalDistanceTraveled: 0,
    todayDistanceTraveled: 0,
    lastActiveDate: new Date().toDateString()
  })

  const saveProgress = useCallback(() => {
    setPersistentData({
      totalDistanceTraveled: traveledDistance,
      todayDistanceTraveled: todayDistance,
      lastActiveDate: new Date().toDateString()
    })
  }, [traveledDistance, todayDistance, setPersistentData])

  return {
    totalDistance,
    traveledDistance,
    todayDistance,
    progressPercent: (traveledDistance / totalDistance) * 100,
    updateDistance,
    resetTrip,
    resetToday,
    saveProgress
  }
}
```

### 3.2 State Management with Zustand

#### Trip Store
```typescript
// src/store/tripStore.ts
import { create } from 'zustand'

interface TripState {
  totalDistance: number
  traveledDistance: number
  todayDistance: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
  useImperialUnits: boolean
  
  updateDistance: (distance: number) => void
  setMode: (mode: 'STATIONARY' | 'WALKING' | 'CYCLING') => void
  resetTrip: () => void
  resetToday: () => void
  toggleUnits: () => void
  
  // Console command methods
  addDistance: (km: number) => void
  setDistance: (km: number) => void
  jumpToProgress: (percent: number) => void
  setTotalDistance: (km: number) => void
  setTodayDistance: (km: number) => void
  setTotalTraveled: (km: number) => void
  convertToMiles: () => void
  convertToKilometers: () => void
}

export const useTripStore = create<TripState>((set, get) => ({
  totalDistance: 371.0, // Vienna to Zagreb
  traveledDistance: 0,
  todayDistance: 0,
  currentMode: 'STATIONARY',
  useImperialUnits: false,

  updateDistance: (distance) => set((state) => ({
    traveledDistance: state.traveledDistance + distance,
    todayDistance: state.todayDistance + distance
  })),

  setMode: (mode) => set({ currentMode: mode }),

  resetTrip: () => set({
    traveledDistance: 0,
    todayDistance: 0,
    currentMode: 'STATIONARY'
  }),

  resetToday: () => set({ todayDistance: 0 }),

  toggleUnits: () => set((state) => ({
    useImperialUnits: !state.useImperialUnits
  })),

  // Console command implementations
  addDistance: (km: number) => {
    const distance = parseFloat(km.toString())
    if (isFinite(distance)) {
      set((state) => ({
        traveledDistance: Math.max(0, state.traveledDistance + distance),
        todayDistance: Math.max(0, state.todayDistance + distance)
      }))
    }
  },

  setDistance: (km: number) => {
    const distance = parseFloat(km.toString())
    if (distance >= 0 && isFinite(distance)) {
      set({
        traveledDistance: distance,
        todayDistance: distance
      })
    }
  },

  jumpToProgress: (percent: number) => {
    const percentage = parseFloat(percent.toString())
    if (percentage >= 0 && percentage <= 100 && isFinite(percentage)) {
      const state = get()
      const targetDistance = (percentage / 100) * state.totalDistance
      set({
        traveledDistance: targetDistance,
        todayDistance: targetDistance
      })
    }
  },

  setTotalDistance: (km: number) => {
    const newTotal = parseFloat(km.toString())
    if (newTotal > 0 && isFinite(newTotal)) {
      set({ totalDistance: newTotal })
    }
  },

  setTodayDistance: (km: number) => {
    const distance = parseFloat(km.toString())
    if (isFinite(distance) && distance >= 0) {
      set({ todayDistance: distance })
    }
  },

  setTotalTraveled: (km: number) => {
    const distance = parseFloat(km.toString())
    if (isFinite(distance) && distance >= 0) {
      set({ traveledDistance: distance })
    }
  },

  convertToMiles: () => set({ useImperialUnits: true }),

  convertToKilometers: () => set({ useImperialUnits: false })
}))
```

## Step 4: API and Service Integration

### 4.1 Weather Service with React Query
```typescript
// src/hooks/useWeatherData.ts
import { useQuery } from '@tanstack/react-query'

async function fetchWeather(lat: number, lon: number) {
  const response = await fetch(`/functions/weather?lat=${lat}&lon=${lon}&units=metric`)
  if (!response.ok) throw new Error('Weather fetch failed')
  return response.json()
}

export function useWeatherData(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetchWeather(lat!, lon!),
    enabled: Boolean(lat && lon),
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000 // 5 minutes
  })
}
```

### 4.2 RTIRL Integration
```typescript
// src/utils/rtirl.ts (migrated and enhanced)
import { CONFIG } from './config'

export class RTIRLService {
  private callbacks = new Set<(data: LocationData) => void>()
  
  async initialize() {
    // Migrate existing RTIRL logic to class-based structure
    // Add proper error handling and TypeScript types
  }
  
  subscribe(callback: (data: LocationData) => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }
}
```

### 4.3 Weather Function TypeScript Migration

**Benefits of migrating `functions/weather.js` to TypeScript:**

1. **API Response Validation**: OpenWeatherMap's One Call API has a complex response structure
2. **Parameter Type Safety**: Ensure lat/lon are valid numbers, units are valid strings
3. **Error Handling**: Better structured error responses with proper types
4. **Environment Variable Safety**: Type-safe access to `context.env.OWM_API_KEY`

```typescript
// functions/weather.ts
interface WeatherContext {
  request: Request;
  env: {
    OWM_API_KEY: string;
  };
}

interface WeatherParams {
  lat: string;
  lon: string;
  units: 'metric' | 'imperial' | 'standard';
}

interface ErrorResponse {
  error: string;
  message?: string;
  status?: number;
  statusText?: string;
}

// OpenWeatherMap One Call API 3.0 response types
interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  uvi: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind_speed: number;
  wind_deg: number;
}

interface WeatherResponse {
  current: CurrentWeather;
  daily: Array<{
    temp: {
      min: number;
      max: number;
    };
  }>;
  hourly: Array<{
    dt: number;
    temp: number;
    weather: Array<{
      icon: string;
      description: string;
    }>;
  }>;
}

export async function onRequest(context: WeatherContext): Promise<Response> {
  const url = new URL(context.request.url);
  
  // Type-safe parameter extraction with validation
  const params = extractAndValidateParams(url);
  if ('error' in params) {
    return createErrorResponse(params, 400);
  }

  const apiKey = context.env.OWM_API_KEY;
  if (!apiKey) {
    return createErrorResponse({
      error: 'API key not configured on server.',
      message: 'Ensure OWM_API_KEY is set in .dev.vars for local development or in Cloudflare Pages secrets for production.',
    }, 500);
  }

  try {
    const weatherData = await fetchWeatherData(params, apiKey);
    return new Response(JSON.stringify(weatherData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Weather API fetch failed:', error);
    return createErrorResponse({
      error: 'Failed to fetch weather data.',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

function extractAndValidateParams(url: URL): WeatherParams | ErrorResponse {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const units = url.searchParams.get('units') || 'metric';

  if (!lat || !lon) {
    return { error: 'Missing "lat" or "lon" query parameters' };
  }

  // Validate coordinates
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  
  if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
    return { error: 'Invalid latitude or longitude values' };
  }

  // Validate units
  if (!['metric', 'imperial', 'standard'].includes(units)) {
    return { error: 'Invalid units parameter. Must be metric, imperial, or standard' };
  }

  return { lat, lon, units: units as 'metric' | 'imperial' | 'standard' };
}

async function fetchWeatherData(params: WeatherParams, apiKey: string): Promise<WeatherResponse> {
  const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${params.lat}&lon=${params.lon}&units=${params.units}&exclude=minutely,alerts&appid=${apiKey}`;
  
  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenWeatherMap API Error: ${errorText}`);
    throw new Error(`OpenWeatherMap API Error: ${response.status} ${response.statusText}`);
  }

  const data: WeatherResponse = await response.json();
  return data;
}

function createErrorResponse(error: ErrorResponse, status: number): Response {
  return new Response(JSON.stringify(error), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Migration Benefits:**
- **Type Safety**: Prevents runtime errors from malformed requests
- **API Contract**: Documents the expected OpenWeatherMap response structure  
- **Better Error Handling**: Structured error responses with proper validation
- **Maintainability**: Clear interfaces make future changes safer
- **Developer Experience**: IntelliSense and autocomplete for weather data

### 4.4 Console Commands System Migration

**Critical for Cloud OBS Control**: The console commands are essential for managing the overlay remotely via browser console in streaming environments.

```typescript
// src/hooks/useConsoleCommands.ts
import { useTripStore } from '@/store/tripStore'
import { useLocalStorage } from './useLocalStorage'

export function useConsoleCommands() {
  const tripStore = useTripStore()
  const [, setStoredData] = useLocalStorage('tripProgress', {})

  // Console command implementations with feedback
  const consoleCommands = {
    addDistance: (km: number) => {
      tripStore.addDistance(km)
      setStoredData(prev => ({ ...prev, lastUpdate: Date.now() }))
      const action = km >= 0 ? 'Added' : 'Adjusted'
      console.log(`CONSOLE: ${action} ${Math.abs(km)}km`)
      return `${action} ${Math.abs(km).toFixed(1)}km`
    },

    setDistance: (km: number) => {
      tripStore.setDistance(km)
      setStoredData(prev => ({ ...prev, lastUpdate: Date.now() }))
      console.log(`CONSOLE: Set distance to ${km}km`)
      return `Set to ${km.toFixed(1)}km`
    },

    jumpToProgress: (percent: number) => {
      tripStore.jumpToProgress(percent)
      setStoredData(prev => ({ ...prev, lastUpdate: Date.now() }))
      const targetDistance = (percent / 100) * tripStore.totalDistance
      console.log(`CONSOLE: Jumped to ${percent}% (${targetDistance.toFixed(1)}km)`)
      return `${percent}% progress`
    },

    setTotalDistance: (km: number) => {
      tripStore.setTotalDistance(km)
      console.log(`CONSOLE: Set total distance to ${km}km`)
      return `Trip distance: ${km}km`
    },

    convertToMiles: () => {
      if (!tripStore.useImperialUnits) {
        tripStore.convertToMiles()
        console.log('CONSOLE: Switched to miles')
        return 'Units: Kilometers → Miles'
      }
      return 'Already using miles'
    },

    convertToKilometers: () => {
      if (tripStore.useImperialUnits) {
        tripStore.convertToKilometers()
        console.log('CONSOLE: Switched to kilometers')
        return 'Units: Miles → Kilometers'
      }
      return 'Already using kilometers'
    },

    resetTripProgress: () => {
      tripStore.resetTrip()
      setStoredData({})
      console.log('CONSOLE: Reset all trip progress')
      return 'Trip progress reset'
    },

    resetTodayDistance: () => {
      tripStore.resetToday()
      setStoredData(prev => ({ ...prev, todayDistance: 0, lastUpdate: Date.now() }))
      console.log('CONSOLE: Reset today\'s distance')
      return 'Today\'s distance reset'
    },

    exportTripData: () => {
      const data = {
        totalDistanceTraveled: tripStore.traveledDistance,
        todayDistanceTraveled: tripStore.todayDistance,
        useImperialUnits: tripStore.useImperialUnits,
        totalDistance: tripStore.totalDistance,
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trip-overlay-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('CONSOLE: Trip data exported')
      return 'Trip data downloaded'
    },

    importTripData: (jsonString: string) => {
      try {
        const data = JSON.parse(jsonString)
        if (data.totalDistanceTraveled !== undefined) {
          tripStore.setTotalTraveled(data.totalDistanceTraveled)
        }
        if (data.todayDistanceTraveled !== undefined) {
          tripStore.setTodayDistance(data.todayDistanceTraveled)
        }
        if (data.useImperialUnits !== undefined) {
          data.useImperialUnits ? tripStore.convertToMiles() : tripStore.convertToKilometers()
        }
        if (data.totalDistance !== undefined) {
          tripStore.setTotalDistance(data.totalDistance)
        }
        setStoredData(data)
        console.log('CONSOLE: Trip data imported successfully')
        return 'Trip data imported'
      } catch (error) {
        console.error('CONSOLE: Failed to import trip data:', error)
        return 'Import failed - invalid JSON'
      }
    },

    showConsoleCommands: () => {
      const help = `
--- Trip Overlay Console Commands ---

// --- Distance Manipulation ---
TripOverlay.controls.addDistance(km)       - Adds/subtracts distance. Ex: TripOverlay.controls.addDistance(10.5)
TripOverlay.controls.setDistance(km)       - Sets the total distance traveled. Ex: TripOverlay.controls.setDistance(100)
TripOverlay.controls.jumpToProgress(%)     - Jumps to a specific percentage of the trip. Ex: TripOverlay.controls.jumpToProgress(50)

// --- Trip Configuration ---
TripOverlay.controls.setTotalDistance(km)  - Changes the total trip distance target. Ex: TripOverlay.controls.setTotalDistance(500)

// --- Unit Conversion ---
TripOverlay.controls.convertToMiles()      - Switches display to Imperial units (miles).
TripOverlay.controls.convertToKilometers() - Switches display to Metric units (kilometers).

// --- Reset Functions ---
TripOverlay.controls.resetTripProgress()   - Resets all trip data to zero.
TripOverlay.controls.resetTodayDistance()  - Resets only the 'today' distance counter.

// --- Data Management ---
TripOverlay.controls.exportTripData()      - Downloads a backup file of current trip progress.
TripOverlay.controls.importTripData(json)  - Restores trip progress from a JSON string.

// --- Debugging ---
TripOverlay.getStatus()           - Shows the current status of the overlay.

// --- URL Parameters (can be added to the overlay URL) ---
?controls=true        - Shows the control panel on load.
?reset=trip           - Resets all trip data on load.
?reset=today          - Resets today's distance on load.
?resets=trip,today    - Resets multiple items on load (comma-separated).
?export=true          - Downloads trip data backup on load.
?import=<json_string> - Imports trip data from a URL-encoded JSON string on load.
?units=miles          - Sets units to miles on load.
?units=km             - Sets units to kilometers on load.
?totalDistance=<km>   - Sets the total trip distance on load.
?addDistance=<km>     - Adds distance to total and today's distance on load.
?setDistance=<km>     - Sets total and today's distance on load.
?jumpTo=<percent>     - Jumps to a specific progress percentage on load.
?stream=true          - Enables stream mode (hotkey hints).
?setTodayDistance=<km>- Sets today's distance on load.
?setTotalTraveled=<km>- Sets total traveled distance on load.

------------------------------------
      `
      console.log(help)
      return 'Console commands displayed'
    }
  }

  return consoleCommands
}
```

### 4.5 URL Parameters System Migration

**Essential for Cloud OBS**: URL parameters allow overlay control without console access, critical for cloud streaming environments.

```typescript
// src/hooks/useURLParameters.ts
import { useEffect } from 'react'
import { useTripStore } from '@/store/tripStore'
import { useConsoleCommands } from './useConsoleCommands'

interface URLParamHandlers {
  [key: string]: (value: string) => void
}

export function useURLParameters() {
  const tripStore = useTripStore()
  const consoleCommands = useConsoleCommands()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    const paramHandlers: URLParamHandlers = {
      controls: (value) => {
        if (value === 'true') {
          // Show control panel - implement based on your React structure
          const event = new CustomEvent('showControls')
          window.dispatchEvent(event)
        }
      },

      reset: (value) => {
        console.log('URL parameter triggered: reset =', value)
        switch (value) {
          case 'trip':
            consoleCommands.resetTripProgress()
            break
          case 'today':
            consoleCommands.resetTodayDistance()
            break
          case 'location':
            // Reset auto-start location logic
            localStorage.removeItem('autoStartLocation')
            break
          default:
            console.warn('Unknown reset parameter:', value)
        }
      },

      resets: (value) => {
        const resetTypes = value.split(',')
        console.log('URL parameter triggered: multiple resets =', resetTypes)
        resetTypes.forEach(type => {
          paramHandlers.reset(type.trim())
        })
      },

      export: (value) => {
        if (value === 'true') {
          console.log('URL parameter triggered: exportTripData()')
          setTimeout(() => consoleCommands.exportTripData(), 1000)
        }
      },

      import: (value) => {
        try {
          if (value.length > 10000) {
            console.warn('Import data too large (>10KB), ignoring')
            return
          }

          const decodedData = decodeURIComponent(value)
          JSON.parse(decodedData) // Validate JSON
          
          console.log('URL parameter triggered: importTripData()')
          consoleCommands.importTripData(decodedData)
        } catch (error) {
          console.error('Failed to import data from URL parameter:', error)
        }
      },

      units: (value) => {
        if (value === 'miles') {
          consoleCommands.convertToMiles()
        } else if (value === 'km') {
          consoleCommands.convertToKilometers()
        }
      },

      totalDistance: (value) => {
        const distance = parseFloat(value)
        if (isFinite(distance) && distance > 0 && distance <= 50000) {
          tripStore.setTotalDistance(distance)
        } else {
          console.warn('Invalid totalDistance parameter:', value, '(must be 0-50000)')
        }
      },

      addDistance: (value) => {
        const distance = parseFloat(value)
        if (isFinite(distance) && distance >= -10000 && distance <= 10000) {
          consoleCommands.addDistance(distance)
        } else {
          console.warn('Invalid addDistance parameter:', value, '(must be -10000 to 10000)')
        }
      },

      setDistance: (value) => {
        const distance = parseFloat(value)
        if (isFinite(distance) && distance >= 0 && distance <= 50000) {
          consoleCommands.setDistance(distance)
        } else {
          console.warn('Invalid setDistance parameter:', value, '(must be 0-50000)')
        }
      },

      jumpTo: (value) => {
        const percentage = parseFloat(value)
        if (isFinite(percentage) && percentage >= 0 && percentage <= 100) {
          consoleCommands.jumpToProgress(percentage)
        } else {
          console.warn('Invalid jumpTo parameter:', value, '(must be 0-100)')
        }
      },

      stream: (value) => {
        if (value === 'true') {
          setTimeout(() => {
            // Show stream mode feedback - adapt to your React notification system
            const event = new CustomEvent('showFeedback', {
              detail: {
                message: '🏍️ Stream Mode: Press Ctrl+H for controls | Console commands available',
                type: 'success',
                duration: 6000
              }
            })
            window.dispatchEvent(event)
          }, 2000)
          console.log('🎥 Stream Mode enabled - console commands available')
        }
      },

      setTodayDistance: (value) => {
        const distance = parseFloat(value)
        if (isFinite(distance) && distance >= 0 && distance <= 1000) {
          tripStore.setTodayDistance(distance)
          console.log(`URL: Set today's distance to ${distance}km`)
        } else {
          console.warn('Invalid setTodayDistance parameter:', value, '(must be 0-1000)')
        }
      },

      setTotalTraveled: (value) => {
        const distance = parseFloat(value)
        if (isFinite(distance) && distance >= 0 && distance <= 50000) {
          tripStore.setTotalTraveled(distance)
          console.log(`URL: Set total traveled distance to ${distance}km`)
        } else {
          console.warn('Invalid setTotalTraveled parameter:', value, '(must be 0-50000)')
        }
      }
    }

    // Process all URL parameters
    for (const [key, handler] of Object.entries(paramHandlers)) {
      const value = urlParams.get(key)
      if (value !== null) {
        handler(value)
      }
    }
  }, []) // Run once on mount

  return null // This hook doesn't return anything, just processes URL params
}
```

### 4.6 Global Console API Setup

```typescript
// src/utils/globalConsoleAPI.ts
import { useTripStore } from '@/store/tripStore'

// Global console API setup - maintains backward compatibility
export function setupGlobalConsoleAPI() {
  const store = useTripStore.getState()
  
  // Make TripOverlay available globally for console access
  window.TripOverlay = {
    controls: {
      addDistance: store.addDistance,
      setDistance: store.setDistance,
      jumpToProgress: store.jumpToProgress,
      setTotalDistance: store.setTotalDistance,
      convertToMiles: store.convertToMiles,
      convertToKilometers: store.convertToKilometers,
      resetTripProgress: store.resetTrip,
      resetTodayDistance: store.resetToday,
      exportTripData: () => {
        // Export implementation
      },
      importTripData: (jsonString: string) => {
        // Import implementation
      }
    },
    getStatus: () => {
      const state = useTripStore.getState()
      return {
        traveledDistance: state.traveledDistance,
        todayDistance: state.todayDistance,
        totalDistance: state.totalDistance,
        progressPercent: (state.traveledDistance / state.totalDistance) * 100,
        currentMode: state.currentMode,
        useImperialUnits: state.useImperialUnits
      }
    }
  }

  // Backward compatibility
  window.showConsoleCommands = () => {
    console.log('Use TripOverlay.controls.* for console commands')
    // Show full help
  }
}
```

## Step 5: Deployment Configuration

### 5.1 Cloudflare Pages Configuration

#### Branch-Specific Build Configuration
Set up Cloudflare Pages to handle both the main branch (vanilla JS) and the migration branch (React):

**Main Branch (Current Vanilla JS)**:
```yaml
Build command: # Leave empty (static files)
Build output directory: / 
Root directory: /
Node.js version: 18 (for functions only)
```

**React-Migration Branch (New React Version)**:
```yaml
Build command: pnpm run build
Build output directory: dist
Root directory: /
Node.js version: 18
Environment variables:
  - VITE_RTIRL_USER_ID: 41908566
  - NODE_VERSION: 18
```

### 5.2 Build Script Updates
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest"
  }
}
```

### 5.3 Environment Variables

#### Frontend Environment Variables

**Recommended approach for collaborative development:**

```env
# .env (committed to git - provides template for contributors)
VITE_DEMO_MODE=false
VITE_RTIRL_USER_ID=
```

```env
# .env.local (gitignored - personal values, each developer creates their own)
VITE_RTIRL_USER_ID=41908566
VITE_DEMO_MODE=false
```

This approach allows contributors to:
1. See what environment variables are needed (from committed `.env`)
2. Create their own `.env.local` with their personal RTIRL user ID
3. Override any defaults as needed for their development environment

#### Backend Environment Variables (Cloudflare Functions)
The existing `functions/weather.js` requires the OpenWeatherMap API key. This configuration remains unchanged during migration:

```env
# .dev.vars (for local Cloudflare Functions development)
OWM_API_KEY=your_openweathermap_api_key_here
```

**Important**: Ensure your `.dev.vars` file exists in the repository root with your OpenWeatherMap API key. This file should be gitignored and contains:
- `OWM_API_KEY`: Your OpenWeatherMap One Call API 3.0 key

#### Production Secrets Configuration
In Cloudflare Pages dashboard, ensure the following environment variable is configured:
- **Variable name**: `OWM_API_KEY`
- **Value**: Your production OpenWeatherMap API key
- **Scope**: Production and Preview deployments

## Step 6: Testing Strategy

### 6.1 Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### 6.2 Component Tests
```typescript
// src/components/core/__tests__/ProgressBar.test.tsx
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../ProgressBar'

describe('ProgressBar', () => {
  it('displays correct percentage', () => {
    render(
      <ProgressBar 
        percentage={50} 
        totalDistance={100}
        traveledDistance={50}
        currentMode="CYCLING"
      />
    )
    
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })
})
```

### 6.3 Hook Tests
```typescript
// src/hooks/__tests__/useTripProgress.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTripProgress } from '../useTripProgress'

describe('useTripProgress', () => {
  it('calculates progress percentage correctly', () => {
    const { result } = renderHook(() => useTripProgress())
    
    expect(result.current.progressPercent).toBe(0)
    
    act(() => {
      result.current.updateDistance(50)
    })
    
    expect(result.current.progressPercent).toBeCloseTo(13.48) // 50/371 * 100
  })
})
```

### 6.4 Integration Tests
```typescript
// src/__tests__/trip-overlay.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { TripOverlay } from '../TripOverlay'

describe('Trip Overlay Integration', () => {
  it('loads and displays trip progress', async () => {
    render(<TripOverlay />)
    
    await waitFor(() => {
      expect(screen.getByText(/traveled/i)).toBeInTheDocument()
      expect(screen.getByText(/remaining/i)).toBeInTheDocument()
    })
  })
})
```

### 6.5 Weather API Testing
Since the weather functionality depends on the OpenWeatherMap API key and Cloudflare Functions:

```typescript
// src/__tests__/weather-api.integration.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useWeatherData } from '../hooks/useWeatherData'

describe('Weather API Integration', () => {
  it('fetches weather data from Cloudflare function', async () => {
    const { result } = renderHook(() => 
      useWeatherData(48.209, 16.3531) // Vienna coordinates
    )
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeDefined()
    }, { timeout: 10000 })
  })
})
```

**Testing Note**: Weather API tests require:
1. Valid OWM_API_KEY in .dev.vars
2. Cloudflare Functions running locally (`wrangler pages dev`)
3. Network access to OpenWeatherMap API

### 6.6 Weather Function TypeScript Testing
```typescript
// functions/__tests__/weather.test.ts
import { unstable_dev } from 'wrangler';

describe('Weather Function (TypeScript)', () => {
  let worker: any;

  beforeAll(async () => {
    worker = await unstable_dev('functions/weather.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('validates coordinates properly', async () => {
    const resp = await worker.fetch('/weather?lat=invalid&lon=16.3531');
    expect(resp.status).toBe(400);
    
    const body = await resp.json();
    expect(body.error).toContain('Invalid latitude');
  });

  it('requires API key', async () => {
    // Test with missing API key
    const resp = await worker.fetch('/weather?lat=48.209&lon=16.3531');
    expect(resp.status).toBe(500);
  });
});
```

## Step 7: Documentation Updates

### 7.1 Update CLAUDE.md for React/TypeScript

```markdown
# CLAUDE.md

This file provides guidance to Claude when working with code in this repository.

## Project Overview

This is a real-time GPS tracking overlay for live streaming cycling/bike trips built with **React, TypeScript, and Vite**. It connects to RTIRL (Real-Time IRL) API to display progress tracking with animated avatars and weather information. The project is designed for IRL streamers using OBS and cloud platforms like IRLToolkit.

## Development Commands

### Development Workflow

- `pnpm install` - Install all dependencies
- `pnpm run dev` - Start Vite development server with HMR
- `pnpm run build` - Build production bundle
- `pnpm run preview` - Preview production build locally
- `pnpm run test` - Run Vitest test suite
- `pnpm run lint` - Run ESLint on TypeScript/React code
- `pnpm run lint:fix` - Auto-fix ESLint issues

### Local Testing

- `pnpm run dev` - Access overlays at `http://localhost:5173/index-react.html` and `http://localhost:5173/dashboard-react.html`
- Use `?demo=true` URL parameter for testing without RTIRL connection
- `pnpm wrangler pages dev` - Test with Cloudflare Functions locally

## Architecture (React + TypeScript)

### Core Structure

**Two Main Overlays (React Components):**

1. **Trip Progress Overlay** (`src/TripOverlay.tsx`)
   - React component with hooks for GPS tracking
   - Zustand store for state management
   - Custom hooks: `useTripProgress`, `useRtirlSocket`
   - URL parameters and console commands support

2. **Dashboard Overlay** (`src/Dashboard.tsx`)
   - React component for location/weather display
   - React Query for weather API state management
   - Custom hooks: `useWeatherData`, `useTimezone`

### Technology Stack

- **React 18**: Component-based UI with hooks
- **TypeScript**: Full type safety and IntelliSense
- **Vite**: Fast development and optimized builds
- **Zustand**: Lightweight state management
- **React Query**: Server state management for weather API
- **Tailwind CSS + shadcn-ui**: Utility-first styling with component library
- **Vitest**: Fast testing framework

### File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn-ui components
│   ├── core/
│   │   ├── ProgressBar.tsx    # Trip progress visualization
│   │   ├── Avatar.tsx         # Animated movement avatar
│   │   ├── WeatherWidget.tsx  # Weather display component
│   │   ├── LocationDisplay.tsx # GPS location component
│   │   └── ControlPanel.tsx   # Stream controls
│   └── layout/
│       ├── OverlayContainer.tsx
│       └── DashboardContainer.tsx
├── hooks/
│   ├── useRtirlSocket.ts      # RTIRL WebSocket integration
│   ├── useTripProgress.ts     # Trip state management
│   ├── useWeatherData.ts      # Weather API integration
│   ├── useURLParameters.ts    # URL param processing
│   └── useConsoleCommands.ts  # Console API implementation
├── store/
│   ├── tripStore.ts           # Zustand trip state
│   ├── weatherStore.ts        # Weather state
│   └── connectionStore.ts     # RTIRL connection state
├── utils/
│   ├── config.ts              # Centralized configuration
│   ├── gps.ts                 # GPS calculations
│   ├── rtirl.ts               # RTIRL service class
│   └── globalConsoleAPI.ts    # Global console compatibility
├── types/
│   ├── rtirl.ts               # RTIRL API types
│   ├── weather.ts             # OpenWeatherMap types
│   └── trip.ts                # Trip state types
├── TripOverlay.tsx            # Main trip overlay
├── Dashboard.tsx              # Dashboard overlay
├── trip-main.tsx              # Trip overlay entry point
└── dashboard-main.tsx         # Dashboard entry point
```

### State Management

- **Zustand Stores**: Reactive state management for trip progress, settings
- **React Query**: Server state for weather data with automatic caching/refetching
- **localStorage**: Persistence layer for trip data
- **URL Parameters**: Remote control via query strings (essential for Cloud OBS)
- **Console Commands**: Global API for manual control via browser console

## Key Features (React Implementation)

### Console Commands API
```typescript
// All commands available globally for Cloud OBS control
TripOverlay.controls.addDistance(10.5)
TripOverlay.controls.setDistance(100)
TripOverlay.controls.jumpToProgress(50)
TripOverlay.controls.resetTripProgress()
TripOverlay.controls.exportTripData()
TripOverlay.getStatus()
```

### URL Parameters
```
?demo=true              # Demo mode without RTIRL
?addDistance=10.5       # Add distance on load
?setDistance=100        # Set total distance
?jumpTo=50             # Jump to 50% progress
?reset=today           # Reset today's distance
?units=miles           # Switch to imperial units
?stream=true           # Enable stream mode
?controls=true         # Show control panel
```

### Type Safety

All external APIs are fully typed:

```typescript
// RTIRL API
interface LocationUpdate {
  latitude: number
  longitude: number
  accuracy: number
  speed: number
  timestamp: number
  source: 'rtirl' | 'demo'
}

// OpenWeatherMap API
interface WeatherResponse {
  current: CurrentWeather
  daily: DailyWeather[]
  hourly: HourlyWeather[]
}

// Trip State
interface TripState {
  totalDistance: number
  traveledDistance: number
  todayDistance: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
  useImperialUnits: boolean
}
```

## Development Guidelines

### Component Development
- Use TypeScript interfaces for all props
- Implement proper error boundaries
- Follow React hooks best practices
- Use Tailwind for styling with shadcn-ui components

### State Management
- Use Zustand for client state (trip progress, settings)
- Use React Query for server state (weather, geocoding)
- Implement proper loading/error states
- Maintain localStorage persistence

### Testing Strategy
- Unit tests for custom hooks with `@testing-library/react-hooks`
- Component tests with `@testing-library/react`
- Integration tests for RTIRL and weather APIs
- E2E tests for console commands and URL parameters

### Performance Considerations
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks
- Debounce frequent updates (GPS, UI)
- Lazy load heavy components

## Cloud OBS Integration

### Critical for Streaming
- **Console Commands**: Must work globally via `window.TripOverlay`
- **URL Parameters**: Primary control method for cloud environments
- **Error Recovery**: Graceful handling of network issues
- **Performance**: Smooth animations and minimal resource usage

### Deployment
- **Cloudflare Pages**: Automatic builds from git pushes
- **Vite Build**: Optimized production bundles
- **Environment Variables**: Secure API key management
- **Branch Deployments**: Preview branches for testing

## Claude-Specific Guidelines

- **TypeScript First**: Always provide proper types and interfaces
- **React Hooks**: Use modern React patterns with hooks
- **Component Composition**: Break complex UI into reusable components
- **Error Handling**: Implement comprehensive error boundaries and recovery
- **Performance**: Consider React performance best practices
- **Testing**: Write tests for critical functionality
- **Documentation**: Update TypeScript interfaces and JSDoc comments
- **Backward Compatibility**: Maintain console API compatibility for streaming workflows
```

### 7.2 Update GEMINI.md for React/TypeScript

```markdown
# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is a real-time GPS tracking overlay for live streaming cycling/bike trips built with **React, TypeScript, and Vite**. It connects to RTIRL (Real-Time IRL) API to display progress tracking with animated avatars and weather information. The project is designed for IRL streamers using OBS and cloud platforms like IRLToolkit.

## Development Commands

### React Development Workflow

- `pnpm install` - Install all dependencies including React, TypeScript, Vite
- `pnpm run dev` - Start Vite development server (http://localhost:5173)
- `pnpm run build` - Build production bundle with TypeScript compilation
- `pnpm run preview` - Preview production build
- `pnpm run test` - Run Vitest test suite
- `pnpm run lint` - ESLint for TypeScript/React code

### Testing

- Access overlays during development: 
  - Trip overlay: `http://localhost:5173/index-react.html`
  - Dashboard: `http://localhost:5173/dashboard-react.html`
- Use `?demo=true` for testing without RTIRL connection
- `pnpm wrangler pages dev` for local Cloudflare Functions testing

## Architecture (Modern React Stack)

### Technology Stack

- **React 18**: Component-based UI with modern hooks
- **TypeScript**: Full type safety and developer experience
- **Vite**: Lightning-fast development and optimized builds
- **Zustand**: Lightweight, intuitive state management
- **React Query**: Powerful server state management
- **Tailwind CSS**: Utility-first styling framework
- **shadcn-ui**: High-quality, customizable React components
- **Vitest**: Fast, Vite-native testing framework

### Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn-ui base components
│   ├── core/            # Application-specific components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── store/               # Zustand state stores
├── utils/               # Utility functions (TypeScript)
├── types/               # TypeScript type definitions
├── TripOverlay.tsx      # Main overlay component
├── Dashboard.tsx        # Dashboard component
├── trip-main.tsx        # Trip overlay entry point
└── dashboard-main.tsx   # Dashboard entry point
```

### State Management Architecture

**Zustand Stores:**
- `tripStore.ts`: Trip progress, distance tracking, movement modes
- `weatherStore.ts`: Weather data, location caching
- `connectionStore.ts`: RTIRL connection state

**React Query:**
- Weather API caching and synchronization
- Automatic refetching and error recovery
- Optimistic updates for better UX

### Key Components

**Trip Progress Components:**
- `ProgressBar.tsx`: Animated progress visualization
- `Avatar.tsx`: Movement-based avatar animation
- `ControlPanel.tsx`: Stream controls for manual adjustment

**Dashboard Components:**
- `WeatherWidget.tsx`: Real-time weather display
- `LocationDisplay.tsx`: GPS coordinates and location names
- `SpeedDisplay.tsx`: Current speed in multiple units

### Custom Hooks

**Core Functionality:**
- `useRtirlSocket.ts`: RTIRL WebSocket management
- `useTripProgress.ts`: Trip state and persistence
- `useWeatherData.ts`: Weather API integration
- `useURLParameters.ts`: URL parameter processing
- `useConsoleCommands.ts`: Console API implementation

## Critical Features for Streaming

### Console Commands (Global API)
```typescript
// Essential for Cloud OBS control
TripOverlay.controls.addDistance(km)
TripOverlay.controls.setDistance(km)
TripOverlay.controls.jumpToProgress(percent)
TripOverlay.controls.resetTripProgress()
TripOverlay.controls.resetTodayDistance()
TripOverlay.controls.exportTripData()
TripOverlay.getStatus()
```

### URL Parameters (Cloud Control)
```
?demo=true              # Enable demo mode
?addDistance=10.5       # Add distance on load
?reset=today           # Reset daily progress
?units=miles           # Switch to imperial
?stream=true           # Enable stream mode
?controls=true         # Show control panel
?jumpTo=50             # Jump to 50% completion
```

### TypeScript Benefits

**Type Safety:**
- Compile-time error detection
- IntelliSense for better development experience
- Safer refactoring and code maintenance
- Clear API contracts for external services

**Interfaces:**
```typescript
interface TripState {
  totalDistance: number
  traveledDistance: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
}

interface WeatherData {
  temp: number
  description: string
  icon: string
  humidity: number
}
```

## Gemini Development Guidelines

### Code Quality
- **TypeScript First**: Always provide proper types and interfaces
- **React Best Practices**: Use hooks, avoid class components, implement proper cleanup
- **Component Design**: Keep components focused and reusable
- **State Management**: Use Zustand for client state, React Query for server state
- **Error Handling**: Implement error boundaries and graceful degradation

### Testing Approach
- **Unit Tests**: Test custom hooks and utility functions
- **Component Tests**: Test component behavior and user interactions
- **Integration Tests**: Test RTIRL integration and weather API calls
- **E2E Tests**: Verify console commands and URL parameters work correctly

### Performance Considerations
- **React.memo**: Memoize expensive components
- **useCallback/useMemo**: Optimize hook dependencies
- **Code Splitting**: Lazy load heavy components
- **Bundle Optimization**: Leverage Vite's build optimizations

### Streaming Compatibility
- **Backward Compatibility**: Maintain existing console API for streaming workflows
- **URL Parameter Support**: Essential for cloud OBS environments
- **Error Recovery**: Handle network failures gracefully
- **Resource Efficiency**: Minimize CPU/memory usage for smooth streaming

### Development Workflow
- **Hot Module Replacement**: Vite provides instant feedback during development
- **TypeScript Integration**: Real-time type checking and error reporting
- **Modern Tooling**: ESLint, Prettier, and Vitest integration
- **Component Library**: Use shadcn-ui for consistent, accessible UI components

## Environment Setup

### Required Files
- `.env`: Committed template with safe defaults
- `.env.local`: Personal environment variables (gitignored)
- `.dev.vars`: Cloudflare Functions API keys (gitignored)

### Environment Variables
```env
# Frontend (Vite)
VITE_RTIRL_USER_ID=your_user_id
VITE_DEMO_MODE=false

# Backend (Cloudflare Functions)
OWM_API_KEY=your_openweather_api_key
```

This React + TypeScript implementation maintains full compatibility with existing streaming workflows while providing modern development experience, type safety, and better maintainability.
```

### 7.3 Create .cursor/rules

```
# .cursor/rules

# Trip Overlay React + TypeScript Development Rules

## Project Context
This is a React + TypeScript + Vite project for real-time GPS tracking overlays used in live streaming. The project migrated from vanilla JavaScript and must maintain backward compatibility with existing console commands and URL parameters for Cloud OBS integration.

## Technology Stack
- React 18 with hooks
- TypeScript with strict mode
- Vite for development and builds
- Zustand for state management
- React Query for server state
- Tailwind CSS + shadcn-ui for styling
- Vitest for testing

## Code Style Guidelines

### TypeScript
- Use strict TypeScript configuration
- Always provide explicit types for props, state, and function parameters
- Use interfaces over types for object shapes
- Export types alongside implementations
- Prefer type-safe event handlers

Example:
```typescript
interface ProgressBarProps {
  percentage: number
  totalDistance: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
}

export function ProgressBar({ percentage, totalDistance, currentMode }: ProgressBarProps) {
  // Implementation
}
```

### React Components
- Use functional components with hooks exclusively
- Implement proper cleanup in useEffect hooks
- Use React.memo for performance-critical components
- Follow the component file naming convention: PascalCase.tsx
- Keep components focused and single-responsibility

### State Management
- Use Zustand stores for client state (trip progress, settings)
- Use React Query for server state (weather data, API calls)
- Implement proper error handling and loading states
- Maintain localStorage persistence for trip data

### Custom Hooks
- Prefix custom hooks with 'use'
- Return objects instead of arrays when returning multiple values
- Handle cleanup and error states properly
- Document complex hook behavior with JSDoc

Example:
```typescript
/**
 * Manages trip progress state with localStorage persistence
 */
export function useTripProgress() {
  const store = useTripStore()
  // Implementation with proper cleanup
}
```

### Console Commands Compatibility
- Maintain global window.TripOverlay API for streaming compatibility
- Implement all existing console commands with TypeScript safety
- Provide proper error handling and validation
- Log actions to console for debugging

### URL Parameters
- Process URL parameters on component mount
- Validate all parameter values before applying
- Support all existing parameters for Cloud OBS compatibility
- Handle malformed parameters gracefully

### Error Handling
- Use React Error Boundaries for component error recovery
- Implement try-catch for async operations
- Provide fallback UI states for network failures
- Log errors appropriately without overwhelming console

### Performance
- Use useCallback for event handlers passed to child components
- Use useMemo for expensive calculations
- Implement proper dependency arrays in useEffect
- Avoid creating objects/functions in render methods

### Testing
- Write unit tests for custom hooks using @testing-library/react-hooks
- Test component interactions with @testing-library/react
- Mock external APIs (RTIRL, OpenWeatherMap) in tests
- Test console commands and URL parameter functionality

### File Organization
- Components: src/components/[category]/ComponentName.tsx
- Hooks: src/hooks/useHookName.ts
- Stores: src/store/storeNameStore.ts
- Types: src/types/categoryName.ts
- Utils: src/utils/utilityName.ts

### Import Organization
```typescript
// External libraries first
import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// Internal imports grouped by category
import { useTripStore } from '@/store/tripStore'
import { ProgressBar } from '@/components/core/ProgressBar'
import { validateCoordinates } from '@/utils/gps'
import type { LocationUpdate } from '@/types/rtirl'
```

### Styling Guidelines
- Use Tailwind CSS utility classes primarily
- Use shadcn-ui components for consistent design
- Maintain OBS transparency compatibility (rgba backgrounds)
- Follow responsive design principles
- Preserve existing visual design and animations

### API Integration
- Type all external API responses (RTIRL, OpenWeatherMap)
- Handle network errors gracefully
- Implement proper loading states
- Use React Query for caching and synchronization
- Maintain existing weather proxy function

### Environment Configuration
- Use VITE_ prefix for frontend environment variables
- Keep sensitive data in .env.local (gitignored)
- Document required environment variables
- Provide safe defaults in committed .env file

### Documentation
- Update JSDoc comments for complex functions
- Maintain README with setup instructions
- Keep CLAUDE.md and GEMINI.md updated with React changes
- Document breaking changes and migration notes

## Streaming Compatibility Requirements
- Maintain all existing console commands
- Support all URL parameters for Cloud OBS
- Preserve visual design and animations
- Ensure smooth performance for streaming
- Handle network interruptions gracefully
- Maintain backward compatibility with existing OBS setups

## Common Patterns

### Store Updates with Persistence
```typescript
const updateTripDistance = useCallback((distance: number) => {
  tripStore.setDistance(distance)
  // Trigger localStorage save
  saveToLocalStorage()
}, [])
```

### Error Boundary Implementation
```typescript
class TripOverlayErrorBoundary extends React.Component {
  // Implement proper error recovery for streaming
}
```

### Weather Data Hook
```typescript
export function useWeatherData(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetchWeather(lat!, lon!),
    enabled: Boolean(lat && lon),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

Remember: This project is used in live streaming environments where reliability and backward compatibility are critical. Always test console commands and URL parameters thoroughly.
```

### 7.4 Update API.md for React Implementation

```markdown
# API Documentation - React + TypeScript Implementation

## Console Commands API

### Global Access
```typescript
// Available globally for Cloud OBS browser console access
window.TripOverlay.controls.addDistance(km)
window.TripOverlay.controls.setDistance(km)
window.TripOverlay.controls.jumpToProgress(percent)
window.TripOverlay.controls.resetTripProgress()
window.TripOverlay.controls.resetTodayDistance()
window.TripOverlay.controls.exportTripData()
window.TripOverlay.getStatus()
window.showConsoleCommands()
```

### TypeScript Interfaces
```typescript
interface TripControls {
  addDistance: (km: number) => string
  setDistance: (km: number) => string
  jumpToProgress: (percent: number) => string
  setTotalDistance: (km: number) => string
  convertToMiles: () => string
  convertToKilometers: () => string
  resetTripProgress: () => string
  resetTodayDistance: () => string
  exportTripData: () => string
  importTripData: (jsonString: string) => string
}

interface TripStatus {
  traveledDistance: number
  todayDistance: number
  totalDistance: number
  progressPercent: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
  useImperialUnits: boolean
  isConnected: boolean
  lastPosition: { lat: number, lon: number } | null
}
```

## React Hooks API

### useTripProgress
```typescript
export function useTripProgress(): {
  totalDistance: number
  traveledDistance: number
  todayDistance: number
  progressPercent: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
  useImperialUnits: boolean
  updateDistance: (distance: number) => void
  resetTrip: () => void
  resetToday: () => void
  saveProgress: () => void
}
```

### useRtirlSocket
```typescript
export function useRtirlSocket(): {
  isConnected: boolean
  lastPosition: { lat: number, lon: number } | null
  isDemo: boolean
}
```

### useWeatherData
```typescript
export function useWeatherData(lat?: number, lon?: number): {
  data: WeatherResponse | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}
```

### useURLParameters
```typescript
// Automatically processes URL parameters on mount
export function useURLParameters(): null
```

### useConsoleCommands
```typescript
export function useConsoleCommands(): TripControls
```

## URL Parameters (React Implementation)

All existing URL parameters are supported with enhanced TypeScript validation:

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `demo` | boolean | true/false | Enable demo mode |
| `addDistance` | number | -10000 to 10000 | Add/subtract distance (km) |
| `setDistance` | number | 0 to 50000 | Set total distance (km) |
| `jumpTo` | number | 0 to 100 | Jump to progress percentage |
| `reset` | string | trip/today/location | Reset specific data |
| `resets` | string | comma-separated | Reset multiple items |
| `units` | string | miles/km | Set distance units |
| `controls` | boolean | true/false | Show control panel |
| `stream` | boolean | true/false | Enable stream mode |
| `export` | boolean | true/false | Download backup on load |
| `import` | string | JSON string | Import trip data |
| `totalDistance` | number | 0 to 50000 | Set trip total distance |
| `setTodayDistance` | number | 0 to 1000 | Set today's distance |
| `setTotalTraveled` | number | 0 to 50000 | Set total traveled |

## Component Props API

### ProgressBar
```typescript
interface ProgressBarProps {
  percentage: number
  totalDistance: number
  traveledDistance: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
}
```

### WeatherWidget
```typescript
interface WeatherWidgetProps {
  weather: WeatherData | null
  location: string
  isLoading: boolean
}
```

### Avatar
```typescript
interface AvatarProps {
  mode: 'STATIONARY' | 'WALKING' | 'CYCLING'
  position: number
  className?: string
  style?: React.CSSProperties
}
```

## Store API (Zustand)

### Trip Store
```typescript
interface TripState {
  // State
  totalDistance: number
  traveledDistance: number
  todayDistance: number
  currentMode: 'STATIONARY' | 'WALKING' | 'CYCLING'
  useImperialUnits: boolean
  
  // Actions
  updateDistance: (distance: number) => void
  setMode: (mode: MovementMode) => void
  resetTrip: () => void
  resetToday: () => void
  toggleUnits: () => void
  addDistance: (km: number) => void
  setDistance: (km: number) => void
  jumpToProgress: (percent: number) => void
  setTotalDistance: (km: number) => void
  setTodayDistance: (km: number) => void
  setTotalTraveled: (km: number) => void
  convertToMiles: () => void
  convertToKilometers: () => void
}
```

## Weather Function API (TypeScript)

### Request Interface
```typescript
interface WeatherRequest {
  lat: string    // -90 to 90
  lon: string    // -180 to 180
  units?: 'metric' | 'imperial' | 'standard'
}
```

### Response Interface
```typescript
interface WeatherResponse {
  current: {
    temp: number
    feels_like: number
    humidity: number
    uvi: number
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
    wind_speed: number
    wind_deg: number
  }
  daily: Array<{
    temp: { min: number, max: number }
  }>
  hourly: Array<{
    dt: number
    temp: number
    weather: Array<{ icon: string, description: string }>
  }>
}
```

### Error Response
```typescript
interface WeatherError {
  error: string
  message?: string
  status?: number
  statusText?: string
}
```

## Migration Notes

- All vanilla JavaScript APIs are preserved for backward compatibility
- TypeScript provides compile-time safety and better IntelliSense
- React hooks offer cleaner state management than manual DOM manipulation
- Console commands maintain identical signatures for streaming workflows
- URL parameters have enhanced validation but identical behavior
- Weather function gains coordinate validation and better error handling
```

### 7.5 Update README.md Development Section

Add a new section to README.md for React development:

```markdown
## Development (React + TypeScript)

### Quick Start
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Access overlays
# Trip overlay: http://localhost:5173/index-react.html
# Dashboard: http://localhost:5173/dashboard-react.html
```

### Available Scripts
```bash
pnpm run dev          # Start Vite dev server with HMR
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run test         # Run Vitest test suite
pnpm run lint         # ESLint TypeScript/React code
pnpm run lint:fix     # Auto-fix ESLint issues
```

### Environment Setup
```bash
# Copy environment template
cp .env .env.local

# Edit with your values
VITE_RTIRL_USER_ID=your_user_id
VITE_DEMO_MODE=false

# Add weather API key
echo "OWM_API_KEY=your_api_key" > .dev.vars
```

### Technology Stack
- **React 18**: Component-based UI with hooks
- **TypeScript**: Type safety and better DX  
- **Vite**: Fast development and optimized builds
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **Tailwind + shadcn-ui**: Modern styling system
- **Vitest**: Fast testing framework

### Console Commands (Developer Tools)
```javascript
// For debugging and manual control via browser console
TripOverlay.controls.addDistance(10.5)
TripOverlay.controls.setDistance(100)
TripOverlay.getStatus()
showConsoleCommands()
```

### URL Parameters (Cloud OBS Remote Control)
```
?demo=true&addDistance=50&units=miles
?reset=today&stream=true
?jumpTo=75&controls=true
```
**Critical**: URL parameters are the ONLY way to control overlay in Cloud OBS environments.

### Backward Compatibility
- All console commands preserved
- All URL parameters supported  
- Visual design maintained
- OBS browser source compatible
- Performance optimized for streaming
```

### 7.6 Update CONTRIBUTING.md for React Development

Add React-specific contribution guidelines:

```markdown
## React + TypeScript Development

### Development Setup
1. Install dependencies: `pnpm install`
2. Copy `.env` to `.env.local` and configure
3. Add `OWM_API_KEY` to `.dev.vars`
4. Start development: `pnpm run dev`

### Code Style
- Use TypeScript interfaces for all props and state
- Follow React hooks best practices
- Use Zustand for client state, React Query for server state
- Maintain console command compatibility
- Test URL parameters thoroughly

### Component Guidelines
- Use functional components with hooks exclusively
- Implement proper TypeScript typing
- Use Tailwind CSS for styling
- Include shadcn-ui components where appropriate
- Maintain OBS transparency compatibility

### Testing Requirements
- Write unit tests for custom hooks
- Test component interactions
- Verify console commands work globally
- Test all URL parameters
- Mock external APIs (RTIRL, weather)

### Streaming Compatibility
- Console commands available for developer debugging via `window.TripOverlay`
- **URL parameters must maintain existing behavior - CRITICAL for Cloud OBS**
- Performance must be optimized for live streaming
- Visual design must preserve OBS compatibility
```

## 8. Risk Assessment & Mitigation

### High Risk Areas
1. **Console Commands Compatibility**: Important for developer debugging and manual control
   - **Mitigation**: Early implementation, testing in browser console
   - **Rollback**: Preserve vanilla JS files during migration

2. **URL Parameter Processing**: **CRITICAL** - The only way to remotely control overlay in Cloud OBS
   - **Mitigation**: Comprehensive test suite covering all parameters, extensive Cloud OBS testing
   - **Rollback**: Maintain existing parameter handling logic

3. **Performance Regression**: Overlay must not impact stream quality
   - **Mitigation**: Bundle analysis, lazy loading, performance monitoring
   - **Rollback**: React build optimization, potential SSG approach

4. **Cloudflare Pages Build Integration**: Zero-downtime deployment
   - **Mitigation**: Branch-based testing, staging environment
   - **Rollback**: Keep vanilla JS files as fallback

### Medium Risk Areas
1. **TypeScript Learning Curve**: For contributors not familiar with TS
   - **Mitigation**: Comprehensive documentation, clear examples
   - **Fallback**: Gradual migration allowing .js files initially

2. **External Dependencies**: React, Vite, new packages
   - **Mitigation**: Pin dependency versions, regular security audits
   - **Fallback**: Minimal dependency approach, vendor critical packages

### Low Risk Areas
1. **Styling Migration**: Tailwind/shadcn-ui adoption
   - **Mitigation**: CSS-in-JS fallback options, gradual migration
2. **Testing Infrastructure**: Vitest setup
   - **Mitigation**: Start with basic tests, expand coverage gradually

## 9. Success Metrics & Validation

### Technical Metrics
- [ ] All 15+ URL parameters work identically
- [ ] 10+ console commands preserve exact behavior
- [ ] Build time under 30 seconds
- [ ] Bundle size under 500KB (gzipped)
- [ ] TypeScript coverage > 95%
- [ ] Test coverage > 80%

### Streaming Compatibility
- [ ] OBS browser source loads without issues
- [ ] IRLToolkit integration maintained
- [ ] **Cloud OBS URL parameter control functions perfectly**
- [ ] No visual regressions in overlay design
- [ ] Frame rate maintained during active streaming

### Developer Experience
- [ ] Hot reload works reliably
- [ ] TypeScript IntelliSense functions
- [ ] Linting catches common errors
- [ ] Build process is reliable
- [ ] Documentation is comprehensive

### Performance Benchmarks
- [ ] Initial load time < 2 seconds
- [ ] Memory usage < 50MB after 1 hour streaming
- [ ] No memory leaks during extended use
- [ ] WebSocket reconnection works reliably
- [ ] State persistence across browser refresh

## 10. Post-Migration Cleanup

### Phase 1: Validation (Days 1-7)
- Monitor streaming sessions for issues
- Collect user feedback from streamers
- Performance monitoring and optimization
- Bug fixes and minor adjustments

### Phase 2: Legacy Removal (Days 8-14)
- Remove vanilla JavaScript files once stability confirmed
- Clean up unused CSS files
- Remove old build artifacts
- Update deployment configuration

### Phase 3: Enhancement (Days 15-30)
- Add new features leveraging React architecture
- Improve TypeScript coverage
- Expand test suite
- Performance optimizations

### Documentation Maintenance
- Update all README instructions
- Revise setup guides for new contributors
- Create video tutorials for OBS integration
- Maintain API compatibility documentation

## 11. Emergency Rollback Plan

### Immediate Rollback (< 5 minutes)
1. **Cloudflare Pages**: Switch branch from `react-migration` back to `main`
2. **DNS**: Verify main branch serves vanilla JS files
3. **Verification**: Test console commands and URL parameters
4. **Communication**: Notify active streamers of temporary reversion

### Investigation Protocol
1. **Log Collection**: Gather browser console errors, Cloudflare logs
2. **Issue Triage**: Categorize as blocking, critical, or minor
3. **Fix Strategy**: Determine if hotfix possible or full rollback needed
4. **Timeline**: Establish maximum downtime tolerance (< 30 minutes)

### Prevention Measures
- **Staging Environment**: Full testing before production deployment
- **Gradual Rollout**: Use Cloudflare's traffic splitting for gradual release
- **Monitoring**: Real-time alerts for console errors or API failures
- **Documentation**: Maintain comprehensive troubleshooting guide

---

## Summary

This migration plan transforms the trip-overlay project from vanilla JavaScript to a modern React + TypeScript + Vite stack while maintaining 100% backward compatibility for streaming workflows. The 9-day timeline balances thorough implementation with rapid delivery, ensuring the project gains modern development benefits without sacrificing its core streaming functionality.

**Key Success Factors:**
- Preserve all console commands and URL parameters exactly
- Maintain OBS browser source compatibility
- Implement comprehensive TypeScript typing
- Provide detailed documentation for contributors
- Establish robust testing and deployment processes

**Critical Dependencies:**
- Cloudflare Pages build configuration
- OpenWeatherMap API key management
- RTIRL WebSocket integration
- OBS/IRLToolkit compatibility testing

The migration positions the project for future growth while respecting its current proven architecture and critical streaming use case.

## Migration Timeline

### Phase 1 (Days 1-2): Setup and Core Components
- Environment setup and tooling configuration
- Create basic component structure
- Implement ProgressBar and Avatar components

### Phase 2 (Days 3-4): State Migration
- Implement Zustand stores
- Create custom hooks for RTIRL and trip progress
- Convert main trip logic

### Phase 3 (Days 5-6): Dashboard and Weather  
- Implement dashboard components
- Convert weather integration
- Add location and time displays
- **Migrate `functions/weather.js` to TypeScript**
- **Implement console commands system**
- **Implement URL parameters handling**

### Phase 4 (Days 7-8): Testing and Polish
- Write comprehensive tests
- Performance optimization
- Cross-browser testing
- **Update documentation (CLAUDE.md, GEMINI.md, API.md)**
- **Create/update .cursor/rules for TypeScript/React development**

### Phase 5 (Day 9): Deployment
- Configure Cloudflare Pages build
- Deploy and test production environment
- Prepare for final cutover

## Final Cutover Strategy

### Option A: Gradual File Replacement (Recommended)
1. **Test thoroughly** on the react-migration branch preview URL
2. **Backup current state**: Create a `vanilla-js-backup` branch from main
3. **Merge react-migration to main** with file replacements:
   ```bash
   git checkout main
   git merge react-migration
   
   # Replace the original files with React versions
   mv index-react.html index.html
   mv dashboard-react.html dashboard.html
   
   # Update package.json build configuration
   # Commit the final changes
   git add -A
   git commit -m "feat: migrate to React + TypeScript + Vite
   
   - Replace vanilla JS with React implementation
   - Maintain all existing functionality 
   - Add TypeScript for better type safety
   - Preserve OBS browser source compatibility"
   ```

4. **Deploy to production**: Cloudflare Pages automatically rebuilds main branch
5. **Test production deployment** with OBS browser sources
6. **Rollback plan**: If issues arise, quickly revert to `vanilla-js-backup` branch

### Option B: URL-Based Migration
If you prefer to maintain both versions temporarily:
1. Keep both versions deployed simultaneously
2. Access React version via `?version=react` URL parameter
3. Gradually migrate OBS browser sources to new URLs
4. Remove vanilla JS version after full validation

### Post-Migration Cleanup
After successful cutover and validation period (1-2 weeks):
```bash
# Remove old vanilla JS files (optional)
git rm -r css/trip-progress.css css/dashboard.css
git rm -r js/trip-progress.js js/dashboard.js
git rm -r js/legacy_script.js

# Keep utils/ for reference during transition period
# Remove later once React utils are fully validated

git commit -m "cleanup: remove legacy vanilla JS files"
```

## Risk Mitigation

1. **Parallel Development**: Keep existing overlay running while building new version
2. **Feature Parity**: Ensure all current functionality is preserved
3. **Gradual Rollout**: Test with single overlay before migrating both
4. **Rollback Plan**: Maintain ability to quickly revert to vanilla JS version
5. **Performance Monitoring**: Compare loading times and runtime performance

## Success Criteria

- [ ] Both overlays render correctly in OBS browser sources
- [ ] All current functionality preserved (RTIRL, weather, persistence)
- [ ] Type safety eliminates runtime errors
- [ ] Component reuse reduces overall code size
- [ ] Development workflow improved with HMR
- [ ] Test coverage >80% for critical paths
- [ ] Performance matches or exceeds current implementation 
