import { logger } from './logger';

export interface Coordinates {
  lat: number;
  lon: number;
}

interface CachedLocation {
  locationText: string;
  timestamp: number;
}

interface GeocodeProvider {
  name: string;
  geocode: (coordinates: Coordinates) => Promise<string>;
}

// OpenCage API response interfaces
interface OpenCageComponents {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  district?: string;
  borough?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  _normalized_city?: string;
  state?: string;
  state_code?: string;
  country?: string;
  country_code?: string;
  continent?: string;
  _category?: string;
  _type?: string;
}

interface OpenCageResult {
  components: OpenCageComponents;
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
  confidence: number;
}

interface OpenCageResponse {
  results: OpenCageResult[];
  status: {
    code: number;
    message: string;
  };
  rate?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

// Legacy Nominatim interfaces (kept as fallback)
interface NominatimAddress {
  district?: string;
  borough?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  country?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

class LocationService {
  private cache = new Map<string, CachedLocation>();
  private requestQueue = new Set<string>();
  private pendingRequests = new Map<string, Promise<string>>();

  // Configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_RADIUS = 100; // meters
  private readonly REQUEST_TIMEOUT = 3000; // 3 seconds
  private readonly RETRY_DELAY = 500; // 0.5 seconds between retries

  /**
   * Generate cache key based on coordinates with radius-based zones
   * This creates cache zones of ~100m to reduce API calls for nearby locations
   */
  private getCacheKey(coordinates: Coordinates): string {
    const radiusInDegrees = this.CACHE_RADIUS / 111000; // Convert meters to degrees
    const latKey = Math.round(coordinates.lat / radiusInDegrees) * radiusInDegrees;
    const lonKey = Math.round(coordinates.lon / radiusInDegrees) * radiusInDegrees;
    return `${latKey.toFixed(5)},${lonKey.toFixed(5)}`;
  }

  /**
   * Check if cached result is still valid
   */
  private getCachedResult(coordinates: Coordinates): string | null {
    const cacheKey = this.getCacheKey(coordinates);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.locationText;
    }

    return null;
  }

  /**
   * Cache a successful geocoding result
   */
  private setCachedResult(coordinates: Coordinates, locationText: string): void {
    const cacheKey = this.getCacheKey(coordinates);
    this.cache.set(cacheKey, {
      locationText,
      timestamp: Date.now(),
    });

    // Clean old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanOldCacheEntries();
    }
  }

  /**
   * Remove expired cache entries
   */
  private cleanOldCacheEntries(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Create a timeout promise that rejects after specified milliseconds
   */
  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * OpenCage geocoding provider (primary)
   */
  private async geocodeOpenCage(coordinates: Coordinates): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;

    if (!apiKey) {
      throw new Error('OpenCage API key not configured');
    }

    const query = `${coordinates.lat},${coordinates.lon}`;
    const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${encodeURIComponent(query)}&no_annotations=1&language=en&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'trip-overlay-dashboard/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenCage API error: ${response.status}`);
    }

    const data: OpenCageResponse = await response.json();

    if (data.status.code !== 200) {
      throw new Error(`OpenCage API error: ${data.status.message}`);
    }

