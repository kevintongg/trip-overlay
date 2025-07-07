// functions/weather.ts
// Enhanced TypeScript weather proxy function with improved validation and error handling

interface CloudflareEnv {
  OWM_API_KEY: string;
}

interface WeatherRequestContext {
  request: Request;
  env: CloudflareEnv;
}

interface WeatherErrorResponse {
  error: string;
  message?: string;
  status?: number;
  statusText?: string;
}

interface OpenWeatherMapResponse {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    uvi: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind_speed: number;
    wind_deg: number;
  };
  daily: Array<{
    temp: { min: number; max: number };
    weather: Array<{ icon: string; description: string }>;
  }>;
  hourly: Array<{
    dt: number;
    temp: number;
    weather: Array<{ icon: string; description: string }>;
  }>;
}

/**
 * Validates latitude and longitude coordinates
 */
function validateCoordinates(
  lat: string,
  lon: string
): { isValid: boolean; error?: string } {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return {
      isValid: false,
      error: 'Latitude and longitude must be valid numbers',
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      isValid: false,
      error: 'Latitude must be between -90 and 90 degrees',
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      error: 'Longitude must be between -180 and 180 degrees',
    };
  }

  return { isValid: true };
}

/**
 * Validates units parameter
 */
function validateUnits(units: string): { isValid: boolean; error?: string } {
  const validUnits = ['metric', 'imperial', 'standard'];

  if (!validUnits.includes(units)) {
    return {
      isValid: false,
      error: `Units must be one of: ${validUnits.join(', ')}. Got: ${units}`,
    };
  }

  return { isValid: true };
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(
  error: string,
  status: number = 400,
  message?: string
): Response {
  const errorResponse: WeatherErrorResponse = { error, message };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Main weather proxy function with enhanced TypeScript validation
 */
export async function onRequest(
  context: WeatherRequestContext
): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const units = url.searchParams.get('units') || 'metric';

    // Validate required parameters
    if (!lat || !lon) {
      return createErrorResponse(
        'Missing required parameters',
        400,
        'Both "lat" and "lon" query parameters are required'
      );
    }

    // Validate coordinate format and ranges
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.isValid) {
      return createErrorResponse(
        'Invalid coordinates',
        400,
        coordValidation.error
      );
    }

    // Validate units parameter
    const unitsValidation = validateUnits(units);
    if (!unitsValidation.isValid) {
      return createErrorResponse(
        'Invalid units parameter',
        400,
        unitsValidation.error
      );
    }

    // Check API key configuration
    const apiKey = context.env.OWM_API_KEY;
    if (!apiKey) {
      return createErrorResponse(
        'API key not configured',
        500,
        'OpenWeatherMap API key is not set. Ensure OWM_API_KEY is configured in environment variables.'
      );
    }

    // Construct OpenWeatherMap API URL
    const apiUrl = new URL('https://api.openweathermap.org/data/3.0/onecall');
    apiUrl.searchParams.set('lat', lat);
    apiUrl.searchParams.set('lon', lon);
    apiUrl.searchParams.set('units', units);
    apiUrl.searchParams.set('exclude', 'minutely,alerts');
    apiUrl.searchParams.set('appid', apiKey);

    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(apiUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'trip-overlay-weather-proxy/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `OpenWeatherMap API returned ${response.status}`;

        try {
          const errorText = await response.text();
          console.error(
            `OpenWeatherMap API Error: ${response.status} - ${errorText}`
          );
          errorMessage = errorText || errorMessage;
        } catch {
          // If we can't read the error response, use the status
          console.error(
            `OpenWeatherMap API Error: ${response.status} ${response.statusText}`
          );
        }

        return createErrorResponse(
          'OpenWeatherMap API Error',
          response.status,
          errorMessage
        );
      }

      // Parse and validate response
      const data: OpenWeatherMapResponse = await response.json();

      // Basic validation of response structure
      if (!data.current || !data.daily || !data.hourly) {
        return createErrorResponse(
          'Invalid API response',
          500,
          'OpenWeatherMap API returned unexpected data structure'
        );
      }

      // Return successful response with caching headers
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
          'X-Weather-Source': 'openweathermap-onecall-3.0',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.error('Weather API request timeout');
          return createErrorResponse(
            'Request timeout',
            504,
            'OpenWeatherMap API request timed out after 10 seconds'
          );
        }

        console.error('Weather API fetch failed:', fetchError.message);
        return createErrorResponse(
          'Fetch error',
          500,
          `Failed to fetch weather data: ${fetchError.message}`
        );
      }

      console.error('Unknown fetch error:', fetchError);
      return createErrorResponse(
        'Unknown error',
        500,
        'An unknown error occurred while fetching weather data'
      );
    }
  } catch (error) {
    // Catch any unexpected errors in the function
    console.error('Weather function error:', error);

    return createErrorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}
