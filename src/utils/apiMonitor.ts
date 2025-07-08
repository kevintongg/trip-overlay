import { logger } from './logger';

interface ApiCallRecord {
  timestamp: number;
  endpoint: string;
  coordinates: string;
  success: boolean;
  fromCache: boolean;
}

interface DailyUsage {
  date: string;
  calls: ApiCallRecord[];
  totalCalls: number;
  cacheHits: number;
  errors: number;
}

const DAILY_LIMIT = 1000;
const STORAGE_KEY = 'owm_api_usage';

class ApiMonitor {
  private getTodayKey(): string {
    // Use local timezone instead of UTC for proper daily resets
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getUsageData(): DailyUsage {
    const today = this.getTodayKey();
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Reset if it's a new day
        if (data.date !== today) {
          return this.createNewDayData(today);
        }
        return data;
      } catch {
        return this.createNewDayData(today);
      }
    }

    return this.createNewDayData(today);
  }

  private createNewDayData(date: string): DailyUsage {
    return {
      date,
      calls: [],
      totalCalls: 0,
      cacheHits: 0,
      errors: 0,
    };
  }

  private saveUsageData(data: DailyUsage): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Check if we can make an API call without exceeding daily limit
   */
  canMakeApiCall(): boolean {
    const usage = this.getUsageData();
    const remaining = DAILY_LIMIT - usage.totalCalls;

    if (remaining <= 0) {
      logger(
        '🚫 API Monitor: Daily limit reached! No more API calls allowed today.'
      );
      return false;
    }

    if (remaining <= 50) {
      logger(`⚠️ API Monitor: Only ${remaining} API calls remaining today!`);
    }

    return true;
  }

  /**
   * Record an API call attempt
   */
  recordApiCall(
    endpoint: string,
    lat: number,
    lon: number,
    success: boolean,
    fromCache: boolean = false
  ): void {
    const usage = this.getUsageData();
    const coordinates = `${lat.toFixed(4)},${lon.toFixed(4)}`;

    const record: ApiCallRecord = {
      timestamp: Date.now(),
      endpoint,
      coordinates,
      success,
      fromCache,
    };

    usage.calls.push(record);

    // Keep only the last 100 calls to prevent unbounded growth
    if (usage.calls.length > 100) {
      usage.calls = usage.calls.slice(-100);
    }

    if (!fromCache) {
      usage.totalCalls++;
    } else {
      usage.cacheHits++;
    }

    if (!success) {
      usage.errors++;
    }

    this.saveUsageData(usage);

    // Log the call
    const remaining = DAILY_LIMIT - usage.totalCalls;
    if (fromCache) {
      logger(
        `📈 API Monitor: Cache hit for ${coordinates} (${remaining} calls remaining)`
      );
    } else if (success) {
      logger(
        `📈 API Monitor: API call successful for ${coordinates} (${remaining} calls remaining)`
      );
    } else {
      logger(
        `❌ API Monitor: API call failed for ${coordinates} (${remaining} calls remaining)`
      );
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): DailyUsage & { remaining: number; percentUsed: number } {
    const usage = this.getUsageData();
    const remaining = DAILY_LIMIT - usage.totalCalls;
    const percentUsed = (usage.totalCalls / DAILY_LIMIT) * 100;

    return {
      ...usage,
      remaining,
      percentUsed,
    };
  }

  /**
   * Log current usage to console
   */
  logUsageStats(): void {
    const stats = this.getUsageStats();

    logger('📊 OpenWeatherMap API Usage Stats:');
    console.table({
      'Total Calls Today': stats.totalCalls,
      'Cache Hits': stats.cacheHits,
      'Failed Calls': stats.errors,
      'Remaining Calls': stats.remaining,
      'Percent Used': `${stats.percentUsed.toFixed(1)}%`,
      'Daily Limit': DAILY_LIMIT,
    });

    if (stats.percentUsed > 80) {
      logger('⚠️ Warning: API usage is over 80% of daily limit!');
    }
  }

  /**
   * Reset usage data (for testing or manual reset)
   */
  resetUsage(): void {
    localStorage.removeItem(STORAGE_KEY);
    logger('🔄 API Monitor: Usage data reset');
  }
}

// Create singleton instance
export const apiMonitor = new ApiMonitor();

// Add to global console API for debugging
declare global {
  interface Window {
    owmApiStats?: () => void;
    owmApiReset?: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.owmApiStats = () => apiMonitor.logUsageStats();
  window.owmApiReset = () => apiMonitor.resetUsage();
}
