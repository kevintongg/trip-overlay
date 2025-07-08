import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useConnectionStore,
  type Coordinates,
} from '../../store/connectionStore';
import { useRtirlSocket } from '../useRtirlSocket';
import { logger } from '../../utils/logger';

export interface LocationData {
  locationText: string;
  isConnected: boolean;
  lastPosition: Coordinates | null;
  rtirlConnected: boolean;
}

/**
 * Location Data Hook
 * Handles GPS data, reverse geocoding, and location text display
 * Maintains exact compatibility with original location logic
 */
export function useLocationData(): LocationData {
  const [locationText, setLocationText] = useState('--');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // TESTING: Now testing useRtirlSocket
  const { lastPosition, isConnected } = useConnectionStore();
  const { isConnected: rtirlConnected } = useRtirlSocket();

  // Throttling ref to prevent spam
  const lastLogTime = useRef<{ [key: string]: number }>({});

  // Throttled logger function (extracted from original)
  const throttledLog = useCallback(
    (key: string, throttleMs: number, message: string, ...args: unknown[]) => {
      const now = Date.now();
      if (now - (lastLogTime.current[key] || 0) > throttleMs) {
        lastLogTime.current[key] = now;
        logger(message, ...args);
      }
    },
    []
  );

  // Reverse geocoding function (extracted from original)
  const reverseGeocode = useCallback(
    async (lat: number, lon: number) => {
      if (isReverseGeocoding) {
        return; // Prevent duplicate requests
      }

      setIsReverseGeocoding(true);
      try {
        // Use OpenStreetMap Nominatim for free reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'trip-overlay-dashboard/1.0',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const { address } = data;

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

          const locationName =
            locationParts.filter(Boolean).length > 0
              ? locationParts.filter(Boolean).join(', ')
              : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

          setLocationText(locationName);
        } else {
          // Fallback to coordinates if geocoding fails
          setLocationText(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
        }
      } catch (error) {
        throttledLog(
          'reverseGeocode',
          1000,
          'Reverse geocoding failed:',
          error
        );
        // Fallback to coordinates
        setLocationText(`${lat.toFixed(3)}, ${lon.toFixed(3)}`);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [isReverseGeocoding, throttledLog]
  );

  // Update location when position changes
  useEffect(() => {
    if (lastPosition?.lat && lastPosition?.lon) {
      reverseGeocode(lastPosition.lat, lastPosition.lon);
    }
  }, [lastPosition, reverseGeocode]);

  return {
    locationText,
    isConnected,
    lastPosition,
    rtirlConnected,
  };
}
