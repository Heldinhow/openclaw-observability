import Redis from 'ioredis';
import { LogEntry } from '../types/log.types';

/**
 * Service for caching logs in Redis
 */
export class LogCache {
  private redis: Redis;
  private readonly keyPrefix = 'logs:recent';
  private readonly defaultTTL: number;

  constructor(redis: Redis, defaultTTL: number = 60) {
    this.redis = redis;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate Redis key for a specific date
   */
  private getKey(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0];
    return `${this.keyPrefix}:${dateStr}`;
  }

  /**
   * Add a log entry to the cache
   * @param entry - Log entry to cache
   */
  async addEntry(entry: LogEntry): Promise<void> {
    const key = this.getKey(new Date(entry.timestamp));
    const score = new Date(entry.timestamp).getTime();
    const member = JSON.stringify(entry);

    // Add to sorted set with timestamp as score
    await this.redis.zadd(key, score, member);
    
    // Set expiration
    await this.redis.expire(key, this.defaultTTL);
    
    // Trim to max 10,000 entries per day
    const count = await this.redis.zcard(key);
    if (count > 10000) {
      await this.redis.zremrangebyrank(key, 0, count - 10001);
    }
  }

  /**
   * Add multiple log entries to the cache
   * @param entries - Array of log entries to cache
   */
  async addEntries(entries: LogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    // Group entries by date
    const entriesByDate = new Map<string, { score: number; member: string }[]>();

    for (const entry of entries) {
      const date = new Date(entry.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const score = date.getTime();
      const member = JSON.stringify(entry);

      if (!entriesByDate.has(dateStr)) {
        entriesByDate.set(dateStr, []);
      }
      entriesByDate.get(dateStr)!.push({ score, member });
    }

    // Batch add for each date
    const pipeline = this.redis.pipeline();
    
    for (const [dateStr, dateEntries] of entriesByDate) {
      const key = `${this.keyPrefix}:${dateStr}`;
      
      for (const { score, member } of dateEntries) {
        pipeline.zadd(key, score, member);
      }
      
      pipeline.expire(key, this.defaultTTL);
    }

    await pipeline.exec();
  }

  /**
   * Get recent log entries from cache
   * @param limit - Maximum number of entries to return
   * @param before - Get entries before this timestamp (for pagination)
   * @returns Array of log entries
   */
  async getRecentEntries(limit: number = 100, before?: string): Promise<LogEntry[]> {
    const key = this.getKey();
    const maxScore = before ? new Date(before).getTime() : '+inf';

    const results = await this.redis.zrevrangebyscore(
      key,
      maxScore,
      '-inf',
      'LIMIT',
      0,
      limit
    );

    return results.map(member => JSON.parse(member));
  }

  /**
   * Get entries for a specific date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param limit - Maximum entries per day
   */
  async getEntriesForDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<LogEntry[]> {
    const entries: LogEntry[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const key = this.getKey(currentDate);
      const results = await this.redis.zrevrange(key, 0, limit - 1);
      
      entries.push(...results.map(member => JSON.parse(member)));
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by timestamp descending
    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Clear the cache for a specific date or all dates
   * @param date - Optional specific date to clear
   */
  async clearCache(date?: Date): Promise<void> {
    if (date) {
      const key = this.getKey(date);
      await this.redis.del(key);
    } else {
      // Clear all log cache keys
      const keys = await this.redis.keys(`${this.keyPrefix}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    const keys = await this.redis.keys(`${this.keyPrefix}:*`);
    let totalEntries = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const key of keys) {
      const count = await this.redis.zcard(key);
      totalEntries += count;

      // Get oldest and newest entries for this key
      const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const newest = await this.redis.zrevrange(key, 0, 0, 'WITHSCORES');

      if (oldest.length >= 2) {
        const timestamp = parseInt(oldest[1]);
        oldestTimestamp = Math.min(oldestTimestamp, timestamp);
      }

      if (newest.length >= 2) {
        const timestamp = parseInt(newest[1]);
        newestTimestamp = Math.max(newestTimestamp, timestamp);
      }
    }

    return {
      totalKeys: keys.length,
      totalEntries,
      oldestEntry: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : undefined,
      newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp) : undefined
    };
  }
}
