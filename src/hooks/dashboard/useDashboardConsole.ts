import { useEffect, useCallback, useMemo } from 'react';
import { speedUpdateService } from '../../utils/speedUpdateService';
import type { LocationData } from './useLocationData';
import type { SpeedDisplay } from './useSpeedDisplay';
import type { TimeDisplay } from './useTimeDisplay';
import { logger } from '../../utils/logger';

interface ConsoleAPI {
  getStatus: () => any;
  reloadWeather: () => void;
  testSpeed: (speed: number) => void;
  testMode: (mode: string) => void;
  clearSpeed: () => void;
}

/**
 * Dashboard Console Commands Hook
 * Exposes debug functions to window object for backward compatibility
 * Maintains exact API from original Dashboard implementation
 */
export function useDashboardConsole(
  locationData: LocationData,
  speedDisplay: SpeedDisplay,
  timeDisplay: TimeDisplay,
  weatherData: any
): ConsoleAPI {
  // Console API functions (extracted from original)
  const getStatus = useCallback(() => {
    const status = {
      rtirl: {
        connected: locationData.rtirlConnected,
        lastPosition: locationData.lastPosition,
      },
      location: {
        text: locationData.locationText,
        connected: locationData.isConnected,
      },
      speed: {
        current: speedDisplay.currentSpeed,
        mode: speedDisplay.currentMode,
        mph: speedDisplay.speedMph,
        kmh: speedDisplay.speedKmh,
      },
      time: {
        current: timeDisplay.currentTime,
        formatted: timeDisplay.timeStr,
        timezone: timeDisplay.tzStr,
      },
      weather: {
        hasData: !!weatherData,
        temperature: weatherData?.current?.temp,
        description: weatherData?.current?.weather?.[0]?.description,
      },
    };

    // Display nicely formatted table
    logger('📊 Dashboard Status:');
    console.table({
      'RTIRL Connected': status.rtirl.connected,
      'Location Text': status.location.text,
      'Speed (km/h)': status.speed.kmh,
      'Speed Mode': status.speed.mode,
      'Current Time': status.time.formatted,
      'Weather Temp': status.weather.temperature
        ? `${Math.round(status.weather.temperature)}°`
        : 'N/A',
    });

    // Show detailed status in readable format
    console.log('📋 Detailed Status:');
    console.log(`  RTIRL: ${status.rtirl.connected ? 'Connected' : 'Disconnected'} ${status.rtirl.lastPosition ? `(${status.rtirl.lastPosition.lat.toFixed(4)}, ${status.rtirl.lastPosition.lon.toFixed(4)})` : '(no position)'}`);
    console.log(`  Location: ${status.location.text} (${status.location.connected ? 'connected' : 'disconnected'})`);
    console.log(`  Speed: ${status.speed.kmh} km/h (${status.speed.mph} mph) - Mode: ${status.speed.mode}`);
    console.log(`  Time: ${status.time.formatted} ${status.time.timezone}`);
    console.log(`  Weather: ${status.weather.hasData ? `${Math.round(status.weather.temperature)}° - ${status.weather.description}` : 'No weather data'}`);

    return status;
  }, [locationData, speedDisplay, timeDisplay, weatherData]);

  const reloadWeather = useCallback(() => {
    logger('🌤️ Dashboard: Manually triggering weather reload...');
    window.dispatchEvent(new CustomEvent('forceWeatherUpdate'));
  }, []);

  const testSpeed = useCallback((speed: number) => {
    logger(`🚴 Dashboard: Setting test speed to ${speed} km/h`);
    speedUpdateService.updateSpeed(speed, 'CYCLING', { force: true });
  }, []);

  const testMode = useCallback((mode: string) => {
    logger(`🏃 Dashboard: Setting test mode to ${mode}`);
    const currentSpeed = speedUpdateService.getCurrentSpeed()?.speed || 0;
    speedUpdateService.updateSpeed(currentSpeed, mode, { force: true });
  }, []);

  const clearSpeed = useCallback(() => {
    logger('🛑 Dashboard: Clearing speed data');
    speedUpdateService.clearSpeedData();
  }, []);

  // Create API object (memoized to prevent recreation)
  const consoleAPI: ConsoleAPI = useMemo(() => ({
    getStatus,
    reloadWeather,
    testSpeed,
    testMode,
    clearSpeed,
  }), [getStatus, reloadWeather, testSpeed, testMode, clearSpeed]);

  // Expose to window object (for backward compatibility)
  useEffect(() => {
    // Create TripOverlay namespace if it doesn't exist
    if (!(window as any).TripOverlay) {
      (window as any).TripOverlay = {};
    }

    // Attach functions to both TripOverlay namespace and global window
    Object.assign((window as any).TripOverlay, consoleAPI);
    Object.assign(window as any, consoleAPI);

    // Only log once when first mounted
    logger(
      '🎮 Dashboard: Console commands available:',
      Object.keys(consoleAPI)
    );

    return () => {
      // Clean up on unmount
      Object.keys(consoleAPI).forEach(key => {
        delete (window as any).TripOverlay[key];
        delete (window as any)[key];
      });
    };
  }, []); // Remove dependency to prevent spam - only run once on mount

  return consoleAPI;
}
