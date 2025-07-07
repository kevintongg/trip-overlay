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

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
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

  // Get proper timezone based on coordinates with DST support
  let timezone = 'UTC';
  let timezoneOffset = 0;

  // Map coordinates to likely timezone (accounting for DST)
  if (lon >= -10 && lon <= 40 && lat >= 35 && lat <= 70) {
    // Europe
    if (lon >= 5 && lon <= 25) {
      timezone = 'Europe/Vienna'; // Central Europe (includes CEST in summer)
      // Get current offset for Vienna timezone (accounts for CEST automatically)
      const now = new Date();
      const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      const viennaTime = new Date(
        utc.toLocaleString('en-US', { timeZone: 'Europe/Vienna' })
      );
      timezoneOffset = (viennaTime.getTime() - utc.getTime()) / 1000;
    } else if (lon >= -5 && lon <= 5) {
      timezone = 'Europe/London';
      // Similar calculation for London (BST in summer)
      const now = new Date();
      const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      const londonTime = new Date(
        utc.toLocaleString('en-US', { timeZone: 'Europe/London' })
      );
      timezoneOffset = (londonTime.getTime() - utc.getTime()) / 1000;
    }
  } else if (lon >= -130 && lon <= -60 && lat >= 25 && lat <= 70) {
    // North America
    timezone = 'America/New_York';
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const nyTime = new Date(
      utc.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );
    timezoneOffset = (nyTime.getTime() - utc.getTime()) / 1000;
  } else {
    // Fallback: simple longitude-based offset (no DST)
    timezoneOffset = Math.round(lon / 15) * 3600;
  }

  return {
    current: {
      temp: currentTemp,
      feels_like: currentTemp + (Math.random() - 0.5) * 5,
      humidity: Math.round(20 + Math.random() * 65),
      uvi: Math.random() * 10,
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
    const response = await fetch(
      `/functions/weather?lat=${lat}&lon=${lon}&units=${units}`
    );
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
  } catch (error) {
    console.warn('⚠️ Weather: Cloudflare function error:', error);
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
