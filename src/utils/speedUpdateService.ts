import { logger } from './logger';
import { optimizedSetItem, optimizedGetItem } from './localStorageService';

interface SpeedData {
  speed: number;
  mode: string;
  timestamp: number;
}

interface SpeedUpdateOptions {
  force?: boolean;
  throttleMs?: number;
}

class SpeedUpdateService {
  private lastUpdate: SpeedData | null = null;
  private pendingUpdate: SpeedData | null = null;
  private updateTimer: ReturnType<typeof setTimeout> | null = null;

  // Configuration
  private readonly DEFAULT_THROTTLE_MS = 250; // 250ms default throttle
  private readonly SIGNIFICANT_SPEED_CHANGE = 0.5; // km/h
  private readonly STORAGE_KEYS = {
    speed: 'tripOverlaySpeed',
    mode: 'tripOverlayMode',
  };

  /**
   * Update speed with intelligent batching and change detection
   */
  updateSpeed(
    speed: number,
    mode: string,
    options: SpeedUpdateOptions = {}
  ): void {
    const {
      force = false,
      throttleMs = this.DEFAULT_THROTTLE_MS
    } = options;

    const now = Date.now();
    const newUpdate: SpeedData = { speed, mode, timestamp: now };

    // Check if this is a significant change
    if (!force && !this.isSignificantChange(newUpdate)) {
      logger.debug(`[SpeedUpdate] Skipping insignificant change: ${speed.toFixed(1)} km/h, ${mode}`);
      return;
    }

    // Store pending update
    this.pendingUpdate = newUpdate;

    // Clear existing timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    // Force immediate update for certain conditions
    if (force || this.shouldForceUpdate(newUpdate)) {
      this.flushPendingUpdate();
    } else {
      // Schedule throttled update
      this.updateTimer = setTimeout(() => {
        this.flushPendingUpdate();
      }, throttleMs);
    }
  }

  /**
   * Check if the speed change is significant enough to warrant an update
   */
  private isSignificantChange(newUpdate: SpeedData): boolean {
    if (!this.lastUpdate) {
      return true; // First update is always significant
    }

    const speedDiff = Math.abs(newUpdate.speed - this.lastUpdate.speed);
    const modeChanged = newUpdate.mode !== this.lastUpdate.mode;
    const timeSinceLastUpdate = newUpdate.timestamp - this.lastUpdate.timestamp;

    // Force update every 5 seconds regardless of changes (for heartbeat)
    if (timeSinceLastUpdate > 5000) {
      return true;
    }

    // Mode changes are always significant
    if (modeChanged) {
      return true;
    }

    // Speed changes above threshold are significant
    if (speedDiff >= this.SIGNIFICANT_SPEED_CHANGE) {
      return true;
    }

    // Zero speed changes are significant (stopping/starting)
    if ((this.lastUpdate.speed === 0) !== (newUpdate.speed === 0)) {
      return true;
    }

    return false;
  }

  /**
   * Determine if we should force an immediate update
   */
  private shouldForceUpdate(newUpdate: SpeedData): boolean {
    if (!this.lastUpdate) {
      return true; // First update
    }

    // Force immediate update for mode changes
    if (newUpdate.mode !== this.lastUpdate.mode) {
      return true;
    }

    // Force immediate update for zero speed (stopping)
    if (newUpdate.speed === 0 && this.lastUpdate.speed > 0) {
      return true;
    }

    // Force immediate update for starting movement
    if (newUpdate.speed > 0 && this.lastUpdate.speed === 0) {
      return true;
    }

    return false;
  }

