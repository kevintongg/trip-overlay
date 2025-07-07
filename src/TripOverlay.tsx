import React from 'react';
import { useTripProgress } from './hooks/useTripProgress';
import { useRtirlSocket } from './hooks/useRtirlSocket';
import { useConsoleCommands } from './hooks/useConsoleCommands';
import { useURLParameters } from './hooks/useURLParameters';
import { useAppInitialization } from './hooks/useAppInitialization';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';

// Using modern Tailwind CSS + shadcn/ui instead of original CSS files

/**
 * Main Trip Overlay Component
 * Displays trip progress, distance tracking, and movement avatars
 * Using modern Tailwind CSS + shadcn/ui components optimized for 1080p streaming
 */
const TripOverlay: React.FC = () => {
  const {
    traveledDistance,
    todayDistance,
    remainingDistance,
    progressPercent,
    currentMode,
    getUnitLabel,
    resetTrip,
    resetToday,
  } = useTripProgress();

  const { isConnected } = useRtirlSocket();
  useConsoleCommands();
  useURLParameters();
  useAppInitialization();

  // Avatar image mapping exactly like original
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
    // TODO: Implement reset auto start location
  };

  const resetTodayDistance = () => {
    console.log(
      `[${new Date().toISOString()}] TripOverlay: Reset today distance triggered`
    );
    resetToday();
  };

  const exportTripData = () => {
    console.log(
      `[${new Date().toISOString()}] TripOverlay: Export trip data triggered`
    );
    // TODO: Implement export trip data
  };

  // Mock values for now
  const showControlPanel = false;
  const feedback = null;

  // Helper function to get feedback styling classes
  const getFeedbackClasses = (feedbackType: string) => {
    if (feedbackType === 'success') {
      return 'bg-green-600/20 border-green-600/40 text-green-200';
    }
    if (feedbackType === 'warning') {
      return 'bg-yellow-600/20 border-yellow-600/40 text-yellow-200';
    }
    return 'bg-red-600/20 border-red-600/40 text-red-200';
  };

  // Console API is initialized by useAppInitialization hook

  return (
    <div className="fixed bottom-[60px] left-1/2 transform -translate-x-1/2 z-50">
      {/* Main Trip Progress Card */}
      <Card className="w-[720px] bg-gradient-to-br from-black/40 to-black/60 border-white/20 backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 space-y-6">
          {/* Progress Section with Custom Avatar */}
          <div className="relative space-y-4">
            {/* Progress Bar with shadcn/ui Progress component */}
            <div className="relative">
              <Progress
                value={progressPercent}
                className="h-6 bg-black/40 border border-white/30"
              />

              {/* Progress Percentage Badge */}
              <Badge
                variant="secondary"
                className="absolute -top-2 right-3 text-sm bg-black/70 text-white border-white/30 font-bold px-3 py-1"
              >
                {progressPercent.toFixed(1)}%
              </Badge>

              {/* Avatar positioned on progress bar */}
              <div
                className="absolute -bottom-10 transform -translate-x-1/2 transition-all duration-500 ease-out"
                style={{
                  left: `${Math.max(5, Math.min(95, progressPercent))}%`,
                }}
              >
                <img
                  src={getAvatarImage()}
                  alt="Trip Avatar"
                  className="h-20 w-auto drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Spacing for avatar */}
          <div className="h-6" />

          {/* Distance Data Grid */}
          <div className="grid grid-cols-3 gap-8 text-center">
            {/* Traveled Distance */}
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white text-shadow-heavy">
                {traveledDistance.toFixed(2)}
              </div>
              <div className="text-lg font-semibold text-white/90">
                {getUnitLabel()}
              </div>
              <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                Traveled
              </div>
            </div>

            {/* Today's Distance - Emphasized */}
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-200 text-shadow-heavy">
                {todayDistance.toFixed(1)}
              </div>
              <div className="text-lg font-semibold text-blue-200/90">
                {getUnitLabel()}
              </div>
              <div className="text-sm font-medium text-blue-300 uppercase tracking-wider">
                Today
              </div>
            </div>

            {/* Remaining Distance */}
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white text-shadow-heavy">
                {remainingDistance.toFixed(2)}
              </div>
              <div className="text-lg font-semibold text-white/90">
                {getUnitLabel()}
              </div>
              <div className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                Remaining
              </div>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div className="flex justify-center">
            <Badge
              variant={isConnected ? 'default' : 'destructive'}
              className={`text-sm font-medium px-4 py-2 ${
                isConnected
                  ? 'bg-green-600/30 border-green-500/50 text-green-200'
                  : 'bg-red-600/30 border-red-500/50 text-red-200'
              }`}
            >
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Control Panel */}
      {showControlPanel && (
        <Card className="mt-6 w-[720px] bg-black/70 border-white/20 backdrop-blur-md">
          <CardContent className="p-6 space-y-4">
            {/* Control Header */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">
                Stream Controls
              </h3>
              <Separator className="bg-white/20" />
            </div>

            {/* Primary Control Row */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="default"
                onClick={resetTodayDistance}
                className="stream-button text-sm font-medium min-w-[140px]"
                title="Reset today's distance - most common for daily tours"
              >
                🔄 Reset Today
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={exportTripData}
                className="stream-button text-sm font-medium min-w-[140px]"
                title="Download backup file"
              >
                💾 Backup
              </Button>
            </div>

            {/* Secondary Control Row */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="default"
                onClick={resetAutoStartLocation}
                className="stream-button text-sm font-medium min-w-[140px]"
                title="Re-detect start location"
              >
                📍 Fix Start
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={resetTripProgress}
                className="stream-button-danger text-sm font-medium min-w-[140px]"
                title="⚠️ Reset entire trip - use carefully!"
              >
                🗑️ Reset All
              </Button>
            </div>

            {/* Feedback Messages */}
            {feedback && (
              <div
                className={`p-4 rounded-lg text-base text-center border font-medium ${getFeedbackClasses((feedback as any).type)}`}
              >
                {(feedback as any).message}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripOverlay;
