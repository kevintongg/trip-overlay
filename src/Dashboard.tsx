import React from 'react';
import { Card, CardContent } from './components/ui/card';
import { useWeatherData } from './hooks/useWeatherData';
import { useDashboardConfig } from './hooks/dashboard/useDashboardConfig';
import { useTimeDisplay } from './hooks/dashboard/useTimeDisplay';
import { useLocationData } from './hooks/dashboard/useLocationData';
import { useSpeedDisplay } from './hooks/dashboard/useSpeedDisplay';
import { useDashboardDemo } from './hooks/dashboard/useDashboardDemo';
import { useDashboardConsole } from './hooks/dashboard/useDashboardConsole';
import { TimeSection } from './components/dashboard/TimeSection';
import { LocationSection } from './components/dashboard/LocationSection';
import { WeatherSection } from './components/dashboard/WeatherSection';

/**
 * React-First Dashboard Component
 *
 * Complete rewrite with clean architecture:
 * - Separated hooks for each concern
 * - Individual components for each section
 * - Maintained 100% backward compatibility
 * - URL parameters work identically
 * - Console commands work identically
 *
 * Benefits:
 * - Much easier to test and maintain
 * - Clear separation of concerns
 * - Reusable hooks and components
 * - Better TypeScript support
 * - Cleaner code organization
 */
const Dashboard: React.FC = () => {
  // Configuration from URL parameters (maintains exact compatibility)
  const config = useDashboardConfig();

  // Core data hooks (with client-side check)
  const locationData = useLocationData();
  const speedDisplay = useSpeedDisplay();
  const weatherUnits = 'metric'; // Could be made configurable via URL params later
  const weatherQuery = useWeatherData(
    locationData.lastPosition?.lat,
    locationData.lastPosition?.lon,
    weatherUnits
  );
  const weatherData = weatherQuery.data;

  // Time display with weather timezone support (matches original behavior)
  const timeDisplay = useTimeDisplay(config, weatherData);

  // Demo mode (maintains exact behavior)
  useDashboardDemo(config);

  // Console commands (maintains exact API)
  useDashboardConsole(locationData, speedDisplay, timeDisplay, weatherData);

  return (
    <div className="w-screen h-screen flex flex-col items-end justify-start gap-[18px] pr-[24px] pt-[24px] pointer-events-none">
      <Card className="dashboard-card flex flex-col items-center bg-gradient-to-br from-zinc-900/70 to-zinc-800/70 border-white/20 rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)] min-w-[280px] max-w-[480px] backdrop-blur-sm">
        <CardContent className="p-0 w-full">
          {/* Location Section */}
          <LocationSection
            locationData={locationData}
            show={config.showLocation}
          />

          {/* Weather Section (includes speed when cycling) */}
          <WeatherSection
            weatherData={weatherData}
            speedDisplay={speedDisplay}
            show={config.showWeather}
            units={weatherUnits}
          />

          {/* Time Section */}
          <TimeSection timeDisplay={timeDisplay} show={config.showTime} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
