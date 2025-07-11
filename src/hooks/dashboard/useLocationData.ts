import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useConnectionStore,
  type Coordinates,
} from '../../store/connectionStore';
import { useRtirlSocket } from '../useRtirlSocket';
import { locationService } from '../../utils/locationService';
import { logger } from '../../utils/logger';

export interface LocationData {
  locationText: string;
  isConnected: boolean;
  lastPosition: Coordinates | null;
  rtirlConnected: boolean;
  isLoadingLocation: boolean; // New state for loading indicator
}

/**
 * Location Data Hook - Optimized Version
 * Handles GPS data, reverse geocoding with caching, debouncing, and timeouts
 * Provides improved user experience with progressive loading states
 */
export function useLocationData(): LocationData {
  const [locationText, setLocationText] = useState('--');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const { lastPosition, isConnected } = useConnectionStore();
  const { isConnected: rtirlConnected } = useRtirlSocket();

  // Track last processed coordinates to avoid unnecessary requests
  const lastProcessedCoords = useRef<string | null>(null);
  const lastGeocodeTime = useRef<number>(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Get display text based on current state
   * Provides progressive user feedback during loading
   * Handles "location hidden" scenario like vanilla JS
   */
  const getDisplayText = useCallback(
    (position: Coordinates | null, loading: boolean, known: string): string => {
      // Check for location hidden scenario (RTIRL connected but no position data)
      if (!position && rtirlConnected) {
        const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
        if (!isDemoMode) {
          return 'Location hidden';
        }
      }
      
      if (!position) return 'Waiting for GPS...';

      // If we have GPS but no real location text yet, show loading message
      if (known === '--') {
        return 'GPS Connected - Getting location...';
      }

      // If we're loading and have a previous location, show the previous location
      if (loading && known !== '--') {
        return known; // Keep showing last known location while updating
      }

      // Normal case: show the known location
      return known;
    },
    [rtirlConnected]
  );

  /**
   * Optimized reverse geocoding with caching and error handling
   */
  const performReverseGeocode = useCallback(
    async (coordinates: Coordinates) => {
      const coordsKey = `${coordinates.lat.toFixed(6)},${coordinates.lon.toFixed(6)}`;

      // Skip if we already processed these exact coordinates
      if (lastProcessedCoords.current === coordsKey) {
        return;
      }

      lastProcessedCoords.current = coordsKey;
      setIsLoadingLocation(true);

      try {
        logger(`[useLocationData] Starting reverse geocode for ${coordsKey}`);
        const result = await locationService.reverseGeocode({
          lat: coordinates.lat,
          lon: coordinates.lon,
        });

        logger(`[useLocationData] Reverse geocode successful: ${result}`);
        setLocationText(result);
      } catch (error) {
        logger('[useLocationData] Reverse geocoding failed:', error);

        // Fallback to coordinates if all else fails
        const fallback = `${coordinates.lat.toFixed(3)}, ${coordinates.lon.toFixed(3)}`;
        setLocationText(fallback);
      } finally {
        setIsLoadingLocation(false);
      }
    },
    []
  );

  /**
   * Debounced version to prevent excessive API calls
   * 1 second delay ensures we don't spam the API during rapid GPS updates
   */
  const debouncedReverseGeocode = useCallback(
    (coordinates: Coordinates) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        performReverseGeocode(coordinates);
      }, 1000);
    },
    [performReverseGeocode]
  );

  /**
   * Handle position changes with smart updates
   */
  useEffect(() => {
    if (!lastPosition?.lat || !lastPosition?.lon) {
      // Reset state when GPS is lost
      if (locationText !== '--' && locationText !== 'Waiting for GPS...') {
        setLocationText('--');
        setIsLoadingLocation(false);
        lastProcessedCoords.current = null;
      }
      return;
    }

    // Check if we should geocode (matches vanilla JS logic exactly)
    const now = Date.now();
    const timeSinceLastGeocode = now - lastGeocodeTime.current;
    
    let shouldGeocode = !lastProcessedCoords.current || timeSinceLastGeocode > 30000; // 30 seconds
    
    // Also check distance if we have previous coordinates (>100 meters like vanilla JS)
    if (lastProcessedCoords.current && !shouldGeocode) {
      const [lastLat, lastLon] = lastProcessedCoords.current
        .split(',')
        .map(Number);
      const distance = calculateDistance(
        { lat: lastLat, lon: lastLon },
        { lat: lastPosition.lat, lon: lastPosition.lon }
      );

      // Only update if moved more than 100 meters (0.1km like vanilla JS)
      shouldGeocode = distance >= 100;
    }
    
    if (!shouldGeocode) {
      return;
    }
    
    // Update geocode time
    lastGeocodeTime.current = now;

    // Trigger debounced reverse geocoding
    debouncedReverseGeocode({
      lat: lastPosition.lat,
      lon: lastPosition.lon,
    });
  }, [lastPosition, debouncedReverseGeocode, locationText]);

  /**
   * Calculate distance between two coordinates in meters
   * Uses Haversine formula for accuracy
   */
  function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lon - coord1.lon) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Calculate final display text
  const finalLocationText = getDisplayText(
    lastPosition,
    isLoadingLocation,
    locationText
  );

  return {
    locationText: finalLocationText,
    isConnected,
    lastPosition,
    rtirlConnected,
    isLoadingLocation,
  };
}