  /**
   * Flush the pending update to localStorage
   */
  private async flushPendingUpdate(): Promise<void> {
    if (!this.pendingUpdate) {
      return;
    }

    const update = this.pendingUpdate;
    this.pendingUpdate = null;

    // Clear timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    try {
      // Batch the localStorage updates
      await Promise.all([
        optimizedSetItem(this.STORAGE_KEYS.speed, update.speed.toFixed(1), { throttleMs: 100 }),
        optimizedSetItem(this.STORAGE_KEYS.mode, update.mode, { throttleMs: 100 }),
      ]);

      // Dispatch storage events for components that listen
      this.dispatchStorageEvents(update);

      // Update our tracking
      this.lastUpdate = update;

      logger.debug(
        `[SpeedUpdate] Flushed: ${update.speed.toFixed(1)} km/h, ${update.mode}`
      );
    } catch (error) {
      logger.error('[SpeedUpdate] Failed to flush update:', error);

      // Retry once after a delay
      setTimeout(() => {
        this.retryUpdate(update);
      }, 1000);
    }
  }

  /**
   * Retry a failed update
   */
  private async retryUpdate(update: SpeedData): Promise<void> {
    try {
      // Use direct localStorage for retry (bypass optimization)
      localStorage.setItem(this.STORAGE_KEYS.speed, update.speed.toFixed(1));
      localStorage.setItem(this.STORAGE_KEYS.mode, update.mode);

      this.dispatchStorageEvents(update);
      this.lastUpdate = update;

      logger.debug('[SpeedUpdate] Retry successful');
    } catch (error) {
      logger.error('[SpeedUpdate] Retry failed:', error);
    }
  }

  /**
   * Dispatch storage events to notify listening components
   */
  private dispatchStorageEvents(update: SpeedData): void {
    // Dispatch for speed
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: this.STORAGE_KEYS.speed,
        newValue: update.speed.toFixed(1),
        oldValue: this.lastUpdate?.speed.toFixed(1) || null,
      })
    );

    // Dispatch for mode (only if changed)
    if (!this.lastUpdate || update.mode !== this.lastUpdate.mode) {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: this.STORAGE_KEYS.mode,
          newValue: update.mode,
          oldValue: this.lastUpdate?.mode || null,
        })
      );
    }
  }

  /**
   * Get current speed data from cache or localStorage
   */
  getCurrentSpeed(): { speed: number; mode: string } | null {
    // Return pending update if available
    if (this.pendingUpdate) {
      return {
        speed: this.pendingUpdate.speed,
        mode: this.pendingUpdate.mode,
      };
    }

    // Return last known update
    if (this.lastUpdate) {
      return {
        speed: this.lastUpdate.speed,
        mode: this.lastUpdate.mode,
      };
    }

    // Fallback to localStorage
    try {
      const speed = optimizedGetItem<string>(this.STORAGE_KEYS.speed, '0');
      const mode = optimizedGetItem<string>(this.STORAGE_KEYS.mode, 'STATIONARY');

      return {
        speed: parseFloat(speed) || 0,
        mode,
      };
    } catch {
      return { speed: 0, mode: 'STATIONARY' };
    }
  }

  /**
   * Clear all speed data
   */
  clearSpeedData(): void {
    const oldSpeed = this.lastUpdate?.speed.toFixed(1) || null;
    const oldMode = this.lastUpdate?.mode || null;

    this.lastUpdate = null;
    this.pendingUpdate = null;

    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    // Clear from storage
    try {
      localStorage.removeItem(this.STORAGE_KEYS.speed);
      localStorage.removeItem(this.STORAGE_KEYS.mode);

      // Dispatch events
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: this.STORAGE_KEYS.speed,
          newValue: null,
          oldValue: oldSpeed,
        })
      );

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: this.STORAGE_KEYS.mode,
          newValue: null,
          oldValue: oldMode,
        })
      );

      logger.debug('[SpeedUpdate] Speed data cleared');
    } catch (error) {
      logger.error('[SpeedUpdate] Failed to clear speed data:', error);
    }
  }

  /**
   * Force flush any pending updates
   */
  async flush(): Promise<void> {
    if (this.pendingUpdate) {
      await this.flushPendingUpdate();
    }
  }

  /**
   * Get update statistics for debugging
   */
  getStats(): {
    lastUpdate: SpeedData | null;
    hasPendingUpdate: boolean;
    isTimerActive: boolean;
  } {
    return {
      lastUpdate: this.lastUpdate,
      hasPendingUpdate: this.pendingUpdate !== null,
      isTimerActive: this.updateTimer !== null,
    };
  }
}

// Export singleton instance
export const speedUpdateService = new SpeedUpdateService();
