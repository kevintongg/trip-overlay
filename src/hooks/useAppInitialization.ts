import { useEffect } from 'react';
import { setupGlobalConsoleAPI } from '../utils/globalConsoleAPI';

// Global flag to ensure app is only initialized once
let isAppInitialized = false;

/**
 * Centralized app initialization hook
 * Handles all one-time setup tasks like console API
 * Safe to call from multiple components due to flag protection
 */
export function useAppInitialization() {
  useEffect(() => {
    if (isAppInitialized) {
      return;
    }
    
    isAppInitialized = true;
    
    // Initialize console API once
    setupGlobalConsoleAPI();
    
    // Any other global initialization can go here
    
  }, []);
} 