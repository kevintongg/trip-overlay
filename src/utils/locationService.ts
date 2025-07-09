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

// Server response interface
interface GeocodeResponse {
  location: string;
  provider: string;
}

// Legacy interfaces for fallback Nominatim (kept for direct fallback if server fails)
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

/**
 * Location Service - Secure Geocoding with Server-Side API Key Protection
 *
 * Security Model:
 * 1. Primary: Server-side geocoding function (/geocode) - API keys protected
 * 2. Fallback: Direct Nominatim (free, no API key required)
 * 3. Final: Coordinate display
 *
 * Benefits:
 * - API keys never exposed to browser
 * - Maintains same functionality
 * - Progressive fallback strategy
 */
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
   * Generate cache key for coordinates (rounded to ~100m precision)
   */
  private getCacheKey(coordinates: Coordinates): string {
    // Round to 3 decimal places (~100m accuracy) for cache efficiency
    const lat = Math.round(coordinates.lat * 1000) / 1000;
    const lon = Math.round(coordinates.lon * 1000) / 1000;
    return `${lat},${lon}`;
  }

  /**
   * Get cached location if available and fresh
   */
  private getCachedResult(coordinates: Coordinates): string | null {
    const key = this.getCacheKey(coordinates);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      logger(`[LocationService] Cache hit for ${key}: ${cached.locationText}`);
      return cached.locationText;
    }

    if (cached) {
      logger(`[LocationService] Cache expired for ${key}, removing`);
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Store result in cache
   */
  private setCachedResult(
    coordinates: Coordinates,
    locationText: string
  ): void {
    const key = this.getCacheKey(coordinates);
    this.cache.set(key, {
      locationText,
      timestamp: Date.now(),
    });

    logger(`[LocationService] Cached result for ${key}: ${locationText}`);

    // Clean up old entries periodically
    if (this.cache.size > 100) {
      this.cleanOldCacheEntries();
    }
  }

  /**
   * Remove old cache entries
   */
  private cleanOldCacheEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    logger(`[LocationService] Cleaned ${removedCount} old cache entries`);
  }

  /**
   * Create timeout promise for race conditions
   */
  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  /**
   * Secure server-side geocoding provider (primary)
   * Uses the /geocode serverless function to keep API keys secure
   */
  private async geocodeServerSide(coordinates: Coordinates): Promise<string> {
    logger(
      `[LocationService] Server: Requesting geocode for ${coordinates.lat}, ${coordinates.lon}`
    );

    const url = `/geocode?lat=${coordinates.lat}&lon=${coordinates.lon}`;
    logger(`[LocationService] Server: URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'trip-overlay-dashboard/1.0',
      },
    });

    logger(
      `[LocationService] Server: Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      throw new Error(
        `Server geocoding error: ${response.status} ${response.statusText}`
      );
    }

    const data: GeocodeResponse = await response.json();
    logger(`[LocationService] Server: Response data:`, data);

    if (!data.location) {
      throw new Error('No location in server response');
    }

    logger(
      `[LocationService] Server: Success via ${data.provider}: ${data.location}`
    );
    return data.location;
  }

  /**
   * Direct Nominatim geocoding provider (fallback)
   * Used when server-side geocoding fails
   */
  private async geocodeNominatimDirect(
    coordinates: Coordinates
  ): Promise<string> {
    logger(
      `[LocationService] Nominatim Direct: Requesting geocode for ${coordinates.lat}, ${coordinates.lon}`
    );

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lon}&zoom=14&addressdetails=1`;
    logger(`[LocationService] Nominatim Direct: URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'trip-overlay-dashboard/1.0',
      },
    });

    logger(
      `[LocationService] Nominatim Direct: Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      throw new Error(
        `Nominatim API error: ${response.status} ${response.statusText}`
      );
    }

    const data: NominatimResponse = await response.json();
    logger(`[LocationService] Nominatim Direct: Response data:`, data);

    const result = this.extractLocationFromNominatim(data);
    logger(`[LocationService] Nominatim Direct: Extracted location: ${result}`);

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
      address.city || address.town || address.village || address.municipality;

    const { country } = address;

    logger(
      `[LocationService] Nominatim: Parsed components - district: ${district}, city: ${city}, country: ${country}`
    );

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

    logger(
      `[LocationService] Nominatim: Location parts: [${locationParts.join(', ')}]`
    );

    if (locationParts.length === 0) {
      logger.error(
        '[LocationService] Nominatim: No valid location parts found'
      );
      throw new Error('No valid location parts found');
    }

    return locationParts.join(', ');
  }

  /**
   * Backup geocoding provider using a fallback coordinate display
   */
  private async geocodeFallback(coordinates: Coordinates): Promise<string> {
    logger(
      `[LocationService] Fallback: Using coordinates for ${coordinates.lat}, ${coordinates.lon}`
    );

    // Format coordinates to reasonable precision
    const lat = coordinates.lat.toFixed(4);
    const lon = coordinates.lon.toFixed(4);
    return `${lat}, ${lon}`;
  }

  /**
   * Get all available geocoding providers in order of preference
   * Updated to prioritize secure server-side geocoding
   */
  private getProviders(): GeocodeProvider[] {
    const providers: GeocodeProvider[] = [];

    // Primary: Secure server-side geocoding (API keys protected)
    providers.push({
      name: 'Server',
      geocode: coords => this.geocodeServerSide(coords),
    });

    // Secondary: Direct Nominatim (free fallback)
    providers.push({
      name: 'Nominatim Direct',
      geocode: coords => this.geocodeNominatimDirect(coords),
    });

    // Final fallback: Coordinates
    providers.push({
      name: 'Fallback',
      geocode: coords => this.geocodeFallback(coords),
    });

    return providers;
  }

  /**
   * Try multiple geocoding providers with progressive fallback
   */
  private async tryMultipleProviders(
    coordinates: Coordinates
  ): Promise<string> {
    const providers = this.getProviders();
    logger(
      `[LocationService] Trying ${providers.length} providers: ${providers.map(p => p.name).join(', ')}`
    );

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        logger(`[LocationService] Trying provider: ${provider.name}`);

        const result = await Promise.race([
          provider.geocode(coordinates),
          this.createTimeoutPromise(this.REQUEST_TIMEOUT),
        ]);

        logger(`[LocationService] ✅ Success with ${provider.name}: ${result}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger(
          `[LocationService] ❌ ${provider.name} failed: ${lastError.message}`
        );

        // Add delay before trying next provider (except for last one)
        if (provider !== providers[providers.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    // All providers failed
    const errorMessage = `All geocoding providers failed. Last error: ${lastError?.message || 'Unknown error'}`;
    logger(`[LocationService] ❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }

  /**
   * Main geocoding method with caching and deduplication
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    // Input validation
    if (
      !coordinates ||
      typeof coordinates.lat !== 'number' ||
      typeof coordinates.lon !== 'number' ||
      !isFinite(coordinates.lat) ||
      !isFinite(coordinates.lon) ||
      coordinates.lat < -90 ||
      coordinates.lat > 90 ||
      coordinates.lon < -180 ||
      coordinates.lon > 180
    ) {
      throw new Error(`Invalid coordinates: ${JSON.stringify(coordinates)}`);
    }

    const cacheKey = this.getCacheKey(coordinates);

    // Check cache first
    const cachedResult = this.getCachedResult(coordinates);
    if (cachedResult) {
      return cachedResult;
    }

    // Check if request is already in progress (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      logger(`[LocationService] Deduplicating request for ${cacheKey}`);
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.tryMultipleProviders(coordinates);

    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache successful result
      this.setCachedResult(coordinates, result);

      return result;
    } finally {
      // Always clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Debug method to check location service configuration and test geocoding
   */
  async debug(coordinates?: Coordinates): Promise<void> {
    const testCoords = coordinates || { lat: 48.2082, lon: 16.3738 }; // Vienna

    logger('[LocationService] === DEBUG INFO ===');
    logger(`[LocationService] Cache size: ${this.cache.size} entries`);
    logger(`[LocationService] Pending requests: ${this.pendingRequests.size}`);

    const providers = this.getProviders();
    logger(
      `[LocationService] Available providers: ${providers.map(p => p.name).join(', ')}`
    );

    logger(
      `[LocationService] Testing geocoding for ${testCoords.lat}, ${testCoords.lon}...`
    );

    try {
      const result = await this.reverseGeocode(testCoords);
      logger(`[LocationService] ✅ Test successful: ${result}`);
    } catch (error) {
      logger(`[LocationService] ❌ Test failed:`, error);
    }

    logger('[LocationService] === END DEBUG ===');
  }

  /**
   * Clear all cached locations
   */
  clearCache(): void {
    const oldSize = this.cache.size;
    this.cache.clear();
    logger(`[LocationService] Cleared cache (${oldSize} entries removed)`);
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

// Create singleton instance
export const locationService = new LocationService();
