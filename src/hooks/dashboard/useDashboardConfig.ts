import { useMemo } from 'react';

export interface DashboardConfig {
  demo: boolean;
  showTime: boolean;
  showWeather: boolean;
  showLocation: boolean;
  showSpeed: boolean;
  use12Hour: boolean;
  timezoneOverride?: string;
}

/**
 * Dashboard Configuration Hook
 * Parses URL parameters for dashboard display options
 * Maintains exact compatibility with original URL parameter system
 */
export function useDashboardConfig(): DashboardConfig {
  return useMemo<DashboardConfig>(() => {
    const params = new URLSearchParams(window.location.search);

    return {
      demo: params.get('demo') === 'true',
      showTime: params.get('time') !== 'false', // Default true, only false if explicitly set
      showWeather: params.get('weather') !== 'false', // Default true, only false if explicitly set
      showLocation: params.get('location') !== 'false', // Default true, only false if explicitly set
      showSpeed: params.get('speed') === 'true', // Default false, only true if explicitly set
      use12Hour: params.get('format') === '12',
      timezoneOverride: params.get('timezone') || undefined,
    };
  }, []); // Empty dependency array since URL doesn't change during component lifecycle
}
