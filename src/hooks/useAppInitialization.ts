import { useEffect } from 'react';

/**
 * Centralized app initialization hook
 * Handles all one-time setup tasks (console API now handled by TripOverlay)
 */
export function useAppInitialization() {
  useEffect(() => {
    // Console API is now set up in TripOverlay component after hook initialization
    // Any other global initialization can go here
    console.log('🚀 Trip Overlay app initialized');
  }, []);
}
