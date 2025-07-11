// functions/geocode.js

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  if (!lat || !lon) {
    const errorResponse = { error: 'Missing "lat" or "lon" query parameters' };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Try OpenCage first if API key is available
  const openCageKey = context.env.OPENCAGE_API_KEY;
  if (openCageKey) {
    try {
      const query = `${lat},${lon}`;
      const apiUrl = `https://api.opencagedata.com/geocode/v1/json?key=${openCageKey}&q=${encodeURIComponent(query)}&no_annotations=1&language=en&limit=1`;

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'trip-overlay-dashboard/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status.code === 200 && data.results.length > 0) {
          const result = data.results[0];
          const { components } = result;

          // Extract location (same logic as client)
          const district =
            components.district ||
            components.borough ||
            components.neighbourhood ||
            components.suburb ||
            components.quarter ||
            components.city_district;

          const city =
            components._normalized_city ||
            components.city ||
            components.town ||
            components.village ||
            components.municipality;

          const { country } = components;

          const locationParts = [];
          if (district && district !== city && !isGenericDistrict(district)) {
            locationParts.push(district);
          }
          if (city) {
            locationParts.push(city);
          }
          if (country) {
            locationParts.push(country);
          }

          const locationText =
            locationParts.length > 0
              ? locationParts.join(', ')
              : result.formatted;

          return new Response(
            JSON.stringify({
              location: locationText,
              provider: 'OpenCage',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } catch (error) {
      console.error('OpenCage API error:', error);
      // Fall through to Nominatim
    }
  }

  // Fallback to Nominatim (free, no API key required)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'trip-overlay-dashboard/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    const { address } = data;

    if (!address) {
      throw new Error('No address data in response');
    }

    // Extract location (same logic as client)
    const district =
      address.district ||
      address.borough ||
      address.neighbourhood ||
      address.suburb ||
      address.quarter ||
      address.city_district;

    const city =
      address.city || address.town || address.village || address.municipality;

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

    if (locationParts.length === 0) {
      throw new Error('No valid location parts found');
    }

    return new Response(
      JSON.stringify({
        location: locationParts.join(', '),
        provider: 'Nominatim',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Geocoding failed:', error);

    // Final fallback: return coordinates
    return new Response(
      JSON.stringify({
        location: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
        provider: 'Coordinates',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Helper function to check generic district names
function isGenericDistrict(district) {
  const genericTerms = [
    'district',
    'area',
    'region',
    'zone',
    'sector',
    'division',
    'administrative',
  ];

  const lowerDistrict = district.toLowerCase();
  return genericTerms.some(term => lowerDistrict.includes(term));
}
