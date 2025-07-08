import { useQuery } from '@tanstack/react-query';
import type { WeatherResponse } from '../types/weather';
import { fetchWeatherData } from '../utils/weatherService';

/**
 * Fetch weather data with multiple fallback strategies
 */
async function fetchWeather(
  lat: number,
  lon: number,
  units: string = 'metric'
): Promise<WeatherResponse> {
  return fetchWeatherData(lat, lon, units);
}

/**
 * Custom hook for weather data with React Query caching
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @param units - Temperature units ('metric', 'imperial', 'standard')
 */
export function useWeatherData(
  lat?: number,
  lon?: number,
  units: string = 'metric'
) {
  // Round coordinates to prevent cache busting from tiny GPS variations
  // 0.01 degrees ≈ 1.1km, which is reasonable for weather accuracy
  const roundedLat = lat ? Math.round(lat * 100) / 100 : undefined;
  const roundedLon = lon ? Math.round(lon * 100) / 100 : undefined;

  return useQuery({
    queryKey: ['weather', roundedLat, roundedLon, units],
    queryFn: () => {
      if (
        !lat ||
        !lon ||
        !isFinite(lat) ||
        !isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        throw new Error('Invalid coordinates for weather fetch');
      }
      return fetchWeather(lat, lon, units);
    },
    enabled: Boolean(
      lat &&
        lon &&
        isFinite(lat) &&
        isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    ),
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (bad coordinates, missing API key)
      if (error.message.includes('400') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Get appropriate weather icon from OpenWeatherMap
 */
export function getWeatherIconUrl(
  iconCode: string,
  size: '2x' | '4x' = '2x'
): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

/**
 * Format temperature with unit
 */
export function formatTemperature(
  temp: number,
  units: string = 'metric'
): string {
  const rounded = Math.round(temp);
  switch (units) {
    case 'imperial':
      return `${rounded}°F`;
    case 'kelvin':
      return `${rounded}K`;
    default:
      return `${rounded}°C`;
  }
}
