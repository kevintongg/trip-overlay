import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { useConnectionStore } from './store/connectionStore';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useRtirlSocket } from './hooks/useRtirlSocket';
import { Card } from './components/ui/card';
// import { Badge } from './components/ui/badge';
// import { Separator } from './components/ui/separator';
import { logger } from './utils/logger';

// Global flag type declaration for dashboard demo coordination
declare global {
  interface Window {
    __dashboardDemoActive?: boolean;
  }
}

interface URLParams {
  demo: boolean;
  showTime: boolean;
  showWeather: boolean;
  showLocation: boolean;
  use12Hour: boolean;
  timezoneOverride?: string;
}

interface DashboardStatus {
  connection: {
    isConnected: boolean;
    isDemoMode: boolean;
  };
  dashboard: {
    weather: any;
    lastPosition: any;
    locationText: string;
    currentSpeed: number;
  };
}

// Using modern Tailwind CSS + shadcn/ui instead of original CSS files

/**
 * Dashboard Component for Live Streaming
 * Displays location, weather, time, and speed information
 * Now using modern Tailwind CSS + shadcn/ui components
 */
const Dashboard: React.FC = () => {
  // Parse URL parameters using useMemo for performance
  const urlParams = useMemo<URLParams>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      demo: params.get('demo') === 'true',
      showTime: params.get('time') !== 'false',
      showWeather: params.get('weather') !== 'false',
      showLocation: params.get('location') !== 'false',
      use12Hour: params.get('format') === '12',
      timezoneOverride: params.get('timezone') || undefined,
    };
  }, []);

  // Use centralized app initialization
  useAppInitialization();

  // Connect to RTIRL (with deduplication protection)
  const { isConnected: rtirlConnected } = useRtirlSocket();

  // Get GPS coordinates from connection store
  const { lastPosition, isConnected } = useConnectionStore();

  // SAFETY: Don't make weather calls if new dashboard is also running (prevents double API usage)
  const shouldFetchWeather =
    !window.__dashboardDemoActive && lastPosition?.lat && lastPosition?.lon;
  const { data: weatherData, isLoading: weatherLoading } = useWeatherData(
    shouldFetchWeather ? lastPosition.lat : undefined,
    shouldFetchWeather ? lastPosition.lon : undefined
  );

  // Time state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationText, setLocationText] = useState('--');
  const [speedMph, setSpeedMph] = useState('--');
  const [speedKmh, setSpeedKmh] = useState('--');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentMode, setCurrentMode] = useState('STATIONARY');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Throttling refs to prevent spam
  const lastLogTime = useRef<{ [key: string]: number }>({});

  // Throttled logger function
  const throttledLog = useCallback(
    (key: string, throttleMs: number, message: string, ...args: unknown[]) => {
      const now = Date.now();
      if (now - (lastLogTime.current[key] || 0) > throttleMs) {
        lastLogTime.current[key] = now;
        logger(message, ...args);
      }
    },
    []
  );

  // Create status object using useMemo for performance
  const dashboardStatus = useMemo<DashboardStatus>(
    () => ({
      connection: {
        isConnected,
        isDemoMode: urlParams.demo,
      },
      dashboard: {
        weather: weatherData,
        lastPosition,
        locationText,
        currentSpeed,
      },
    }),
    [
      isConnected,
      urlParams.demo,
      weatherData,
      lastPosition,
      locationText,
      currentSpeed,
    ]
  );

  // Debug/Status functions using useCallback for stable references
  const getStatus = useCallback(() => {
    throttledLog('getStatus', 1000, '🔍 Dashboard Status:', dashboardStatus);
    return dashboardStatus;
  }, [dashboardStatus, throttledLog]);

  // Expose debug functions to window object (for backward compatibility)
  useEffect(() => {
    const windowObj = window as any;
    windowObj.TripOverlay = windowObj.TripOverlay || {};
    windowObj.TripOverlay.getStatus = getStatus;
    windowObj.getStatus = getStatus;

    return () => {
      // Cleanup on unmount
      if (windowObj.TripOverlay) {
        delete windowObj.TripOverlay.getStatus;
      }
      delete windowObj.getStatus;
    };
  }, [getStatus]);

  // Demo mode implementation using React patterns
  useEffect(() => {
    if (!urlParams.demo) {
      return;
    }

    throttledLog(
      'demo',
      1000,
      '🎭 Dashboard: Starting demo mode with Vienna coordinates'
    );

    let updateCount = 0;
    const demoState = {
      lat: 48.2082, // Vienna coordinates
      lon: 16.3738,
      speed: 15.5,
    };

    const demoInterval = setInterval(() => {
      updateCount++;

      // Simulate varying speed
      const speedVariation = Math.sin(updateCount * 0.1) * 5 + 15;
      demoState.speed = Math.max(0, speedVariation);

      // Move coordinates slightly (simulate cycling)
      const movement = 0.0001; // ~11 meters
      demoState.lat += (Math.random() - 0.5) * movement;
      demoState.lon += (Math.random() - 0.5) * movement;

      // Store demo speed in localStorage for speed display
      localStorage.setItem('tripOverlaySpeed', demoState.speed.toFixed(1));
      localStorage.setItem('tripOverlayMode', 'CYCLING');

      // Dispatch location update event
      const locationData = {
        latitude: demoState.lat,
        longitude: demoState.lon,
        accuracy: 5,
        speed: demoState.speed,
        timestamp: Date.now(),
        source: 'demo',
      };

      window.dispatchEvent(
        new CustomEvent('locationUpdate', { detail: locationData })
      );

      if (updateCount === 1 || updateCount % 10 === 0) {
        throttledLog(
          'demo',
          5000,
          `🎭 Demo update #${updateCount} - ${demoState.lat.toFixed(4)}, ${demoState.lon.toFixed(4)} @ ${demoState.speed.toFixed(1)}km/h`
        );
      }
    }, 1000);

    return () => clearInterval(demoInterval);
  }, [urlParams.demo, throttledLog]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lon: number) => {
    if (isReverseGeocoding) {
      return;
    } // Prevent duplicate requests

    setIsReverseGeocoding(true);
    try {
      // Use OpenStreetMap Nominatim for free reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'trip-overlay-dashboard/1.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { address } = data;

        // Build location string: "District, City, Country" or "City, Country"
        const district =
          address.district ||
          address.borough ||
          address.neighbourhood ||
          address.suburb ||
          address.quarter ||
          address.city_district;

        const city =
          address.city ||
          address.town ||
          address.village ||
          address.municipality;

        const { country } = address;

        const locationParts = [];
        if (district && district !== city) {
          locationParts.push(district);
        }
        if (city) {
          locationParts.push(city);
        }
        if (country) {
          locationParts.push(country);
        }

        const locationName =
          locationParts.filter(Boolean).length > 0
            ? locationParts.filter(Boolean).join(', ')
            : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

        setLocationText(locationName);
      } else {
        // Fallback to coordinates if geocoding fails
        setLocationText(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
      }
    } catch (error) {
      throttledLog('reverseGeocode', 1000, 'Reverse geocoding failed:', error);
      // Fallback to coordinates
      setLocationText(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Update location and speed from GPS data
  useEffect(() => {
    const handleLocationUpdate = (event: CustomEvent) => {
      const locationData = event.detail;

      // Skip excessive logging if the new dashboard demo is active
      if (!window.__dashboardDemoActive) {
        throttledLog(
          'locationUpdate',
          1000,
          '🏃 Dashboard: Location update received:',
          locationData
        );
      }

      if (locationData) {
        // Update location with reverse geocoding
        if (locationData.latitude && locationData.longitude) {
          reverseGeocode(locationData.latitude, locationData.longitude);
        }

        // Process speed data and store in localStorage for dashboard display
        if (locationData.speed !== undefined && locationData.speed !== null) {
          const gpsSpeedKmh = Math.max(0, locationData.speed); // Speed should already be in km/h from useRtirlSocket

          // Determine movement mode based on speed
          let mode = 'STATIONARY';
          if (gpsSpeedKmh > 8) {
            mode = 'CYCLING';
          } else if (gpsSpeedKmh > 2) {
            mode = 'WALKING';
          }

          // Store speed and mode in localStorage
          localStorage.setItem('tripOverlaySpeed', gpsSpeedKmh.toFixed(1));
          localStorage.setItem('tripOverlayMode', mode);

          // Skip excessive logging if the new dashboard demo is active
          if (!window.__dashboardDemoActive) {
            throttledLog(
              'speed',
              3000,
              `🚴 Dashboard: Processed GPS speed - ${gpsSpeedKmh.toFixed(1)} km/h, mode: ${mode} (source: ${locationData.source})`
            );
          }
        }
      }
    };

    window.addEventListener(
      'locationUpdate',
      handleLocationUpdate as EventListener
    );
    return () =>
      window.removeEventListener(
        'locationUpdate',
        handleLocationUpdate as EventListener
      );
  }, [isReverseGeocoding, reverseGeocode, throttledLog]);

  // Read speed from localStorage (like original dashboard)
  useEffect(() => {
    const updateSpeedFromStorage = () => {
      const speed =
        parseFloat(localStorage.getItem('tripOverlaySpeed') || '0') || 0;
      const mode = localStorage.getItem('tripOverlayMode') || 'STATIONARY';

      // Only log when there's an actual change to prevent spam
      if (mode !== currentMode || Math.abs(speed - currentSpeed) > 0.1) {
        throttledLog(
          'speed',
          3000,
          `🚴 Dashboard: Speed from localStorage - ${speed.toFixed(1)} km/h, mode: ${mode}`
        );
      }

      setCurrentSpeed(speed);
      setCurrentMode(mode);

      if (speed > 0) {
        setSpeedKmh(speed.toFixed(1));
        setSpeedMph((speed * 0.621371).toFixed(1));
      } else {
        setSpeedKmh('0.0');
        setSpeedMph('0.0');
      }
    };

    // Update speed immediately
    updateSpeedFromStorage();

    // Listen for localStorage changes (when trip-progress updates the speed)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'tripOverlaySpeed' || event.key === 'tripOverlayMode') {
        updateSpeedFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also poll localStorage periodically as fallback (in case storage events don't fire)
    const pollInterval = setInterval(updateSpeedFromStorage, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [throttledLog, currentMode, currentSpeed]);

  // Debug weather data loading
  useEffect(() => {
    if (lastPosition) {
      throttledLog(
        'weather',
        1000,
        '🌤️ Dashboard: Weather coordinates available:',
        lastPosition.lat,
        lastPosition.lon
      );
    }
    if (weatherLoading) {
      throttledLog('weather', 1000, '🌤️ Dashboard: Weather loading...');
    }
    if (weatherData) {
      throttledLog(
        'weather',
        1000,
        '🌤️ Dashboard: Weather data received:',
        weatherData
      );
      if (weatherData.timezone) {
        throttledLog(
          'weather',
          1000,
          `🕒 Dashboard: Using weather timezone: ${weatherData.timezone} (UTC${weatherData.timezone_offset >= 0 ? '+' : ''}${weatherData.timezone_offset / 3600})`
        );
      }
    }
  }, [lastPosition, weatherLoading, weatherData, throttledLog]);

  // Debug currentSpeed changes
  useEffect(() => {
    throttledLog(
      'speed',
      5000,
      `📊 Dashboard: currentSpeed state changed to: ${currentSpeed}`
    );
  }, [currentSpeed, throttledLog]);

  // Console API is initialized by useAppInitialization hook

  // Format time exactly like original (24-hour format preferred by user)
  const formatTime = () => {
    // Use weather timezone if available, otherwise fall back to system timezone, or URL override
    const weatherTimezone = weatherData?.timezone;
    const timeZone =
      urlParams.timezoneOverride ||
      weatherTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    const timeStr = currentTime.toLocaleTimeString('en-US', {
      hour12: urlParams.use12Hour, // Use URL parameter for 12/24 hour format
      timeZone,
    });

    // Format date as "Mon, Jul 7, 2024"
    const dateStr = currentTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone,
    });

    // Get timezone offset from weather data or calculate from system
    let tzStr = 'GMT';
    if (weatherData?.timezone_offset !== undefined) {
      const offsetHours = weatherData.timezone_offset / 3600;
      const offsetSign = offsetHours >= 0 ? '+' : '-';
      const absHours = Math.abs(offsetHours);
      if (absHours % 1 === 0) {
        tzStr = `GMT${offsetSign}${Math.floor(absHours)}`;
      } else {
        const hours = Math.floor(absHours);
        const minutes = Math.round((absHours - hours) * 60);
        tzStr = `GMT${offsetSign}${hours}:${minutes.toString().padStart(2, '0')}`;
      }
    } else {
      // Fallback to system timezone offset
      const offsetMinutes = currentTime.getTimezoneOffset();
      const offsetHours = Math.abs(offsetMinutes / 60);
      const offsetSign = offsetMinutes <= 0 ? '+' : '-';
      tzStr = `GMT${offsetSign}${Math.floor(offsetHours)}`;
    }

    return { timeStr, dateStr, tzStr };
  };

  const { timeStr, dateStr, tzStr } = formatTime();

  // Weather display helpers with memoization to prevent flicker
  const getWeatherIcon = useCallback(() => {
    if (!weatherData?.current?.weather?.[0]) {
      return null;
    }
    const iconCode = weatherData.current.weather[0].icon;
    const { description } = weatherData.current.weather[0];

    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    return (
      <img
        key={iconCode} // Stable key to prevent flicker
        src={iconUrl}
        alt={description}
        className="w-[2.2em] h-[2.2em] object-contain flex-shrink-0"
        onError={e => {
          // Fallback to emoji if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          // Show emoji fallback
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = '🌤️';
            parent.className =
              'text-[2.2em] flex items-center leading-none mr-1 font-emoji';
          }
        }}
      />
    );
  }, [weatherData?.current?.weather?.[0]?.icon]);

  const getWeatherTemp = useCallback(() => {
    if (!weatherData?.current?.temp) {
      return '--°C';
    }
    return `${Math.round(weatherData.current.temp)}°C`;
  }, [weatherData?.current?.temp]);

  const getWeatherDesc = useCallback(() => {
    if (weatherLoading) {
      return 'Loading...';
    }
    if (!weatherData?.current?.weather?.[0]) {
      return 'No weather data';
    }
    return weatherData.current.weather[0].description;
  }, [weatherLoading, weatherData?.current?.weather?.[0]?.description]);

  const getWeatherHighLow = useCallback(() => {
    if (!weatherData?.daily?.[0]) {
      return '--°C / --°C';
    }
    const high = Math.round(weatherData.daily[0].temp.max);
    const low = Math.round(weatherData.daily[0].temp.min);
    return `${high}°C / ${low}°C`;
  }, [weatherData?.daily?.[0]?.temp]);

  const getWeatherFeelsLike = () => {
    if (!weatherData?.current?.feels_like) {
      return null;
    }
    return `${Math.round(weatherData.current.feels_like)}°C`;
  };

  const getWeatherHumidity = () => {
    if (!weatherData?.current?.humidity) {
      return null;
    }
    return `${Math.round(weatherData.current.humidity)}%`;
  };

  const getWeatherWind = () => {
    if (!weatherData?.current?.wind_speed) {
      return null;
    }
    const windSpeed = (weatherData.current.wind_speed * 3.6).toFixed(1); // Convert m/s to km/h
    let wind = `${windSpeed} km/h`;

    if (weatherData.current.wind_deg !== undefined) {
      const direction = degToCompass(weatherData.current.wind_deg);
      wind += ` ${direction}`;
    }
    return wind;
  };

  const getWeatherUvi = () => {
    if (weatherData?.current?.uvi === undefined) {
      return null;
    }
    return weatherData.current.uvi.toFixed(1);
  };

  const getUviClass = (uvi: number) => {
    if (uvi <= 2) {
      return 'text-green-400';
    }
    if (uvi <= 5) {
      return 'text-yellow-400';
    }
    if (uvi <= 7) {
      return 'text-orange-400';
    }
    if (uvi <= 10) {
      return 'text-red-400';
    }
    return 'text-purple-400';
  };

  const degToCompass = (deg: number) => {
    const val = Math.floor(deg / 22.5 + 0.5);
    const directions = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];
    return directions[val % 16];
  };

  // Show connection status in location when no GPS
  const getLocationText = () => {
    if (locationText !== '--') {
      return locationText;
    }
    if (isConnected && lastPosition) {
      return 'GPS Connected';
    }
    if (rtirlConnected) {
      return 'RTIRL Connected';
    }
    return 'Waiting for GPS...';
  };

  return (
    <>
      {/* Main Dashboard Container - Right-aligned professional layout */}
      <div className="w-screen h-screen flex flex-col items-end justify-start gap-[18px] pr-[24px] pt-[24px] pointer-events-none">
        {/* Combined Dashboard Card - Solid readable design for streaming */}
        <Card className="flex flex-col items-center bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/20 rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] min-w-[320px] max-w-[520px] backdrop-blur-none">
          {/* Location Section - Conditionally rendered */}
          {urlParams.showLocation && (
            <div className="mb-3 w-full text-center">
              <div className="text-[1.5em] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] break-words">
                {getLocationText()}
              </div>
            </div>
          )}

          {/* Weather Section - Conditionally rendered */}
          {urlParams.showWeather && (
            <div key="weather-section" className="mb-3 w-full">
              <div className="flex items-center justify-center">
                {/* Weather Icon */}
                <div
                  key="weather-icon"
                  className="text-[2.2em] flex items-center leading-none mr-1 font-emoji"
                >
                  {getWeatherIcon()}
                </div>

                {/* Temperature Container */}
                <div
                  key="temperature"
                  className="flex flex-col items-center gap-1 mx-3"
                >
                  <div className="text-[2em] font-black text-white tracking-wide drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] font-inter leading-none">
                    {getWeatherTemp()}
                  </div>
                  <div className="text-[0.85em] text-gray-300 font-medium tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-inter whitespace-nowrap opacity-80">
                    {getWeatherHighLow()}
                  </div>
                </div>

                {/* Weather Description */}
                <div
                  key="weather-desc"
                  className="text-[1.1em] text-gray-200 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] capitalize ml-3 text-left leading-tight"
                >
                  {getWeatherDesc()}
                </div>

                {/* Speed Display - Only show when cycling */}
                {currentMode === 'CYCLING' && (
                  <div
                    key="speed-display"
                    className="flex flex-col items-start ml-2 font-semibold"
                  >
                    <div className="flex justify-start items-baseline w-full text-[1.2em] font-bold text-green-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-mono tracking-wider">
                      <span className="text-center min-w-[3.5em]">
                        {speedMph}
                      </span>
                      <span className="ml-2 text-[1em] text-green-500 font-medium tracking-wider">
                        mph
                      </span>
                    </div>
                    <div className="flex justify-start items-baseline w-full text-[1.2em] font-bold text-green-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-mono tracking-wider">
                      <span className="text-center min-w-[3.5em]">
                        {speedKmh}
                      </span>
                      <span className="ml-2 text-[1em] text-green-500 font-medium tracking-wider">
                        km/h
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Weather Details - matching original implementation */}
              <div className="mt-2 w-full">
                {/* First line: Feels like and humidity */}
                {(getWeatherFeelsLike() || getWeatherHumidity()) && (
                  <div className="text-center text-[0.95em] text-gray-300 mb-1">
                    {[
                      getWeatherFeelsLike() &&
                        `Feels like: ${getWeatherFeelsLike()}`,
                      getWeatherHumidity() &&
                        `Humidity: ${getWeatherHumidity()}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}

                {/* Second line: Wind and UV Index */}
                {(getWeatherWind() || getWeatherUvi()) && (
                  <div className="text-center text-[0.95em] text-gray-300">
                    {[
                      getWeatherWind() && `Wind: ${getWeatherWind()}`,
                      getWeatherUvi() && (
                        <span key="uvi">
                          UV Index:{' '}
                          <span
                            className={`${getUviClass(parseFloat(getWeatherUvi()!))} font-mono`}
                          >
                            {getWeatherUvi()}
                          </span>
                        </span>
                      ),
                    ]
                      .filter(Boolean)
                      .map((item, index, array) => (
                        <span key={index}>
                          {item}
                          {index < array.length - 1 && ' · '}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Time Section - Conditionally rendered */}
          {urlParams.showTime && (
            <div className="flex items-center gap-[18px] text-[1.1em] text-gray-300 w-full justify-center">
              <span className="text-[1.1em] text-gray-300 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {dateStr}
              </span>
              <span className="font-mono tracking-wider text-[1.1em] text-gray-300 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {timeStr}
              </span>
              <span className="text-[1.1em] text-gray-300 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {tzStr}
              </span>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
