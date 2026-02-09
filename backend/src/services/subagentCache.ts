/**
 * Subagent-specific cache service
 * Extends existing Redis cache infrastructure
 */

import { getRedisClient, isRedisConnected } from './redis.js';
import { logger } from '../logger.js';
import type { Subagent, SubagentDetail } from '../models/subagent.js';

const CACHE_PREFIX = 'opencode:subagents';

const CACHE_KEYS = {
  RUNNING: `${CACHE_PREFIX}:running`,
  HISTORY: (filterHash: string) => `${CACHE_PREFIX}:history:${filterHash}`,
  DETAIL: (id: string) => `${CACHE_PREFIX}:detail:${id}`,
  INDEX_RUNNING: `${CACHE_PREFIX}:index:running`,
  INDEX_HISTORY: (date: string) => `${CACHE_PREFIX}:index:history:${date}`,
  INDEX_TASK: (taskId: string) => `${CACHE_PREFIX}:index:task:${taskId}`,
  INDEX_SESSION: (sessionId: string) => `${CACHE_PREFIX}:index:session:${sessionId}`,
};

// TTL values (in seconds)
const TTL = {
  RUNNING: 5, // 5 seconds for real-time data
  HISTORY: 60, // 60 seconds for historical data
  DETAIL: 30, // 30 seconds for detail view
};

/**
 * Cache running subagents list
 */
export async function setRunningSubagentsCache(subagents: Subagent[]): Promise<void> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return;

    const client = await getRedisClient();
    await client.setex(CACHE_KEYS.RUNNING, TTL.RUNNING, JSON.stringify(subagents));
    logger.debug({ count: subagents.length }, 'Running subagents cached');
  } catch (error) {
    logger.debug({ error }, 'Failed to cache running subagents');
  }
}

/**
 * Get cached running subagents
 */
export async function getRunningSubagentsCache(): Promise<Subagent[] | null> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return null;

    const client = await getRedisClient();
    const cached = await client.get(CACHE_KEYS.RUNNING);
    
    if (cached) {
      return JSON.parse(cached) as Subagent[];
    }
    return null;
  } catch (error) {
    logger.debug({ error }, 'Failed to get cached running subagents');
    return null;
  }
}

/**
 * Cache subagent history with filter hash
 */
export async function setSubagentHistoryCache(
  filterHash: string,
  subagents: Subagent[],
  totalCount: number
): Promise<void> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return;

    const client = await getRedisClient();
    const data = { subagents, totalCount, cachedAt: new Date().toISOString() };
    await client.setex(CACHE_KEYS.HISTORY(filterHash), TTL.HISTORY, JSON.stringify(data));
    logger.debug({ count: subagents.length, filterHash }, 'Subagent history cached');
  } catch (error) {
    logger.debug({ error }, 'Failed to cache subagent history');
  }
}

/**
 * Get cached subagent history
 */
export async function getSubagentHistoryCache(filterHash: string): Promise<{
  subagents: Subagent[];
  totalCount: number;
  cachedAt: string;
} | null> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return null;

    const client = await getRedisClient();
    const cached = await client.get(CACHE_KEYS.HISTORY(filterHash));
    
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    logger.debug({ error }, 'Failed to get cached subagent history');
    return null;
  }
}

/**
 * Cache subagent detail
 */
export async function setSubagentDetailCache(id: string, subagent: SubagentDetail): Promise<void> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return;

    const client = await getRedisClient();
    await client.setex(CACHE_KEYS.DETAIL(id), TTL.DETAIL, JSON.stringify(subagent));
    logger.debug({ id }, 'Subagent detail cached');
  } catch (error) {
    logger.debug({ error }, 'Failed to cache subagent detail');
  }
}

/**
 * Get cached subagent detail
 */
export async function getSubagentDetailCache(id: string): Promise<SubagentDetail | null> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return null;

    const client = await getRedisClient();
    const cached = await client.get(CACHE_KEYS.DETAIL(id));
    
    if (cached) {
      return JSON.parse(cached) as SubagentDetail;
    }
    return null;
  } catch (error) {
    logger.debug({ error }, 'Failed to get cached subagent detail');
    return null;
  }
}

/**
 * Invalidate all subagent caches
 */
export async function invalidateSubagentCache(): Promise<void> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return;

    const client = await getRedisClient();
    const pattern = `${CACHE_PREFIX}:*`;
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(...keys);
      logger.info({ keyCount: keys.length }, 'Subagent cache invalidated');
    }
  } catch (error) {
    logger.debug({ error }, 'Failed to invalidate subagent cache');
  }
}

/**
 * Index management - Add running subagent to index
 */
export async function addToRunningIndex(subagentId: string): Promise<void> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return;

    const client = await getRedisClient();
    await client.sadd(CACHE_KEYS.INDEX_RUNNING, subagentId);
    logger.debug({ subagentId }, 'Added to running index');
  } catch (error) {
    logger.debug({ error }, 'Failed to add to running index');
  }
}

/**
 * Index management - Remove from running index
 */
export async function removeFromRunningIndex(subagentId: string): Promise<void> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return;

    const client = await getRedisClient();
    await client.srem(CACHE_KEYS.INDEX_RUNNING, subagentId);
    logger.debug({ subagentId }, 'Removed from running index');
  } catch (error) {
    logger.debug({ error }, 'Failed to remove from running index');
  }
}

/**
 * Get all running subagent IDs from index
 */
export async function getRunningIndex(): Promise<string[]> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return [];

    const client = await getRedisClient();
    return await client.smembers(CACHE_KEYS.INDEX_RUNNING);
  } catch (error) {
    logger.debug({ error }, 'Failed to get running index');
    return [];
  }
}

/**
 * Index management - Add to history index
 */
export async function addToHistoryIndex(subagentId: string, endDate: string): Promise<void> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return;

    const client = await getRedisClient();
    const timestamp = new Date(endDate).getTime();
    await client.zadd(CACHE_KEYS.INDEX_HISTORY(endDate.split('T')[0]), timestamp, subagentId);
    logger.debug({ subagentId, date: endDate }, 'Added to history index');
  } catch (error) {
    logger.debug({ error }, 'Failed to add to history index');
  }
}

/**
 * Get history index for a date range
 */
export async function getHistoryIndex(fromDate: string, toDate: string): Promise<string[]> {
  try {
    const connected = await isRedisConnected();
    if (!connected) return [];

    const client = await getRedisClient();
    const from = new Date(fromDate).getTime();
    const to = new Date(toDate).getTime();
    
    const allIds: string[] = [];
    const fromDay = fromDate.split('T')[0];
    const toDay = toDate.split('T')[0];
    
    // Get all days in range
    const current = new Date(fromDay);
    const end = new Date(toDay);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const ids = await client.zrangebyscore(CACHE_KEYS.INDEX_HISTORY(dateStr), from, to);
      allIds.push(...ids);
      current.setDate(current.getDate() + 1);
    }
    
    return [...new Set(allIds)]; // Remove duplicates
  } catch (error) {
    logger.debug({ error }, 'Failed to get history index');
    return [];
  }
}

/**
 * Generate filter hash for cache key
 */
export function generateFilterHash(filters: Record<string, unknown>): string {
  const sorted = Object.keys(filters)
    .sort()
    .map((key) => `${key}=${JSON.stringify(filters[key])}`)
    .join('&');
  return Buffer.from(sorted).toString('base64').replace(/[/+=]/g, '').substring(0, 16);
}
