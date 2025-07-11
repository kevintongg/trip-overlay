import React from 'react';
import type { LocationData } from '../../hooks/dashboard/useLocationData';

interface LocationSectionProps {
  locationData: LocationData;
  show: boolean;
}

/**
 * Location Section Component - Optimized Version
 * Displays current location with progressive loading states and better UX
 */
export function LocationSection({ locationData, show }: LocationSectionProps) {
  if (!show) {
    return null;
  }

  // The hook now handles all the smart location text logic
  // We can trust the locationText from the hook directly
  const displayText = locationData.locationText;

  return (
    <div className="mb-3 w-full text-center">
      <div className="text-[1.15em] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] break-words flex items-center justify-center gap-2">
        {displayText}
        {locationData.isLoadingLocation && (
          <div className="inline-block">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin opacity-70" />
          </div>
        )}
      </div>
    </div>
  );
}