    return this.extractLocationFromOpenCage(data);
  }

  /**
   * Extract location text from OpenCage response
   */
  private extractLocationFromOpenCage(data: OpenCageResponse): string {
    if (!data.results || data.results.length === 0) {
      throw new Error('No results in OpenCage response');
    }

    const result = data.results[0];
    const { components } = result;

    // Build location string with priority order: "District, City, Country"
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

    // Add district if it's different from city and not too generic
    if (district && district !== city && !this.isGenericDistrict(district)) {
      locationParts.push(district);
    }

    if (city) {
      locationParts.push(city);
    }

    if (country) {
      locationParts.push(country);
    }

    if (locationParts.length === 0) {
      // Fallback to formatted address if no components available
      return result.formatted;
    }

    return locationParts.join(', ');
  }

  /**
   * Check if district name is too generic to be useful
   */
  private isGenericDistrict(district: string): boolean {
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

  /**
   * OpenStreetMap Nominatim geocoding provider (fallback)
   */
  private async geocodeNominatim(coordinates: Coordinates): Promise<string> {
    logger(`[LocationService] Nominatim: Requesting geocode for ${coordinates.lat}, ${coordinates.lon}`);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lon}&zoom=14&addressdetails=1`;
    logger(`[LocationService] Nominatim: URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'trip-overlay-dashboard/1.0',
      },
    });

    logger(`[LocationService] Nominatim: Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }

    const data: NominatimResponse = await response.json();
    logger(`[LocationService] Nominatim: Response data:`, data);

    const result = this.extractLocationFromNominatim(data);
    logger(`[LocationService] Nominatim: Extracted location: ${result}`);

    return result;
  }

  /**
   * Extract location text from Nominatim response
   */
  private extractLocationFromNominatim(data: NominatimResponse): string {
    logger(`[LocationService] Nominatim: Extracting location from:`, data);

    const { address } = data;
    if (!address) {
      logger.error('[LocationService] Nominatim: No address data in response');
      throw new Error('No address data in response');
    }

    logger(`[LocationService] Nominatim: Address components:`, address);

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

    logger(`[LocationService] Nominatim: Parsed components - district: ${district}, city: ${city}, country: ${country}`);

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

    logger(`[LocationService] Nominatim: Location parts: [${locationParts.join(', ')}]`);

    if (locationParts.length === 0) {
      logger.error('[LocationService] Nominatim: No valid location parts found');
      throw new Error('No valid location parts found');
    }

    return locationParts.join(', ');
  }

  /**
   * Backup geocoding provider using a fallback coordinate display
   */
  private async geocodeFallback(coordinates: Coordinates): Promise<string> {
    // Return formatted coordinates as fallback
    return `${coordinates.lat.toFixed(3)}, ${coordinates.lon.toFixed(3)}`;
  }

  /**
   * Get all available geocoding providers in order of preference
   */
  private getProviders(): GeocodeProvider[] {
    const providers: GeocodeProvider[] = [];

    // Primary: OpenCage (if API key is configured)
    if (import.meta.env.VITE_OPENCAGE_API_KEY) {
      providers.push({
        name: 'OpenCage',
        geocode: (coords) => this.geocodeOpenCage(coords),
      });
    }

    // Secondary: Nominatim (free fallback)
    providers.push({
      name: 'Nominatim',
      geocode: (coords) => this.geocodeNominatim(coords),
    });

    // Final fallback: Coordinates
    providers.push({
      name: 'Fallback',
      geocode: (coords) => this.geocodeFallback(coords),
    });

    return providers;
  }

  /**
   * Try multiple geocoding providers with fallback
   */
  private async tryMultipleProviders(coordinates: Coordinates): Promise<string> {
    const providers = this.getProviders();
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        logger(`[LocationService] Trying ${provider.name} provider`);

        const result = await Promise.race([
          provider.geocode(coordinates),
          this.createTimeoutPromise(this.REQUEST_TIMEOUT),
        ]);

        logger(`[LocationService] ${provider.name} provider succeeded: ${result}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger(`[LocationService] ${provider.name} provider failed:`, error);

        // Don't try fallback providers if this was a timeout
        if (error instanceof Error && error.message.includes('timeout')) {
          // Add small delay before trying next provider
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    // If all providers failed, throw the last error
    throw lastError || new Error('All geocoding providers failed');
  }

  /**
   * Main geocoding method with caching and deduplication
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    // Check cache first
    const cached = this.getCachedResult(coordinates);
    if (cached) {
      logger(`[LocationService] Cache hit: ${cached}`);
      return cached;
    }

    const requestKey = `${coordinates.lat},${coordinates.lon}`;

    // Check if there's already a pending request for these coordinates
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      logger(`[LocationService] Reusing pending request for ${requestKey}`);
      return pendingRequest;
    }

    // Create new request
    const request = this.tryMultipleProviders(coordinates)
      .then(result => {
        this.setCachedResult(coordinates, result);
        return result;
      })
      .catch(error => {
        logger(`[LocationService] All providers failed for ${requestKey}:`, error);
        // Return formatted coordinates as final fallback
        const fallback = `${coordinates.lat.toFixed(3)}, ${coordinates.lon.toFixed(3)}`;
        this.setCachedResult(coordinates, fallback);
        return fallback;
      })
      .finally(() => {
        this.pendingRequests.delete(requestKey);
      });

    this.pendingRequests.set(requestKey, request);
    return request;
  }

  /**
   * Debug method to check location service configuration and test geocoding
   */
  async debug(coordinates?: Coordinates): Promise<void> {
    const testCoords = coordinates || { lat: 48.2082, lon: 16.3738 }; // Vienna

    logger('[LocationService] === DEBUG INFO ===');
    logger(`[LocationService] OpenCage API Key configured: ${!!import.meta.env.VITE_OPENCAGE_API_KEY}`);
    logger(`[LocationService] Cache size: ${this.cache.size} entries`);
    logger(`[LocationService] Pending requests: ${this.pendingRequests.size}`);

    const providers = this.getProviders();
    logger(`[LocationService] Available providers: ${providers.map(p => p.name).join(', ')}`);

    logger(`[LocationService] Testing geocoding for ${testCoords.lat}, ${testCoords.lon}...`);

    try {
      const result = await this.reverseGeocode(testCoords);
      logger(`[LocationService] ✅ Test successful: ${result}`);
    } catch (error) {
      logger(`[LocationService] ❌ Test failed:`, error);
    }

    logger('[LocationService] === END DEBUG ===');
  }

  /**
   * Clear all cached results (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    logger('[LocationService] Cache cleared');
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const locationService = new LocationService();
