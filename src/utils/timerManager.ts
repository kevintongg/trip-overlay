import { logger } from './logger';

interface TimerInfo {
  id: string;
  type: 'timeout' | 'interval';
  handle: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;
  created: number;
  description?: string;
}

class TimerManager {
  private timers = new Map<string, TimerInfo>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Auto-cleanup stale timers every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 30000);
  }

  /**
   * Create a managed timeout
   */
  setTimeout(
    callback: () => void,
    delay: number,
    id: string,
    description?: string
  ): string {
    // Clear existing timer with same ID
    this.clearTimer(id);

    const handle = setTimeout(() => {
      // Auto-remove from tracking when timer executes
      this.timers.delete(id);
      callback();
    }, delay);

    this.timers.set(id, {
      id,
      type: 'timeout',
      handle,
      created: Date.now(),
      description,
    });

    logger.debug(
      `[TimerManager] Timeout created: ${id} (${delay}ms)${description ? ` - ${description}` : ''}`
    );
    return id;
  }

  /**
   * Create a managed interval
   */
  setInterval(
    callback: () => void,
    delay: number,
    id: string,
    description?: string
  ): string {
    // Clear existing timer with same ID
    this.clearTimer(id);

    const handle = setInterval(callback, delay);

    this.timers.set(id, {
      id,
      type: 'interval',
      handle,
      created: Date.now(),
      description,
    });

    logger.debug(
      `[TimerManager] Interval created: ${id} (${delay}ms)${description ? ` - ${description}` : ''}`
    );
    return id;
  }

  /**
   * Clear a specific timer
   */
  clearTimer(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) {
      return false;
    }

    if (timer.type === 'timeout') {
      clearTimeout(timer.handle as ReturnType<typeof setTimeout>);
    } else {
      clearInterval(timer.handle as ReturnType<typeof setInterval>);
    }

    this.timers.delete(id);
    logger.debug(`[TimerManager] Timer cleared: ${id}`);
    return true;
  }

  /**
   * Clear all timers with a specific prefix
   */
  clearTimersWithPrefix(prefix: string): number {
    let cleared = 0;

    for (const [id] of this.timers) {
      if (id.startsWith(prefix)) {
        if (this.clearTimer(id)) {
          cleared++;
        }
      }
    }

    if (cleared > 0) {
      logger.debug(
        `[TimerManager] Cleared ${cleared} timers with prefix: ${prefix}`
      );
    }

    return cleared;
  }

  /**
   * Clear all timers
   */
  clearAll(): number {
    const count = this.timers.size;

    for (const timer of this.timers.values()) {
      if (timer.type === 'timeout') {
        clearTimeout(timer.handle as ReturnType<typeof setTimeout>);
      } else {
        clearInterval(timer.handle as ReturnType<typeof setInterval>);
      }
    }

    this.timers.clear();

    if (count > 0) {
      logger.debug(`[TimerManager] Cleared all ${count} timers`);
    }

    return count;
  }

  /**
   * Check if a timer exists
   */
  hasTimer(id: string): boolean {
    return this.timers.has(id);
  }

  /**
   * Get timer statistics
   */
  getStats(): {
    totalTimers: number;
    timeouts: number;
    intervals: number;
    oldestTimer: number | null;
    timerList: Array<{
      id: string;
      type: string;
      age: number;
      description?: string;
    }>;
  } {
    const now = Date.now();
    let timeouts = 0;
    let intervals = 0;
    let oldestTimer: number | null = null;
    const timerList: Array<{
      id: string;
      type: string;
      age: number;
      description?: string;
    }> = [];

    for (const timer of this.timers.values()) {
      const age = now - timer.created;

      if (timer.type === 'timeout') {
        timeouts++;
      } else {
        intervals++;
      }

      if (oldestTimer === null || age > oldestTimer) {
        oldestTimer = age;
      }

      timerList.push({
        id: timer.id,
        type: timer.type,
        age,
        description: timer.description,
      });
    }

    return {
      totalTimers: this.timers.size,
      timeouts,
      intervals,
      oldestTimer,
      timerList: timerList.sort((a, b) => b.age - a.age), // Sort by age, newest first
    };
  }

  /**
   * Perform cleanup of stale timers (timeouts older than 5 minutes)
   */
  private performCleanup(): void {
    const now = Date.now();
    const staleTimeout = 5 * 60 * 1000; // 5 minutes
    const staleTimes: string[] = [];

    for (const [id, timer] of this.timers) {
      // Only clean up timeouts, not intervals (intervals are intentionally long-running)
      if (timer.type === 'timeout' && now - timer.created > staleTimeout) {
        staleTimes.push(id);
      }
    }

    for (const id of staleTimes) {
      this.clearTimer(id);
      logger.warn(`[TimerManager] Cleaned up stale timeout: ${id}`);
    }

    if (staleTimes.length > 0) {
      logger.warn(
        `[TimerManager] Cleaned up ${staleTimes.length} stale timeouts`
      );
    }
  }

  /**
   * Log current timer status for debugging
   */
  logStatus(): void {
    const stats = this.getStats();

    logger('[TimerManager] Current Status:');
    console.table({
      'Total Timers': stats.totalTimers,
      Timeouts: stats.timeouts,
      Intervals: stats.intervals,
      'Oldest Timer (ms)': stats.oldestTimer,
    });

    if (stats.timerList.length > 0) {
      logger('[TimerManager] Active Timers:');
      stats.timerList.forEach(timer => {
        logger(
          `  ${timer.id} (${timer.type}): ${timer.age}ms old${timer.description ? ` - ${timer.description}` : ''}`
        );
      });
    }
  }

  /**
   * Cleanup and destroy the timer manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const cleared = this.clearAll();
    logger.debug(`[TimerManager] Destroyed - cleared ${cleared} timers`);
  }
}

// Export singleton instance
export const timerManager = new TimerManager();

// Convenience functions that mirror native APIs but with memory leak protection
export const managedSetTimeout = (
  callback: () => void,
  delay: number,
  id: string,
  description?: string
): string => {
  return timerManager.setTimeout(callback, delay, id, description);
};

export const managedSetInterval = (
  callback: () => void,
  delay: number,
  id: string,
  description?: string
): string => {
  return timerManager.setInterval(callback, delay, id, description);
};

export const managedClearTimer = (id: string): boolean => {
  return timerManager.clearTimer(id);
};

// Global cleanup for app shutdown
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    timerManager.destroy();
  });
}
