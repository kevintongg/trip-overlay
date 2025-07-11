/**
 * Weather Formatting Utilities
 * Extracted from original Dashboard component to maintain identical functionality
 */

import React from 'react';

// Weather icon component with React-friendly error handling
export function getWeatherIcon(weatherData: any): React.ReactElement | string {
  if (!weatherData?.current?.weather?.[0]?.icon) {
    return '🌍'; // Fallback icon when no data
  }

  const iconCode = weatherData.current.weather[0].icon;
  const { description } = weatherData.current.weather[0];

  // Emoji mapping for fallback (when image fails to load)
  const emojiMap: { [key: string]: string } = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds day
    '03n': '☁️', // scattered clouds night
    '04d': '☁️', // broken clouds day
    '04n': '☁️', // broken clouds night
    '09d': '🌧️', // shower rain day
    '09n': '🌧️', // shower rain night
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm day
    '11n': '⛈️', // thunderstorm night
    '13d': '❄️', // snow day
    '13n': '❄️', // snow night
    '50d': '🌫️', // mist day
    '50n': '🌫️', // mist night
  };

  const emojiIcon = emojiMap[iconCode] || '🌤️';

  // Create a component that handles image loading with state
  return React.createElement(WeatherIconWithFallback, {
    key: iconCode,
    iconUrl: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
    alt: description,
    fallbackEmoji: emojiIcon,
  });
}

// React component that properly handles image loading state
function WeatherIconWithFallback({ 
  iconUrl, 
  alt, 
  fallbackEmoji 
}: { 
  iconUrl: string; 
  alt: string; 
  fallbackEmoji: string; 
}) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state when iconUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [iconUrl]);

  if (imageError) {
    return React.createElement('span', {
      className: 'text-[1.8em] flex items-center leading-none mr-1 font-emoji drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]'
    }, fallbackEmoji);
  }

  return React.createElement('img', {
    src: iconUrl,
    alt: alt,
    className: 'w-[2.2em] h-[2.2em] object-contain flex-shrink-0',
    onError: () => setImageError(true),
    onLoad: () => setImageError(false),
  });
}

// Temperature formatting (extracted from original)
export function getWeatherTemp(
  weatherData: any,
  units: string = 'metric'
): string {
  if (!weatherData?.current?.temp) {
    return '--°';
  }
  const unit = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C';
  return `${weatherData.current.temp.toFixed(1)}${unit}`;
}

// High/Low temperature formatting (extracted from original)
export function getWeatherHighLow(
  weatherData: any,
  units: string = 'metric'
): string {
  if (!weatherData?.daily?.[0]) {
    return '';
  }
  const unit = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C';
  const high = weatherData.daily[0].temp.max.toFixed(1);
  const low = weatherData.daily[0].temp.min.toFixed(1);
  return `${high}${unit} / ${low}${unit}`;
}

// Weather description formatting (extracted from original)
export function getWeatherDesc(weatherData: any): string {
  if (!weatherData?.current?.weather?.[0]?.description) {
    return '';
  }
  return weatherData.current.weather[0].description;
}

// Feels like temperature (extracted from original)
export function getWeatherFeelsLike(
  weatherData: any,
  units: string = 'metric'
): string | null {
  if (weatherData?.current?.feels_like === undefined) {
    return null;
  }
  const unit = units === 'imperial' ? '°F' : units === 'standard' ? 'K' : '°C';
  return `${weatherData.current.feels_like.toFixed(1)}${unit}`;
}

// Humidity formatting (extracted from original)
export function getWeatherHumidity(weatherData: any): string | null {
  if (weatherData?.current?.humidity === undefined) {
    return null;
  }
  return `${weatherData.current.humidity.toFixed(1)}%`;
}

// Wind formatting with direction (extracted from original)
export function getWeatherWind(weatherData: any): string | null {
  if (weatherData?.current?.wind_speed === undefined) {
    return null;
  }

  const windSpeed = (weatherData.current.wind_speed * 3.6).toFixed(1); // Convert m/s to km/h
  let wind = `${windSpeed} km/h`;

  if (weatherData.current.wind_deg !== undefined) {
    const direction = degToCompass(weatherData.current.wind_deg);
    wind += ` ${direction}`;
  }

  return wind;
}

// UV Index formatting (extracted from original)
export function getWeatherUvi(weatherData: any): string | null {
  if (weatherData?.current?.uvi === undefined) {
    return null;
  }
  return weatherData.current.uvi.toFixed(1);
}

// UV Index color classification (extracted from original)
export function getUviClass(uvi: number): string {
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
}

// Compass direction conversion (extracted from original)
export function degToCompass(deg: number): string {
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
}
