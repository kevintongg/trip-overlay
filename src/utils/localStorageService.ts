import { logger } from './logger';

interface PendingWrite {
  key: string;
  value: string;
  timestamp: number;
}

interface StorageOptions {
  throttleMs?: number;
  batchSize?: number;
  retryAttempts?: number;
}

class LocalStorageService {
  private pendingWrites = new Map<string, PendingWrite>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private cache = new Map<string, { value: string; timestamp: number }>();

  // Configuration
  private readonly DEFAULT_THROTTLE_MS = 500;
  private readonly DEFAULT_BATCH_SIZE = 10;
  private readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private readonly CACHE_DURATION = 2000; // 2 seconds for read cache

  /**
   * Optimized localStorage write with batching and throttling
   */
  async setItem(
    key: string,
    value: string,
    options: StorageOptions = {}
  ): Promise<void> {
    const {
      throttleMs = this.DEFAULT_THROTTLE_MS,
      batchSize = this.DEFAULT_BATCH_SIZE
    } = options;

    // Add to pending writes
    this.pendingWrites.set(key, {
      key,
      value,
      timestamp: Date.now(),
    });

    // Update read cache immediately for consistency
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });

    // Clear existing timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // Check if we should flush immediately (batch size reached)
    if (this.pendingWrites.size >= batchSize) {
      await this.flushPendingWrites();
    } else {
      // Schedule throttled flush
      this.flushTimer = setTimeout(() => {
        this.flushPendingWrites();
      }, throttleMs);
    }
  }

  /**
   * Optimized localStorage read with caching
   */
  getItem(key: string): string | null {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.value;
    }

    // Check pending writes
    const pending = this.pendingWrites.get(key);
    if (pending) {
      return pending.value;
    }

    // Read from localStorage
    try {
      const value = localStorage.getItem(key);

      // Cache the result
      if (value !== null) {
        this.cache.set(key, {
          value,
          timestamp: Date.now(),
        });
      }

      return value;
    } catch (error) {
      logger.warn(`[LocalStorage] Failed to read key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove item with immediate effect
   */
  removeItem(key: string): void {
    // Remove from all internal state
    this.pendingWrites.delete(key);
    this.cache.delete(key);

    // Remove from localStorage immediately
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn(`[LocalStorage] Failed to remove key "${key}":`, error);
    }
  }

  /**
   * Batch write all pending operations to localStorage
   */
  private async flushPendingWrites(retryAttempts = this.DEFAULT_RETRY_ATTEMPTS): Promise<void> {
    if (this.pendingWrites.size === 0) {
      return;
    }

    const writes = Array.from(this.pendingWrites.values());
    this.pendingWrites.clear();

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    logger.debug(`[LocalStorage] Flushing ${writes.length} pending writes`);

    const failedWrites: PendingWrite[] = [];

    for (const write of writes) {
      try {
        localStorage.setItem(write.key, write.value);
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          logger.warn(`[LocalStorage] Quota exceeded, attempting cleanup`);

          // Attempt cleanup and retry
          if (await this.attemptQuotaRecovery()) {
            try {
              localStorage.setItem(write.key, write.value);
              continue; // Success after recovery
            } catch (retryError) {
              logger.error(`[LocalStorage] Failed to write "${write.key}" after cleanup:`, retryError);
            }
          }
        } else {
          logger.error(`[LocalStorage] Failed to write "${write.key}":`, error);
        }

        failedWrites.push(write);
      }
    }

    // Retry failed writes if we have attempts remaining
    if (failedWrites.length > 0 && retryAttempts > 0) {
      logger.warn(`[LocalStorage] Retrying ${failedWrites.length} failed writes (${retryAttempts} attempts left)`);

      // Re-add failed writes to pending queue
      failedWrites.forEach(write => {
        this.pendingWrites.set(write.key, write);
      });

      // Retry after a delay
      setTimeout(() => {
        this.flushPendingWrites(retryAttempts - 1);
      }, 1000);
    }
  }

  /**
   * Attempt to recover from quota exceeded errors
   */
  private async attemptQuotaRecovery(): Promise<boolean> {
    const cleanupTargets = [
      'owm_api_usage',  // Old API usage data
      'weatherCache',   // Expired weather cache
      'locationCache',  // Old location cache
    ];

    let freedSpace = false;

    for (const key of cleanupTargets) {
      try {
        const existing = localStorage.getItem(key);
        if (existing) {
          localStorage.removeItem(key);
          logger.debug(`[LocalStorage] Cleaned up key "${key}" for quota recovery`);
          freedSpace = true;
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    // Also clean old cache entries
    this.cleanOldCacheEntries();

    return freedSpace;
  }

  /**
   * Clean expired cache entries
   */
  private cleanOldCacheEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[LocalStorage] Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Force flush all pending writes immediately
   */
  async flush(): Promise<void> {
    await this.flushPendingWrites();
  }

  /**
   * Set multiple items efficiently
   */
  async setItems(items: Record<string, string>, _options: StorageOptions = {}): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      // Add to pending without triggering individual flushes
      this.pendingWrites.set(key, {
        key,
        value,
        timestamp: Date.now(),
      });

      // Update cache
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
      });
    }

    // Trigger a single flush for all items
    await this.flushPendingWrites();
  }

  /**
   * Get storage statistics for debugging
   */
  getStats(): {
    pendingWrites: number;
    cacheSize: number;
    estimatedUsage: number;
  } {
    // Estimate localStorage usage
    let estimatedUsage = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          estimatedUsage += key.length + (value?.length || 0);
        }
      }
    } catch {
      estimatedUsage = -1; // Unable to estimate
    }

    return {
      pendingWrites: this.pendingWrites.size,
      cacheSize: this.cache.size,
      estimatedUsage,
    };
  }

  /**
   * Clear all caches and pending operations
   */
  reset(): void {
    this.pendingWrites.clear();
    this.cache.clear();

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    logger.debug('[LocalStorage] Service reset');
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

// Helper functions for common operations
export const optimizedSetItem = (key: string, value: unknown, options?: StorageOptions): Promise<void> => {
  return localStorageService.setItem(key, JSON.stringify(value), options);
};

export const optimizedGetItem = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorageService.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const optimizedRemoveItem = (key: string): void => {
  localStorageService.removeItem(key);
};
