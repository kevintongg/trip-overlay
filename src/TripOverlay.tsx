import React, { useEffect } from 'react'
import { useTripProgress } from './hooks/useTripProgress'
import { useRtirlSocket } from './hooks/useRtirlSocket'
import { useConsoleCommands } from './hooks/useConsoleCommands'
import { useURLParameters } from './hooks/useURLParameters'
import { useAppInitialization } from './hooks/useAppInitialization'
import { Button } from './components/ui/button'
import { Progress } from './components/ui/progress'
import { Card } from './components/ui/card'
import { Badge } from './components/ui/badge'

// Using modern Tailwind CSS + shadcn/ui instead of original CSS files

/**
 * Main Trip Overlay Component
 * Displays trip progress, distance tracking, and movement avatars
 * Now using modern Tailwind CSS + shadcn/ui components
 */
const TripOverlay: React.FC = () => {
  const {
    totalDistance,
    traveledDistance,
    todayDistance,
    remainingDistance,
    progressPercent,
    currentMode,
    useImperialUnits,
    getUnitLabel,
    resetTrip,
    resetToday,
  } = useTripProgress()

  const { isConnected } = useRtirlSocket()
  useConsoleCommands()
  useURLParameters()
  useAppInitialization()

  // Avatar image mapping exactly like original
  const getAvatarImage = () => {
    switch (currentMode) {
      case 'WALKING':
        return '/walking.gif'
      case 'CYCLING':
        return '/cycling.gif'
      default:
        return '/stationary.png'
    }
  }

  // Mock functions for control panel (will be implemented properly later)
  const resetTripProgress = () => {
    resetTrip()
  }

  const resetAutoStartLocation = () => {
    // TODO: Implement reset auto start location
    // Reset auto start location - handled by store logging
  }

  const resetTodayDistance = () => {
    resetToday()
  }

  const exportTripData = () => {
    // TODO: Implement export trip data
    // Export trip data - handled by store logging
  }

  // Mock values for now
  const showControlPanel = false
  const feedback = null

  // Console API is initialized by useAppInitialization hook

  return (
    <>
      {/* Main Overlay Container - Tailwind conversion of original styling */}
      <div className="absolute top-[60px] w-[600px] left-1/2 transform -translate-x-1/2 bg-black/30 p-0 rounded-xl shadow-lg">
        {/* Progress Section */}
        <div className="w-full">
          {/* Custom Progress Bar with Avatar */}
          <div className="relative w-full max-w-[600px] mx-auto mb-2 h-[11px] bg-black/30 border border-white/30 rounded-[7px]">
            <div 
              className="h-full bg-white rounded-[10px] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Progress Percentage Badge */}
            <Badge 
              variant="secondary" 
              className="absolute top-[-2px] right-2 text-xs bg-black/50 text-white border-white/20"
            >
              {progressPercent.toFixed(1)}%
            </Badge>
            {/* Avatar positioned on progress bar */}
            <img 
              src={getAvatarImage()} 
              alt="peeguu"
              className="absolute h-[60px] bottom-[2px] transform -translate-x-1/2 transition-all duration-300 ease-out"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          
          {/* Distance Data Container - Tailwind flexbox layout */}
          <div className="w-full max-w-[600px] mx-auto flex justify-between items-start mt-1.5 px-4 pb-2">
            {/* Traveled Distance - Left aligned */}
            <div className="flex-1 text-[21px] font-bold flex flex-col items-start text-left">
              <span className="text-white drop-shadow-[1px_1px_3px_rgba(0,0,0,0.8)]">
                {traveledDistance.toFixed(2)} {getUnitLabel()}
              </span>
              <div className="text-[11px] font-normal text-gray-300 uppercase text-left">
                traveled
              </div>
            </div>

            {/* Today's Distance - Center aligned */}
            <div className="flex-1 text-[21px] font-bold flex flex-col items-center text-center">
              <span className="text-white drop-shadow-[1px_1px_3px_rgba(0,0,0,0.8)]">
                {todayDistance.toFixed(1)} {getUnitLabel()}
              </span>
              <div className="text-[11px] font-normal text-gray-300 uppercase text-center">
                today
              </div>
            </div>

            {/* Remaining Distance - Right aligned */}
            <div className="flex-1 text-[21px] font-bold flex flex-col items-end text-right">
              <span className="text-white drop-shadow-[1px_1px_3px_rgba(0,0,0,0.8)]">
                {remainingDistance.toFixed(2)} {getUnitLabel()}
              </span>
              <div className="text-[11px] font-normal text-gray-300 uppercase text-right">
                remaining
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Control Panel - shadcn/ui Card component */}
        {showControlPanel && (
          <Card className="mt-5 mx-4 mb-4 bg-black/60 border-white/20 backdrop-blur-sm">
            <div className="p-4">
              {/* Control Header */}
              <div className="text-center text-sm font-bold text-white mb-3 uppercase tracking-wider">
                Stream Controls
              </div>
              
              {/* Primary Control Row */}
              <div className="flex gap-3 mb-2.5 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTodayDistance}
                  className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5 transition-all duration-200 min-w-[110px] text-xs font-medium"
                  title="Reset today's distance - most common for daily tours"
                >
                  🔄 Reset Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTripData}
                  className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5 transition-all duration-200 min-w-[110px] text-xs font-medium"
                  title="Download backup file"
                >
                  💾 Backup
                </Button>
              </div>

              {/* Secondary Control Row */}
              <div className="flex gap-3 mb-4 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAutoStartLocation}
                  className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5 transition-all duration-200 min-w-[110px] text-xs font-medium"
                  title="Re-detect start location"
                >
                  📍 Fix Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTripProgress}
                  className="bg-red-600/30 border-red-600/50 text-white hover:bg-red-600/50 hover:border-red-600/70 hover:-translate-y-0.5 transition-all duration-200 min-w-[110px] text-xs font-medium"
                  title="⚠️ Reset entire trip - use carefully!"
                >
                  🗑️ Reset All
                </Button>
              </div>

              {/* Feedback Messages */}
              {feedback && (
                <div className={`mt-3 p-2 rounded text-sm text-center ${
                  (feedback as any).type === 'success' ? 'bg-green-600/20 border-green-600/40 text-green-200' :
                  (feedback as any).type === 'warning' ? 'bg-yellow-600/20 border-yellow-600/40 text-yellow-200' :
                  'bg-red-600/20 border-red-600/40 text-red-200'
                } border`}>
                  {(feedback as any).message}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

export default TripOverlay 