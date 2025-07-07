/**
 * @file A simple logger utility for consistent, timestamped console output.
 * @author Trip Overlay Team
 * @license MIT
 */

/**
 * Enhanced logger utility based on original trip-overlay patterns
 * Maintains exact emoji and prefix conventions from vanilla JS implementation
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface LogConfig {
  enabled: boolean;
  showTimestamp: boolean;
}

// Simple configuration matching original behavior
const config: LogConfig = {
  enabled: true,
  showTimestamp: true,
};

/**
 * Basic log function that prepends timestamp like original
 */
function log(level: LogLevel, ...args: unknown[]): void {
  if (!config.enabled) return;

  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

  // If the first arg is a string, prepend the timestamp to it.
  if (typeof args[0] === 'string') {
    args[0] = `[${timestamp}] ${args[0]}`;
  } else {
    // Otherwise, insert the timestamp as the first argument.
    args.unshift(`[${timestamp}]`);
  }

  console[level](...args);
}

// Basic logger interface matching original
interface Logger {
  (...args: unknown[]): void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const logger: Logger = (...args: unknown[]) => log('log', ...args);
logger.warn = (...args: unknown[]) => log('warn', ...args);
logger.error = (...args: unknown[]) => log('error', ...args);
logger.debug = (...args: unknown[]) => log('debug', ...args);

// Export the logger function exactly like original
export { logger };
