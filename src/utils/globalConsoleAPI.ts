/**
 * Global Console API for Trip Overlay
 * Provides backward compatibility with vanilla JS implementation
 * and maintains console command functionality for streaming
 */

import { useTripProgressStore } from '../store/tripStore';
import { useConnectionStore } from '../store/connectionStore';
import { logger } from '../utils/logger';
import { CONFIG } from '../utils/config';

// Global API interface for TypeScript
declare global {
  interface Window {
    TripOverlay: {
      controls: {
        addDistance: (km: number) => void;
        setDistance: (km: number) => void;
        jumpToProgress: (percentage: number) => void;
        setTotalDistance: (km: number) => void;
        setTodayDistance: (km: number) => void;
        setTotalTraveled: (km: number) => void;
        convertToMiles: () => void;
        convertToKilometers: () => void;
        resetProgress: () => void;
        resetTodayDistance: () => void;
        exportTripData: () => void;
        importTripData: (data?: string) => void;
      };
      getStatus: () => any;
      checkRtirlConnection: () => boolean;
    };
    // Backward compatibility functions
    addDistance: (km: number) => void;
    setDistance: (km: number) => void;
    jumpToProgress: (percentage: number) => void;
    setTotalDistance: (km: number) => void;
    convertToMiles: () => void;
    convertToKilometers: () => void;
    resetTripProgress: () => void;
    resetTodayDistance: () => void;
    exportTripData: () => void;
    importTripData: (data?: string) => void;
    showConsoleCommands: () => void;
    getStatus: () => any;
    checkRtirlConnection: () => boolean;
  }
}

// Flag to ensure global API is only initialized once
let isGlobalAPIInitialized = false;

/**
 * Initialize global console API
 * Called once during app initialization
 * Idempotent - safe to call multiple times
 */
