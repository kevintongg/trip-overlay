import { useEffect } from 'react';
import { useTripProgressStore } from '../store/tripStore';
import { logger } from '../utils/logger';

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeInput(input: string): string {
  // Remove any script tags, javascript: URLs, and other dangerous content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Safely parse JSON with size and content validation
 */
function safeJsonParse(jsonString: string): any {
  if (jsonString.length > 10000) {
    throw new Error('JSON data too large (>10KB)');
  }

  // Basic content validation - ensure it doesn't contain script content
  const sanitized = sanitizeInput(jsonString);
  if (sanitized.includes('<script') || sanitized.includes('javascript:')) {
    throw new Error('Invalid JSON content detected');
  }

  return JSON.parse(sanitized);
}

/**
 * URL Parameters Hook - CRITICAL for Cloud OBS remote control
 * Processes URL parameters on mount to control overlay remotely
 * This is the ONLY way to control overlay in Cloud OBS environments
 */
export function useURLParameters() {
  const {
    addDistance,
    setDistance,
    jumpToProgress,
    setTotalDistance,
    resetProgress,
    resetTodayDistance,
    setTodayDistance,
    setTotalTraveled,
    exportTripData,
    importTripData,
    setUnits,
  } = useTripProgressStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let processedParams = 0;

    // Process each URL parameter
    urlParams.forEach((value, key) => {
      try {
        switch (key) {
          case 'reset':
            logger('URL parameter triggered: reset =', sanitizeInput(value));
            if (value === 'all') {
              resetProgress();
            } else if (value === 'today') {
              resetTodayDistance();
            } else {
              logger.warn('Unknown reset parameter:', sanitizeInput(value));
            }
            processedParams++;
            break;

          case 'resets':
            const resetTypes = value
              .split(',')
              .map(type => sanitizeInput(type.trim()));
            logger('URL parameter triggered: multiple resets =', resetTypes);
            resetTypes.forEach(resetType => {
              if (resetType === 'all') {
                resetProgress();
              } else if (resetType === 'today') {
                resetTodayDistance();
              } else {
                logger.warn(
                  'Unknown reset type in multiple resets:',
                  resetType
                );
              }
            });
            processedParams++;
            break;

          case 'exportTripData':
            if (value === 'true') {
              logger('URL parameter triggered: exportTripData()');
              exportTripData();
              processedParams++;
            }
            break;

          case 'importTripData':
            if (value && value.length > 0) {
              try {
                const data = safeJsonParse(decodeURIComponent(value));
                logger('URL parameter triggered: importTripData()');
                importTripData(data);
                processedParams++;
              } catch (error) {
                logger.error(
                  'Failed to import data from URL parameter:',
                  error
                );
                logger.warn('Import data must be valid URL-encoded JSON');
              }
            }
            break;

          case 'units':
            if (value === 'miles' || value === 'imperial') {
              logger('URL parameter: Switched to miles');
              setUnits('miles');
            } else if (value === 'km' || value === 'metric') {
              logger('URL parameter: Switched to kilometers');
              setUnits('km');
            } else {
              logger.warn(
                'Invalid units parameter:',
                value,
                '(must be miles, km, imperial, or metric)'
              );
            }
            processedParams++;
            break;

          case 'totalDistance':
            const totalDist = parseFloat(value);
            if (!isNaN(totalDist) && totalDist >= 0 && totalDist <= 50000) {
              logger(`URL parameter: Set total distance to ${totalDist}km`);
              setTotalDistance(totalDist);
            } else {
              logger.warn(
                'Invalid totalDistance parameter:',
                value,
                '(must be 0-50000)'
              );
            }
            processedParams++;
            break;

          case 'addDistance':
            const addDist = parseFloat(value);
            if (!isNaN(addDist) && addDist >= -10000 && addDist <= 10000) {
              logger(
                `URL parameter: ${addDist >= 0 ? 'Added' : 'Subtracted'} ${Math.abs(addDist)}km`
              );
              addDistance(addDist);
            } else {
              logger.warn(
                'Invalid addDistance parameter:',
                value,
                '(must be -10000 to 10000)'
              );
            }
            processedParams++;
            break;

          case 'setDistance':
            const setDist = parseFloat(value);
            if (!isNaN(setDist) && setDist >= 0 && setDist <= 50000) {
              logger(`URL parameter: Set distance to ${setDist}km`);
              setDistance(setDist);
            } else {
              logger.warn(
                'Invalid setDistance parameter:',
                value,
                '(must be 0-50000)'
              );
            }
            processedParams++;
            break;

          case 'jumpTo':
            const percentage = parseFloat(value);
            if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
              logger(`URL parameter: Jumped to ${percentage}% progress`);
              jumpToProgress(percentage);
            } else {
              logger.warn(
                'Invalid jumpTo parameter:',
                value,
                '(must be 0-100)'
              );
            }
            processedParams++;
            break;

          case 'stream':
            if (value === 'true') {
              logger('🎥 Stream Mode enabled - console commands available');
              logger('💡 Type showConsoleCommands() in console for help');
            }
            processedParams++;
            break;

          case 'setTodayDistance':
            const todayDist = parseFloat(value);
            if (!isNaN(todayDist) && todayDist >= 0 && todayDist <= 1000) {
              logger(`URL parameter: Set today's distance to ${todayDist}km`);
              setTodayDistance(todayDist);
            } else {
              logger.warn(
                'Invalid setTodayDistance parameter:',
                value,
                '(must be 0-1000)'
              );
            }
            processedParams++;
            break;

          case 'setTotalTraveled':
            const totalTrav = parseFloat(value);
            if (!isNaN(totalTrav) && totalTrav >= 0 && totalTrav <= 50000) {
              logger(
                `URL parameter: Set total traveled distance to ${totalTrav}km`
              );
              setTotalTraveled(totalTrav);
            } else {
              logger.warn(
                'Invalid setTotalTraveled parameter:',
                value,
                '(must be 0-50000)'
              );
            }
            processedParams++;
            break;

          case 'demo':
            if (value === 'true') {
              logger('🎭 Demo mode enabled via URL parameter');
            }
            processedParams++;
            break;

          case 'debug':
            if (value === 'true') {
              logger('🐛 Debug mode enabled via URL parameter');
            }
            processedParams++;
            break;

          default:
            // Ignore unknown parameters
            break;
        }
      } catch (error) {
        logger.error(`Error processing URL parameter ${key}=${value}:`, error);
      }
    });

    if (processedParams > 0) {
      logger(`🔗 Processed ${processedParams} URL parameter(s)`);
    }
  }, []);
}
