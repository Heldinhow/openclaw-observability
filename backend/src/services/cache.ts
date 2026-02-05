import { getRedisClient } from './redis.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Session, CacheEntry } from '../types/index.js';

const CACHE_KEYS = {
  SESSIONS_LIST: 'opencode:sessions:list',
  SESSION_DETAIL: (sessionId: string) => `opencode:session:${sessionId}`,
  PROJECT_SESSIONS: (projectId: string) => `opencode:project:${projectId}:sessions`,
};

export async function getCachedSessions(): Promise<Session[] | null> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(CACHE_KEYS.SESSIONS_LIST);

    if (!cached) {
      return null;
    }

    const entry = JSON.parse(cached) as CacheEntry;
    return entry.sessions;
  } catch (error) {
    logger.warn({ error }, 'Failed to get cached sessions');
    return null;
  }
}

export async function setCachedSessions(sessions: Session[]): Promise<void> {
  try {
    const client = await getRedisClient();
    const entry: CacheEntry = {
      sessions,
      cachedAt: new Date().toISOString(),
    };

    await client.setex(
      CACHE_KEYS.SESSIONS_LIST,
      config.cache.ttlSeconds,
      JSON.stringify(entry)
    );

    logger.debug({ sessionCount: sessions.length }, 'Sessions cached');
  } catch (error) {
    logger.warn({ error }, 'Failed to cache sessions (Redis may be unavailable)');
  }
}

export async function invalidateCache(): Promise<void> {
  try {
    const client = await getRedisClient();
    const pattern = 'opencode:*';

    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(...keys);
      logger.info({ keyCount: keys.length }, 'Cache invalidated');
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to invalidate cache (Redis may be unavailable)');
  }
}

export async function getCacheInfo(): Promise<{ cachedAt: string | null; ttl: number }> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(CACHE_KEYS.SESSIONS_LIST);

    if (!cached) {
      return { cachedAt: null, ttl: 0 };
    }

    const entry = JSON.parse(cached) as CacheEntry;
    const ttl = await client.ttl(CACHE_KEYS.SESSIONS_LIST);

    return { cachedAt: entry.cachedAt, ttl };
  } catch (error) {
    logger.warn({ error }, 'Failed to get cache info');
    return { cachedAt: null, ttl: 0 };
  }
}
