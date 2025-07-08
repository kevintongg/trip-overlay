import { useState, useEffect, useMemo } from 'react';
import type { DashboardConfig } from './useDashboardConfig';

export interface TimeDisplay {
  dateStr: string;
  timeStr: string;
  tzStr: string;
  currentTime: Date;
}

/**
 * Time Display Hook
 * Handles time formatting, timezone conversion, and updates
 * Maintains exact compatibility with original time display logic
 */
export function useTimeDisplay(
  config: DashboardConfig,
  weatherData?: any
): TimeDisplay {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time based on configuration (extracted from original formatTime function)
  const { dateStr, timeStr, tzStr } = useMemo(() => {
    // Use weather timezone if available, otherwise fall back to system timezone, or URL override
    // Priority: URL override > Weather timezone > System timezone (matches original exactly)
    const weatherTimezone = weatherData?.timezone;
    const timeZone =
      config.timezoneOverride ||
      weatherTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Format time based on 12/24 hour preference
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
      hour12: config.use12Hour,
      timeZone,
    });

    // Format date as "Mon, Jul 7, 2024" (matches original exactly)
    const formattedDate = currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone,
    });

    // Get timezone offset from weather data or calculate from system (matches original exactly)
    let formattedTz = 'GMT';
    if (weatherData?.timezone_offset !== undefined) {
      const offsetHours = weatherData.timezone_offset / 3600;
      const offsetSign = offsetHours >= 0 ? '+' : '-';
      const absHours = Math.abs(offsetHours);
      if (absHours % 1 === 0) {
        formattedTz = `GMT${offsetSign}${Math.floor(absHours)}`;
      } else {
        const hours = Math.floor(absHours);
        const minutes = Math.round((absHours - hours) * 60);
        formattedTz = `GMT${offsetSign}${hours}:${minutes.toString().padStart(2, '0')}`;
      }
    } else {
      // Fallback to system timezone offset
      const offsetMinutes = currentTime.getTimezoneOffset();
      const offsetHours = Math.abs(offsetMinutes / 60);
      const offsetSign = offsetMinutes <= 0 ? '+' : '-';
      formattedTz = `GMT${offsetSign}${Math.floor(offsetHours)}`;
    }

    return {
      dateStr: formattedDate,
      timeStr: formattedTime,
      tzStr: formattedTz,
    };
  }, [
    currentTime,
    config.use12Hour,
    config.timezoneOverride,
    weatherData?.timezone,
    weatherData?.timezone_offset,
  ]);

  return {
    dateStr,
    timeStr,
    tzStr,
    currentTime,
  };
}
