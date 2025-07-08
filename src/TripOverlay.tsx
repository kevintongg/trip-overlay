import React from 'react';
import { useTripProgress } from './hooks/useTripProgress';
import { useRtirlSocket } from './hooks/useRtirlSocket';
import { useConsoleCommands } from './hooks/useConsoleCommands';
import { useURLParameters } from './hooks/useURLParameters';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useGPSProcessor } from './hooks/useGPSProcessor';
import { useTripProgressStore } from './store/tripStore';

/**
 * Trip Overlay Component - Clean minimalist design for streaming
 * Matches original vanilla JS design but with React + Tailwind
 * Optimized for 1080p streaming with clean typography and minimal footprint
 */
const TripOverlay: React.FC = () => {
  const {
    traveledDistance,
    todayDistance,
    remainingDistance,
    progressPercent,
    getUnitLabel,
    resetTrip,
    resetToday,
  } = useTripProgress();

  // Get export function from store
  const { exportTripData } = useTripProgressStore();

  useRtirlSocket(); // Still needed for GPS data updates
  useConsoleCommands();
  useURLParameters();
  useAppInitialization();

  // Use robust GPS processor for movement detection
  const gpsProcessor = useGPSProcessor();

  // Get current mode from GPS processor (which includes hysteresis and delays)
  const currentMode = gpsProcessor.getCurrentMode();

  // Avatar image mapping - using public directory for production builds
  const getAvatarImage = () => {
    switch (currentMode) {
      case 'WALKING':
        return '/walking.gif';
      case 'CYCLING':
        return '/cycling.gif';
      default:
        return '/stationary.png';
    }
  };

  // Control panel functions
  const resetTripProgress = () => {
    console.log(
      `[${new Date().toISOString()}] TripOverlay: Reset trip progress triggered`
    );
    resetTrip();
  };

  const resetAutoStartLocation = () => {
    console.log(
      `[${new Date().toISOString()}] TripOverlay: Reset auto start location triggered`
    );
    // Clear localStorage GPS data to force re-detection
    localStorage.removeItem('tripOverlayStartLocation');
    localStorage.removeItem('tripOverlayLastPosition');
    console.log(
      `[${new Date().toISOString()}] TripOverlay: Auto start location cleared - will re-detect on next GPS update`
    );
  };

  const resetTodayDistance = () => {
    console.log(
      `[${new Date().toISOString()}] TripOverlay: Reset today distance triggered`
    );
    resetToday();
  };

  const handleExportTripData = () => {
    console.log(
      `[${new Date().toISOString()}] TripOverlay: Export trip data triggered`
    );
    try {
      const result = exportTripData();
      console.log(`[${new Date().toISOString()}] TripOverlay: ${result}`);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] TripOverlay: Export failed:`,
        error
      );
    }
  };

  // Control panel visibility (for development/testing)
  const showControlPanel = false;

  return (
    <div className="absolute bottom-[60px] left-1/2 transform -translate-x-1/2 w-[600px]">
      {/* Main overlay container - matches original styling */}
      <div className="bg-black/30 p-0 rounded-xl shadow-lg">
        {/* Progress Section */}
        <div className="mx-auto p-5 px-6 pb-[18px] rounded-[15px]">
          {/* Progress Bar Container */}
          <div className="relative w-full max-w-[600px] mx-auto mb-2 h-[11px] bg-black/30 border border-white/30 rounded-[7px]">
            {/* Progress Bar Fill */}
            <div
              className="h-full bg-white rounded-[10px] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Progress Percentage Badge */}
            <span
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2
                           text-white text-xs font-semibold z-10 pointer-events-none
                           [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]
                           bg-black/55 px-2.5 py-0.5 rounded-lg"
            >
              {progressPercent.toFixed(2)}%
            </span>

            {/* Avatar positioned on progress bar */}
            <img
              src={getAvatarImage()}
              alt="Trip Avatar"
              className="absolute h-[60px] bottom-0.5 transform -translate-x-1/2 transition-all duration-500 ease-out"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Distance Data Container - Three column layout */}
          <div className="w-full max-w-[600px] mx-auto flex justify-between items-start mt-1.5">
            {/* Traveled Distance - Left aligned */}
            <div className="flex-1 flex flex-col items-start text-left">
              <span className="text-[19px] font-bold text-white [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]">
                {traveledDistance.toFixed(2)} {getUnitLabel()}
              </span>
              <div className="text-[10px] font-normal text-[#cccccc] uppercase text-left">
                traveled
              </div>
            </div>

            {/* Today's Distance - Center aligned */}
            <div className="flex-1 flex flex-col items-center text-center">
              <span className="text-[19px] font-bold text-white [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]">
                {todayDistance.toFixed(1)} {getUnitLabel()}
              </span>
              <div className="text-[10px] font-normal text-[#cccccc] uppercase text-center">
                today
              </div>
            </div>

            {/* Remaining Distance - Right aligned */}
            <div className="flex-1 flex flex-col items-end text-right">
              <span className="text-[19px] font-bold text-white [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]">
                {remainingDistance.toFixed(2)} {getUnitLabel()}
              </span>
              <div className="text-[10px] font-normal text-[#cccccc] uppercase text-right">
                remaining
              </div>
              </div>
            </div>
          </div>
        </div>

      {/* Enhanced Control Panel - Conditional overlay like original */}
        {showControlPanel && (
        <div className="mt-5 p-[15px] bg-black/60 border border-white/20 rounded-[10px] backdrop-blur-[5px] min-w-[300px]">
              {/* Control Header */}
              <div className="text-center text-sm font-bold text-white mb-3 uppercase tracking-wider">
                Stream Controls
              </div>

              {/* Primary Control Row */}
              <div className="flex gap-3 mb-2.5 justify-center">
            <button
                  onClick={resetTodayDistance}
              className="bg-white/15 border border-white/30 text-white px-4 py-2.5 rounded-lg cursor-pointer
                       text-[13px] font-medium transition-all duration-200 min-w-[110px] text-center
                       hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5
                       active:bg-white/35 active:translate-y-0"
                  title="Reset today's distance - most common for daily tours"
                >
                  🔄 Reset Today
            </button>
            <button
              onClick={handleExportTripData}
              className="bg-white/15 border border-white/30 text-white px-4 py-2.5 rounded-lg cursor-pointer
                       text-[13px] font-medium transition-all duration-200 min-w-[110px] text-center
                       hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5
                       active:bg-white/35 active:translate-y-0"
                  title="Download backup file"
                >
                  💾 Backup
            </button>
              </div>

              {/* Secondary Control Row */}
              <div className="flex gap-3 mb-4 justify-center">
            <button
                  onClick={resetAutoStartLocation}
              className="bg-white/15 border border-white/30 text-white px-4 py-2.5 rounded-lg cursor-pointer
                       text-[13px] font-medium transition-all duration-200 min-w-[110px] text-center
                       hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5
                       active:bg-white/35 active:translate-y-0"
                  title="Re-detect start location"
                >
                  📍 Fix Start
            </button>
            <button
                  onClick={resetTripProgress}
              className="bg-red-600/30 border border-red-600/50 text-white px-4 py-2.5 rounded-lg cursor-pointer
                       text-[13px] font-medium transition-all duration-200 min-w-[110px] text-center
                       hover:bg-red-600/50 hover:border-red-600/70 hover:-translate-y-0.5
                       active:bg-red-600/60 active:translate-y-0"
                  title="⚠️ Reset entire trip - use carefully!"
                >
                  🗑️ Reset All
            </button>
              </div>

          {/* Feedback area */}
          <div className="text-center text-xs p-2 rounded-md mt-1 min-h-[20px] flex items-center justify-center">
            {/* Feedback messages would go here */}
          </div>
                </div>
              )}
            </div>
  );
};

export default TripOverlay;
