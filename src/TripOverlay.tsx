/*
 * TripOverlay - Real-time GPS Tracking for Live Streaming
 * 
 * Copyright (c) 2025 Kevin Tong and Trip Overlay Contributors
 * 
 * Dual Licensed:
 * - Non-Commercial License: Free for personal/educational use
 * - Commercial License: Required for monetized streaming
 * 
 * For commercial licensing: licensing@tripoverlay.dev
 * For questions: https://github.com/kevintongg/trip-overlay
 */

import React, { useEffect } from 'react';
import { useTripProgressStore } from './store/tripStore';
import { useRtirlSocket } from './hooks/useRtirlSocket';
import { useGPSProcessor } from './hooks/useGPSProcessor';
import { useConsoleCommands } from './hooks/useConsoleCommands';
import { useURLParameters } from './hooks/useURLParameters';
import { useAppInitialization } from './hooks/useAppInitialization';

/**
 * Trip Overlay Component - Clean minimalist design for streaming
 * Uses unified hook that ports original vanilla JS logic exactly
 * Optimized for 1080p streaming with clean typography and minimal footprint
 */
const TripOverlay: React.FC = () => {
  const {
    totalDistanceKm,
    totalTraveledKm,
    todayDistanceKm,
    units,
    currentMode = 'STATIONARY',
    resetProgress,
    resetTodayDistance,
    exportTripData,
  } = useTripProgressStore();
  
  const consoleCommands = useConsoleCommands();

  useRtirlSocket(); // GPS data updates
  useGPSProcessor(); // Movement mode detection
  useURLParameters(); // Handle URL parameters
  useAppInitialization();

  // Set up console API
  useEffect(() => {
    (window as any).TripOverlay = {
      controls: consoleCommands,
      getStatus: consoleCommands.getStatus,
    };
    (window as any).showConsoleCommands = consoleCommands.showConsoleCommands;
  }, [consoleCommands]);

  // Calculate values
  const unitMultiplier = units === 'miles' ? 0.621371 : 1;
  const unitSuffix = units === 'miles' ? 'mi' : 'km';
  const progressPercent = totalDistanceKm > 0 ? Math.min((totalTraveledKm / totalDistanceKm) * 100, 100) : 0;
  const remainingDistance = Math.max(0, totalDistanceKm - totalTraveledKm);

  // Avatar image mapping
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
                {(totalTraveledKm * unitMultiplier).toFixed(2)} {unitSuffix}
              </span>
              <div className="text-[10px] font-normal text-[#cccccc] uppercase text-left">
                traveled
              </div>
            </div>

            {/* Today's Distance - Center aligned */}
            <div className="flex-1 flex flex-col items-center text-center">
              <span className="text-[19px] font-bold text-white [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]">
                {(todayDistanceKm * unitMultiplier).toFixed(2)} {unitSuffix}
              </span>
              <div className="text-[10px] font-normal text-[#cccccc] uppercase text-center">
                today
              </div>
            </div>

            {/* Remaining Distance - Right aligned */}
            <div className="flex-1 flex flex-col items-end text-right">
              <span className="text-[19px] font-bold text-white [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]">
                {(remainingDistance * unitMultiplier).toFixed(2)} {unitSuffix}
              </span>
              <div className="text-[10px] font-normal text-[#cccccc] uppercase text-right">
                remaining
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TripOverlay;
