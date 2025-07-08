#!/usr/bin/env node

/**
 * Local Development Function Server
 *
 * Simple Node.js server that simulates Cloudflare Functions for local development.
 * Run with: node dev-functions.js
 *
 * Environment variables needed:
 * - OWM_API_KEY: OpenWeatherMap API key
 * - OPENCAGE_API_KEY: OpenCage API key (optional)
 */

const http = require('http');
const { URL } = require('url');

// Load environment variables from .env.local or .dev.vars if available
try {
  const dotenv = require('dotenv');

  // Try to load .dev.vars first (Cloudflare style)
  if (require('fs').existsSync('.dev.vars')) {
    dotenv.config({ path: '.dev.vars' });
    console.log('📁 Loaded environment from .dev.vars');
  } else if (require('fs').existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
    console.log('📁 Loaded environment from .env.local');
  }
} catch (error) {
  console.warn('⚠️  dotenv not available, using system environment variables');
}

const PORT = process.env.FUNCTIONS_PORT || 8787;

// Weather function handler
async function handleWeather(url) {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const units = url.searchParams.get('units') || 'metric';

  if (!lat || !lon) {
    return {
      status: 400,
      body: JSON.stringify({ error: 'Missing "lat" or "lon" query parameters' })
    };
  }

  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    return {
      status: 500,
      body: JSON.stringify({
        error: 'API key not configured on server.',
        message: 'Ensure OWM_API_KEY is set in .dev.vars or environment variables for local development.'
      })
    };
  }

  try {
    const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely,alerts&appid=${apiKey}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: response.status,
        body: JSON.stringify({
          error: 'OpenWeatherMap API Error',
          status: response.status,
          statusText: response.statusText,
          message: errorText,
        })
      };
    }

    const data = await response.json();
    return {
      status: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to execute fetch in the proxy function.',
        message: error.message,
      })
    };
  }
}

// Geocode function handler
async function handleGeocode(url) {
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  if (!lat || !lon) {
    return {
      status: 400,
      body: JSON.stringify({ error: 'Missing "lat" or "lon" query parameters' })
    };
  }

  // Try OpenCage first if API key is available
  const openCageKey = process.env.OPENCAGE_API_KEY;
  if (openCageKey) {
    try {
      const query = `${lat},${lon}`;
      const apiUrl = `https://api.opencagedata.com/geocode/v1/json?key=${openCageKey}&q=${encodeURIComponent(query)}&no_annotations=1&language=en&limit=1`;

      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'trip-overlay-dashboard/1.0' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status.code === 200 && data.results.length > 0) {
          const result = data.results[0];
          const { components } = result;

          // Extract location (same logic as server function)
          const district = components.district || components.borough || components.neighbourhood ||
                          components.suburb || components.quarter || components.city_district;
          const city = components._normalized_city || components.city || components.town ||
                      components.village || components.municipality;
          const { country } = components;

          const locationParts = [];
          const isGenericDistrict = (d) => {
            const genericTerms = ['district', 'area', 'region', 'zone', 'sector', 'division', 'administrative'];
            return genericTerms.some(term => d.toLowerCase().includes(term));
          };

          if (district && district !== city && !isGenericDistrict(district)) {
            locationParts.push(district);
          }
          if (city) locationParts.push(city);
          if (country) locationParts.push(country);

          const locationText = locationParts.length > 0 ? locationParts.join(', ') : result.formatted;

          return {
            status: 200,
            body: JSON.stringify({ location: locationText, provider: 'OpenCage' })
          };
        }
      }
    } catch (error) {
      console.error('OpenCage API error:', error);
      // Fall through to Nominatim
    }
  }

  // Fallback to Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'trip-overlay-dashboard/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    const { address } = data;

    if (!address) {
      throw new Error('No address data in response');
    }

    // Extract location
    const district = address.district || address.borough || address.neighbourhood ||
                    address.suburb || address.quarter || address.city_district;
    const city = address.city || address.town || address.village || address.municipality;
    const { country } = address;

    const locationParts = [];
    if (district && district !== city) locationParts.push(district);
    if (city) locationParts.push(city);
    if (country) locationParts.push(country);

    if (locationParts.length === 0) {
      throw new Error('No valid location parts found');
    }

    return {
      status: 200,
      body: JSON.stringify({ location: locationParts.join(', '), provider: 'Nominatim' })
    };
  } catch (error) {
    console.error('Geocoding failed:', error);

    // Final fallback: return coordinates
    return {
      status: 200,
      body: JSON.stringify({
        location: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
        provider: 'Coordinates'
      })
    };
  }
}

// Create server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let result;

  try {
    if (url.pathname === '/weather') {
      result = await handleWeather(url);
    } else if (url.pathname === '/geocode') {
      result = await handleGeocode(url);
    } else {
      result = {
        status: 404,
        body: JSON.stringify({ error: 'Not found', available: ['/weather', '/geocode'] })
      };
    }
  } catch (error) {
    result = {
      status: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }

  res.writeHead(result.status);
  res.end(result.body);
});

server.listen(PORT, () => {
  console.log(`🚀 Local function server running on http://localhost:${PORT}`);
  console.log(`📍 Available endpoints:`);
  console.log(`   • http://localhost:${PORT}/weather?lat=40.7128&lon=-74.0060&units=metric`);
  console.log(`   • http://localhost:${PORT}/geocode?lat=40.7128&lon=-74.0060`);
  console.log('');
  console.log('🔧 Environment check:');
  console.log(`   • OWM_API_KEY: ${process.env.OWM_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   • OPENCAGE_API_KEY: ${process.env.OPENCAGE_API_KEY ? '✅ Set' : '⚠️  Missing (will use Nominatim)'}`);
  console.log('');
  console.log('💡 To use with Vite dev server, uncomment proxy lines in vite.config.ts');
});
