import React, { useEffect, useState } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { useConnectionStore } from './store/connectionStore';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useRtirlSocket } from './hooks/useRtirlSocket';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';


// Using modern Tailwind CSS + shadcn/ui instead of original CSS files

/**
 * Dashboard Component for Live Streaming
 * Displays location, weather, time, and speed information
 * Now using modern Tailwind CSS + shadcn/ui components
 */
const Dashboard: React.FC = () => {
  // Use centralized app initialization
  useAppInitialization();
  
  // Connect to RTIRL (with deduplication protection)
  const { isConnected: rtirlConnected } = useRtirlSocket();
  
  // Get GPS coordinates from connection store
  const { lastPosition, isConnected } = useConnectionStore();
  const { data: weatherData, isLoading: weatherLoading } = useWeatherData(
    lastPosition?.lat, 
    lastPosition?.lon
  );
  
  // Time state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationText, setLocationText] = useState('--');
  const [speedMph, setSpeedMph] = useState('--');
  const [speedKmh, setSpeedKmh] = useState('--');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lon: number) => {
    if (isReverseGeocoding) return; // Prevent duplicate requests
    
    setIsReverseGeocoding(true);
    try {
      // Use OpenStreetMap Nominatim for free reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'trip-overlay-dashboard/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        
        // Build location string: "District, City, Country" or "City, Country"
        const district = address.district || 
          address.borough || 
          address.neighbourhood || 
          address.suburb || 
          address.quarter || 
          address.city_district;

        const city = address.city || 
          address.town || 
          address.village || 
          address.municipality;

        const country = address.country;

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

        const locationName = locationParts.filter(Boolean).length > 0 
          ? locationParts.filter(Boolean).join(', ')
          : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          
        setLocationText(locationName);
      } else {
        // Fallback to coordinates if geocoding fails
        setLocationText(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
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
      if (locationData) {
        // Update speed
        const speedKmh = locationData.speed || 0;
        const speedMph = speedKmh * 0.621371;
        setCurrentSpeed(speedKmh);
        setSpeedKmh(speedKmh.toFixed(1));
        setSpeedMph(speedMph.toFixed(1));
        
        // Update location with reverse geocoding
        if (locationData.latitude && locationData.longitude) {
          reverseGeocode(locationData.latitude, locationData.longitude);
        }
      }
    };

    window.addEventListener('locationUpdate', handleLocationUpdate as EventListener);
    return () => window.removeEventListener('locationUpdate', handleLocationUpdate as EventListener);
  }, [isReverseGeocoding]);

  // Debug weather data loading
  useEffect(() => {
    if (lastPosition) {
      console.log('🌤️ Dashboard: Weather coordinates available:', lastPosition.lat, lastPosition.lon);
    }
    if (weatherLoading) {
      console.log('🌤️ Dashboard: Weather loading...');
    }
    if (weatherData) {
      console.log('🌤️ Dashboard: Weather data received:', weatherData);
      if (weatherData.timezone) {
        console.log(`🕒 Dashboard: Using weather timezone: ${weatherData.timezone} (UTC${weatherData.timezone_offset >= 0 ? '+' : ''}${weatherData.timezone_offset / 3600})`);
      }
    }
  }, [lastPosition, weatherLoading, weatherData]);

  // Console API is initialized by useAppInitialization hook

  // Format time exactly like original (24-hour format preferred by user)
  const formatTime = () => {
    // Use weather timezone if available, otherwise fall back to system timezone
    const weatherTimezone = weatherData?.timezone;
    const timeZone = weatherTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const timeStr = currentTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: timeZone
    });
    
    // Format date as "Mon, Jul 7, 2024"
    const dateStr = currentTime.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      timeZone: timeZone
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

  // Weather display helpers
  const getWeatherIcon = () => {
    if (!weatherData?.current?.weather?.[0]) return '🌤️';
    const iconCode = weatherData.current.weather[0].icon;
    
    // Map OpenWeather icons to emojis (simplified)
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️', 
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    
    return iconMap[iconCode] || '🌤️';
  };

  const getWeatherTemp = () => {
    if (!weatherData?.current?.temp) return '--°';
    return `${Math.round(weatherData.current.temp)}°`;
  };

  const getWeatherDesc = () => {
    if (weatherLoading) return 'Loading...';
    if (!weatherData?.current?.weather?.[0]) return 'No weather data';
    return weatherData.current.weather[0].description;
  };

  const getWeatherHighLow = () => {
    if (!weatherData?.daily?.[0]) return '--° / --°';
    const high = Math.round(weatherData.daily[0].temp.max);
    const low = Math.round(weatherData.daily[0].temp.min);
    return `${high}° / ${low}°`;
  };

  const getWeatherFeelsLike = () => {
    if (!weatherData?.current?.feels_like) return null;
    return `${Math.round(weatherData.current.feels_like)}°`;
  };

  const getWeatherHumidity = () => {
    if (!weatherData?.current?.humidity) return null;
    return `${weatherData.current.humidity}%`;
  };

  const getWeatherWind = () => {
    if (!weatherData?.current?.wind_speed) return null;
    const windSpeed = (weatherData.current.wind_speed * 3.6).toFixed(1); // Convert m/s to km/h
    let wind = `${windSpeed} km/h`;
    
    if (weatherData.current.wind_deg !== undefined) {
      const direction = degToCompass(weatherData.current.wind_deg);
      wind += ` ${direction}`;
    }
    return wind;
  };

  const getWeatherUvi = () => {
    if (weatherData?.current?.uvi === undefined) return null;
    return weatherData.current.uvi.toFixed(1);
  };

  const getUviClass = (uvi: number) => {
    if (uvi <= 2) return 'text-green-400';
    if (uvi <= 5) return 'text-yellow-400';
    if (uvi <= 7) return 'text-orange-400';
    if (uvi <= 10) return 'text-red-400';
    return 'text-purple-400';
  };

  const degToCompass = (deg: number) => {
    const val = Math.floor(deg / 22.5 + 0.5);
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[val % 16];
  };

  // Show connection status in location when no GPS
  const getLocationText = () => {
    if (locationText !== '--') return locationText;
    if (isConnected && lastPosition) return 'GPS Connected';
    if (rtirlConnected) return 'RTIRL Connected';
    return 'Waiting for GPS...';
  };

  return (
    <>
      {/* Main Dashboard Container - Right-aligned professional layout */}
      <div className="w-screen h-screen flex flex-col items-end justify-start gap-[18px] pr-[18px] pt-[18px] pointer-events-none">
        
        {/* Combined Dashboard Card - Solid readable design for streaming */}
        <Card className="flex flex-col items-center bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/20 rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] min-w-[320px] max-w-[420px] backdrop-blur-none">
          
          {/* Location Section */}
          <div className="mb-3 w-full text-center">
            <div className="text-[1.5em] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] break-words">
              {getLocationText()}
            </div>
          </div>

          {/* Weather Section */}
          <div className="mb-3 w-full">
            <div className="flex items-center justify-center">
              {/* Weather Icon */}
              <div className="text-[2.2em] flex items-center leading-none mr-1 font-emoji">
                {getWeatherIcon()}
              </div>
              
              {/* Temperature Container */}
              <div className="flex flex-col items-center gap-0.5 mx-3">
                <div className="text-[1.4em] font-extrabold text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-inter">
                  {getWeatherTemp()}
                </div>
                <div className="text-[1em] text-white mt-1 font-semibold tracking-wider drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-inter whitespace-nowrap">
                  {getWeatherHighLow()}
                </div>
              </div>
              
              {/* Weather Description */}
              <div className="text-[1.1em] text-gray-200 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] capitalize ml-3">
                {getWeatherDesc()}
              </div>
              
              {/* Speed Display */}
              <div className="flex flex-col items-start ml-2 font-semibold">
                <div className="flex justify-start items-baseline w-full text-[1.2em] font-bold text-green-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-mono tracking-wider">
                  <span className="text-center min-w-[3.5em]">{speedMph}</span>
                  <span className="ml-2 text-[1em] text-green-500 font-medium tracking-wider">mph</span>
                </div>
                <div className="flex justify-start items-baseline w-full text-[1.2em] font-bold text-green-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-mono tracking-wider">
                  <span className="text-center min-w-[3.5em]">{speedKmh}</span>
                  <span className="ml-2 text-[1em] text-green-500 font-medium tracking-wider">km/h</span>
                </div>
              </div>
            </div>

            {/* Additional Weather Details - matching original implementation */}
            <div className="mt-2 w-full">
              {/* First line: Feels like and humidity */}
              {(getWeatherFeelsLike() || getWeatherHumidity()) && (
                <div className="text-center text-[0.95em] text-gray-300 mb-1">
                  {[
                    getWeatherFeelsLike() && `Feels like: ${getWeatherFeelsLike()}`,
                    getWeatherHumidity() && `Humidity: ${getWeatherHumidity()}`
                  ].filter(Boolean).join(' · ')}
                </div>
              )}

              {/* Second line: Wind and UV Index */}
              {(getWeatherWind() || getWeatherUvi()) && (
                <div className="text-center text-[0.95em] text-gray-300">
                  {[
                    getWeatherWind() && `Wind: ${getWeatherWind()}`,
                    getWeatherUvi() && (
                      <span key="uvi">
                        UV Index: <span className={`${getUviClass(parseFloat(getWeatherUvi()!))} font-mono`}>{getWeatherUvi()}</span>
                      </span>
                    )
                  ].filter(Boolean).map((item, index, array) => (
                    <span key={index}>
                      {item}
                      {index < array.length - 1 && ' · '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time Section */}
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
          
        </Card>
      </div>
    </>
  );
};

export default Dashboard; 