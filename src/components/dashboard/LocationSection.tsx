import React from 'react';
import type { LocationData } from '../../hooks/dashboard/useLocationData';

interface LocationSectionProps {
  locationData: LocationData;
  show: boolean;
}

/**
 * Location Section Component
 * Displays current location with connection status fallbacks
 * Maintains exact styling and logic from original Dashboard
 */
export function LocationSection({ locationData, show }: LocationSectionProps) {
  if (!show) {
    return null;
  }

  // Show connection status in location when no GPS (extracted from original)
  const getLocationText = (): string => {
    if (locationData.locationText !== '--') {
      return locationData.locationText;
    }
    if (locationData.isConnected && locationData.lastPosition) {
      return 'GPS Connected';
    }
    if (locationData.rtirlConnected) {
      return 'RTIRL Connected';
    }
    return 'Waiting for GPS...';
  };

  return (
    <div className="mb-3 w-full text-center">
      <div className="text-[1.6em] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] break-words">
        {getLocationText()}
      </div>
    </div>
  );
}
