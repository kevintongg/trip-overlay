/**
 * @file A simple logger utility for consistent, timestamped console output.
 * @author Your Name
 * @license MIT
 */

/**
 * Prepends a local timestamp to a log message.
 * @param {string} level - The console log level ('log', 'warn', 'error').
 * @param {...any} args - The message parts to log.
 */
function log(level, ...args) {
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

const logger = (...args) => log('log', ...args);
logger.warn = (...args) => log('warn', ...args);
logger.error = (...args) => log('error', ...args);

// Exporting the logger function
export { logger };
