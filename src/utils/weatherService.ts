import type { WeatherResponse } from '../types/weather';
import { apiMonitor } from './apiMonitor';

/**
 * Direct OpenWeatherMap API call (requires API key in frontend)
 * This is a fallback if the Cloudflare function is not working
 */
async function fetchWeatherDirect(
  lat: number,
  lon: number,
  units: string = 'metric'
): Promise<WeatherResponse> {
  // This would require exposing the API key in frontend - not recommended for production
  // but useful for testing
  const apiKey = import.meta.env.VITE_OWM_API_KEY;

  if (!apiKey) {
    throw new Error('Weather API key not configured');
  }

  const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely,alerts&appid=${apiKey}`;

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Weather API request timed out');
    }
    throw error;
  }
}

/**
 * Generate mock weather data for testing when API is not available
 */
function generateMockWeather(lat: number, lon: number): WeatherResponse {
  const isNorthern = lat > 0;
  const isSummer = new Date().getMonth() >= 5 && new Date().getMonth() <= 7;

  // Base temperature on location and season
  let baseTemp: number;
  if (isNorthern) {
    baseTemp = isSummer ? 24 : 8;
  } else {
    baseTemp = isSummer ? 12 : 22;
  }

  const currentTemp = baseTemp + (Math.random() - 0.5) * 10;

  const weatherConditions = [
    { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
    { id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' },
    { id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' },
    { id: 500, main: 'Rain', description: 'light rain', icon: '10d' },
    { id: 701, main: 'Mist', description: 'mist', icon: '50d' },
  ];

  const condition =
    weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

  // Calculate timezone for any coordinates (mock data)
  let timezone = 'UTC';
  let timezoneOffset = 0;

  // Calculate base timezone offset from longitude (15 degrees = 1 hour)
  const baseOffset = Math.round(lon / 15) * 3600;

  // Simple DST detection for Northern Hemisphere (roughly March-October)
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const isDSTSeason = month >= 2 && month <= 9 && lat > 0; // March-October, Northern Hemisphere only

  // Apply DST (+1 hour) if in DST season and Northern Hemisphere
  timezoneOffset = isDSTSeason ? baseOffset + 3600 : baseOffset;

  // Set appropriate timezone name for display
  if (baseOffset === 3600) {
    timezone = 'Europe/Vienna'; // Central European Time zone
  } else if (baseOffset === -28800) {
    timezone = 'America/Los_Angeles'; // Pacific Time zone
  } else if (baseOffset === 0) {
    timezone = 'Europe/London'; // GMT/UTC
  } else {
    timezone = 'UTC'; // Fallback
  }

  // Simple UV Index for mock data (real API provides accurate values)
  const hour = now.getHours();
  const uvi = hour >= 6 && hour <= 18 ? Math.random() * 5 : 0; // Basic day/night

  return {
    current: {
      temp: currentTemp,
      feels_like: currentTemp + (Math.random() - 0.5) * 5,
      humidity: Math.round(20 + Math.random() * 65),
      uvi: uvi,
      weather: [condition],
      wind_speed: Math.random() * 15,
      wind_deg: Math.random() * 360,
    },
    daily: [
      {
        temp: {
          max: currentTemp + 5 + Math.random() * 8,
          min: currentTemp - 5 - Math.random() * 8,
        },
        weather: [condition],
      },
    ],
    hourly: Array.from({ length: 24 }, (_, i) => ({
      dt: Date.now() / 1000 + i * 3600,
      temp: currentTemp + (Math.random() - 0.5) * 6,
      weather: [condition],
    })),
    timezone,
    timezone_offset: timezoneOffset,
  };
}

/**
 * Main weather fetching function with multiple fallback strategies
 */
export async function fetchWeatherData(
  lat: number,
  lon: number,
  units: string = 'metric'
): Promise<WeatherResponse> {
  console.log(`🌤️ Fetching weather for ${lat}, ${lon} (${units})`);

  // Check API usage limits before making calls
  if (!apiMonitor.canMakeApiCall()) {
    console.log('🎭 Weather: API limit reached, using mock data');
    apiMonitor.recordApiCall('mock_fallback', lat, lon, true, false);
    return generateMockWeather(lat, lon);
  }

  // Strategy 1: Try Cloudflare function first
  try {
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for Cloudflare

    const response = await fetch(
      `/weather?lat=${lat}&lon=${lon}&units=${units}`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const responseText = await response.text();

      // Check if response is JavaScript source code instead of JSON
      if (
        responseText.trim().startsWith('//') ||
        responseText.includes('function') ||
        responseText.includes('export')
      ) {
        console.warn(
          '⚠️ Weather: Cloudflare function returned source code (not deployed properly)'
        );
      } else {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ Weather: Cloudflare function success');
          apiMonitor.recordApiCall(
            'cloudflare_function',
            lat,
            lon,
            true,
            false
          );
          return data;
        } catch {
          console.warn(
            '⚠️ Weather: Cloudflare function returned invalid JSON:',
            responseText.substring(0, 100)
          );
        }
      }
    } else {
      const errorText = await response.text();
      console.warn(
        '⚠️ Weather: Cloudflare function failed:',
        response.status,
        errorText
      );
      apiMonitor.recordApiCall('cloudflare_function', lat, lon, false, false);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('⚠️ Weather: Cloudflare function timed out');
    } else {
      console.warn('⚠️ Weather: Cloudflare function error:', error);
    }
    apiMonitor.recordApiCall('cloudflare_function', lat, lon, false, false);
  }

  // Strategy 2: Try direct API call (if API key is available)
  try {
    const data = await fetchWeatherDirect(lat, lon, units);
    console.log('✅ Weather: Direct API success');
    apiMonitor.recordApiCall('direct_api', lat, lon, true, false);
    return data;
  } catch (error) {
    console.warn('⚠️ Weather: Direct API failed:', error);
    apiMonitor.recordApiCall('direct_api', lat, lon, false, false);
  }

  // Strategy 3: Use mock data as final fallback
  console.log('🎭 Weather: Using mock data (all other methods failed)');
  apiMonitor.recordApiCall('mock_fallback', lat, lon, true, false);
  return generateMockWeather(lat, lon);
}