export function setupGlobalConsoleAPI() {
  // Prevent multiple initializations
  if (isGlobalAPIInitialized) {
    return;
  }

  const store = useTripProgressStore.getState();

  // Validation helpers
  const validateNumber = (
    value: any,
    min: number,
    max: number,
    name: string
  ): number | null => {
    const num = parseFloat(value?.toString() || '');
    if (!isFinite(num) || num < min || num > max) {
      logger.warn(`Invalid ${name}: must be ${min}-${max}`);
      return null;
    }
    return num;
  };

  // Core controls object
  const controls = {
    addDistance: (km: number) => {
      const distance = validateNumber(km, -10000, 10000, 'distance');
      if (distance !== null) {
        store.addDistance(distance);
      }
    },

    setDistance: (km: number) => {
      const distance = validateNumber(km, 0, 50000, 'distance');
      if (distance !== null) {
        store.setDistance(distance);
      }
    },

    jumpToProgress: (percentage: number) => {
      const percent = validateNumber(percentage, 0, 100, 'percentage');
      if (percent !== null) {
        store.jumpToProgress(percent);
      }
    },

    setTotalDistance: (km: number) => {
      const distance = validateNumber(km, 1, 50000, 'total distance');
      if (distance !== null) {
        store.setTotalDistance(distance);
      }
    },

    setTodayDistance: (km: number) => {
      const distance = validateNumber(km, 0, 1000, 'today distance');
      if (distance !== null) {
        store.setTodayDistance(distance);
      }
    },

    setTotalTraveled: (km: number) => {
      const distance = validateNumber(km, 0, 50000, 'total traveled');
      if (distance !== null) {
        store.setTotalTraveled(distance);
      }
    },

    convertToMiles: () => {
      store.setUnits('miles');
    },

    convertToKilometers: () => {
      store.setUnits('km');
    },

    resetProgress: () => {
      store.resetProgress();
    },

    resetTodayDistance: () => {
      store.resetTodayDistance();
    },

    exportTripData: () => {
      store.exportTripData();
    },

    importTripData: (data?: string) => {
      if (!data) {
        // Show file picker for manual import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = e => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = event => {
              const content = event.target?.result as string;
              if (content) {
                store.importTripData(content);
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
        return;
      }

      // Direct data import
      try {
        store.importTripData(data);
      } catch (error) {
        logger.error('CONSOLE: Failed to import trip data:', error);
      }
    },
  };

  // Universal status function for debugging (works from any page)
  const getStatus = () => {
    const state = useTripProgressStore.getState();
    const connectionState = useConnectionStore.getState();
    const units = state.units === 'miles' ? 'miles' : 'km';
    const kmToMiles = 0.621371;
    const unitMultiplier = state.units === 'miles' ? kmToMiles : 1;

    // Detect current page
    const currentPage = window.location.pathname.includes('dashboard')
      ? 'Dashboard'
      : 'Trip Overlay';

    // Check RTIRL connection status universally
    const hasRTIRLLib = typeof window.RealtimeIRL !== 'undefined';
    const isDemoMode =
      CONFIG.rtirl.demoMode ||
      new URLSearchParams(window.location.search).get('demo') === 'true';

    // Enhanced RTIRL status
    let rtirlStatus = '❌ Disconnected';
    let connectionDetails = '';

    if (isDemoMode) {
      rtirlStatus = '🎭 Demo Mode Active';
      connectionDetails = 'Simulated GPS data';
    } else if (!hasRTIRLLib) {
      rtirlStatus = '❌ Library Not Loaded';
      connectionDetails = 'Add RTIRL script to HTML';
    } else if (!CONFIG.rtirl.userId) {
      rtirlStatus = '⚠️ User ID Missing';
      connectionDetails = 'Configure VITE_RTIRL_USER_ID';
    } else {
      switch (connectionState.connectionStatus) {
        case 'connected':
          rtirlStatus = '✅ Connected';
          connectionDetails = `Receiving live GPS data (${connectionState.reconnectAttempts} previous failures)`;
          break;
        case 'connecting':
          rtirlStatus = '🔌 Connecting...';
          connectionDetails = 'Attempting to establish connection';
          break;
        case 'disconnected':
          rtirlStatus = '❌ Disconnected';
          connectionDetails = `${connectionState.reconnectAttempts} connection attempts failed`;
          break;
        case 'error':
          rtirlStatus = '💥 Error';
          connectionDetails = `Connection failed (${connectionState.reconnectAttempts} attempts)`;
          break;
        default:
          rtirlStatus = '❓ Unknown Status';
          connectionDetails = 'Status not determined';
      }
    }

    // Last position info
    let positionInfo = 'No position data available';
    if (connectionState.lastPosition) {
      positionInfo = `${connectionState.lastPosition.lat.toFixed(4)}, ${connectionState.lastPosition.lon.toFixed(4)}`;
    }

    const statusReport = `
🔍 UNIVERSAL TRIP OVERLAY STATUS:

📄 Current Page: ${currentPage}
🔗 Available Pages:
   • Trip Overlay: index-react.html (GPS tracking, progress display)
   • Dashboard: dashboard-react.html (time, weather, location info)

🔑 Configuration:
   Mode: 🏍️ Vehicle (cycling/motorbike mode)
   Target Distance: ${(state.totalDistanceKm * unitMultiplier).toFixed(1)} ${units}
   Units: ${units}
   Demo Mode: ${isDemoMode ? '✅ Active' : '❌ Disabled'}

🌐 RTIRL Connection:
   Status: ${rtirlStatus}
   Details: ${connectionDetails}
   Last Position: ${positionInfo}
   User ID: ${CONFIG.rtirl.userId || 'Not Set'}
   Library Loaded: ${hasRTIRLLib ? 'Yes' : 'No'}
   Demo Available: Add ?demo=true to URL for testing

📊 Trip Progress:
   Current Distance: ${(state.currentDistanceKm * unitMultiplier).toFixed(2)} ${units}
   Today's Distance: ${(state.todayDistanceKm * unitMultiplier).toFixed(2)} ${units}
   Total Traveled: ${(state.totalTraveledKm * unitMultiplier).toFixed(2)} ${units}
   Remaining: ${(Math.max(0, state.totalDistanceKm - state.currentDistanceKm) * unitMultiplier).toFixed(2)} ${units}
   Progress: ${state.totalDistanceKm > 0 ? ((state.currentDistanceKm / state.totalDistanceKm) * 100).toFixed(1) : '0.0'}%

⚙️ Current State:
   Units: ${units}
   Moving: ${state.isMoving ? '✅ Yes' : '❌ No'}
   Current Speed: ${state.currentSpeed.toFixed(1)} km/h

🛠️ System Info:
   Store: ✅ Zustand (shared across both pages)
   Persistence: ✅ localStorage (auto-save enabled)
   React Version: Modern React + TypeScript + Vite
   Page Type: ${currentPage}
   
💡 Available Commands: Type showConsoleCommands() for full command list
🎮 Quick Test: Try addDistance(5) to add 5km to your trip
    `;

    logger(statusReport);

    // Return comprehensive data object for programmatic access
    return {
      currentPage,
      rtirl: {
        libraryLoaded: hasRTIRLLib,
        userId: CONFIG.rtirl.userId,
        demoMode: isDemoMode,
      },
      trip: {
        totalDistanceKm: state.totalDistanceKm,
        currentDistanceKm: state.currentDistanceKm,
        todayDistanceKm: state.todayDistanceKm,
        totalTraveledKm: state.totalTraveledKm,
        progress:
          state.totalDistanceKm > 0
            ? (state.currentDistanceKm / state.totalDistanceKm) * 100
            : 0,
      },
      settings: {
        units: state.units,
        isMoving: state.isMoving,
        currentSpeed: state.currentSpeed,
      },
      system: {
        version: 'React + TypeScript',
        store: 'Zustand',
        persistence: 'localStorage',
      },
    };
  };

  // Dedicated RTIRL connection checker
  const checkRtirlConnection = () => {
    const connectionState = useConnectionStore.getState();
    const hasRTIRLLib = typeof window.RealtimeIRL !== 'undefined';
    const isDemoMode =
      CONFIG.rtirl.demoMode ||
      new URLSearchParams(window.location.search).get('demo') === 'true';

    let status = '';
    let connected = false;

    if (isDemoMode) {
      status = '🎭 RTIRL Status: Demo Mode Active - Using simulated GPS data';
      connected = true;
    } else if (!hasRTIRLLib) {
      status =
        '❌ RTIRL Status: Library Not Loaded\n💡 Add this to your HTML: <script src="https://cdn.jsdelivr.net/npm/@rtirl/api@latest/lib/index.min.js"></script>';
    } else if (!CONFIG.rtirl.userId) {
      status =
        '⚠️ RTIRL Status: User ID not configured\n💡 Set VITE_RTIRL_USER_ID in your .env.local file';
    } else {
      connected = connectionState.isConnected;
      switch (connectionState.connectionStatus) {
        case 'connected':
          status = `✅ RTIRL Status: Connected to user ${CONFIG.rtirl.userId}\n📡 Receiving live GPS data (${connectionState.reconnectAttempts} previous connection issues)`;
          if (connectionState.lastPosition) {
            status += `\n📍 Current Position: ${connectionState.lastPosition.lat.toFixed(4)}, ${connectionState.lastPosition.lon.toFixed(4)}`;
          }
          break;
        case 'connecting':
          status = '🔌 RTIRL Status: Attempting to connect...';
          break;
        case 'disconnected':
          status = `❌ RTIRL Status: Disconnected (${connectionState.reconnectAttempts} connection attempts)`;
          if (connectionState.reconnectAttempts > 0) {
            status +=
              '\n💡 Streamer may be offline or location sharing disabled';
          }
          break;
        case 'error':
          status = `💥 RTIRL Status: Connection Error (${connectionState.reconnectAttempts} failed attempts)`;
          status += '\n💡 Check network connection and RTIRL service status';
          break;
        default:
          status = '❓ RTIRL Status: Unknown connection state';
      }
    }

    console.log(status);
    return connected;
  };

  // Help system matching original showConsoleCommands pattern
  const showConsoleCommands = () => {
    const help = `
🎮 TRIP OVERLAY CONSOLE COMMANDS:

🔍 DEBUGGING:
• getStatus() - Show complete system status and diagnostics
• checkRtirlConnection() - Check RTIRL GPS connection status specifically
• TripOverlay.getStatus() - Same as getStatus() (namespaced version)
• showConsoleCommands() - Show this help

📏 DISTANCE MANIPULATION:
• addDistance(km) - Add/subtract distance (use negative to subtract)
  Example: addDistance(5.5) or addDistance(-2.1)

• setDistance(km) - Set total distance to specific value
  Example: setDistance(100.5)

• jumpToProgress(percent) - Jump to specific percentage (0-100)
  Example: jumpToProgress(75)

🌍 UNIT CONVERSION:
• convertToMiles() - Switch display to miles
• convertToKilometers() - Switch display to kilometers

⚙️ TRIP SETTINGS:
• setTotalDistance(km) - Change the total trip distance target
  Example: setTotalDistance(500)

🔄 RESET FUNCTIONS:
• resetTripProgress() - Start completely fresh
• resetTodayDistance() - Reset today's distance only

💾 DATA MANAGEMENT:
• exportTripData() - Download backup file
• importTripData(jsonString) - Import backup manually

Type any function name to use it. Current trip: ${useTripProgressStore.getState().currentDistanceKm.toFixed(2)}/${useTripProgressStore.getState().totalDistanceKm}km
    `;
    logger(help);
  };

  // Set up global API
  window.TripOverlay = { controls, getStatus, checkRtirlConnection };

  // Backward compatibility - individual functions
  window.addDistance = controls.addDistance;
  window.setDistance = controls.setDistance;
  window.jumpToProgress = controls.jumpToProgress;
  window.setTotalDistance = controls.setTotalDistance;
  window.convertToMiles = controls.convertToMiles;
  window.convertToKilometers = controls.convertToKilometers;
  window.resetTripProgress = controls.resetProgress;
  window.resetTodayDistance = controls.resetTodayDistance;
  window.exportTripData = controls.exportTripData;
  window.importTripData = controls.importTripData;
  window.showConsoleCommands = showConsoleCommands;
  window.getStatus = getStatus;
  window.checkRtirlConnection = checkRtirlConnection;

  // Mark as initialized
  isGlobalAPIInitialized = true;

  // Initialize notification
  logger(
    '🎮 Trip Overlay Console API initialized. Type showConsoleCommands() for help.'
  );
}
