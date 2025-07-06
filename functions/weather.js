// functions/weather.js

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const units = url.searchParams.get('units') || 'metric';

  if (!lat || !lon) {
    const errorResponse = { error: 'Missing "lat" or "lon" query parameters' };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = context.env.OWM_API_KEY;
  if (!apiKey) {
    const errorResponse = {
      error: 'API key not configured on server.',
      message:
        'Ensure OWM_API_KEY is set in .dev.vars for local development or in Cloudflare Pages secrets for production.',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely,alerts&appid=${apiKey}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenWeatherMap API Error: ${errorText}`);
      const errorResponse = {
        error: 'OpenWeatherMap API Error',
        status: response.status,
        statusText: response.statusText,
        message: errorText,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy function fetch failed:', error);
    const errorResponse = {
      error: 'Failed to execute fetch in the proxy function.',
      message: error.message,
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
