import { getRedisClient, isRedisConnected } from './redis.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Session, CacheEntry } from '../types/index.js';

const CACHE_KEYS = {
  SESSIONS_LIST: 'opencode:sessions:list',
  SESSION_DETAIL: (sessionId: string) => `opencode:session:${sessionId}`,
  PROJECT_SESSIONS: (projectId: string) => `opencode:project:${projectId}:sessions`,
};

// In-memory fallback cache
let memoryCache: { sessions: Session[]; cachedAt: string } | null = null;

export async function getCachedSessions(): Promise<Session[] | null> {
  // Try Redis first
  if (config.redis.enabled) {
    try {
      const connected = await isRedisConnected();
      if (connected) {
        const client = await getRedisClient();
        const cached = await client.get(CACHE_KEYS.SESSIONS_LIST);

        if (cached) {
          const entry = JSON.parse(cached) as CacheEntry;
          return entry.sessions;
        }
        return null;
      }
    } catch {
      // Fall through to memory cache
    }
  }

  // Memory fallback
  if (memoryCache) {
    const cacheAge = Date.now() - new Date(memoryCache.cachedAt).getTime();
    if (cacheAge < config.cache.ttlSeconds * 1000) {
      return memoryCache.sessions;
    }
    memoryCache = null;
  }

  return null;
}

export async function setCachedSessions(sessions: Session[]): Promise<void> {
  const cachedAt = new Date().toISOString();

  // Always set memory cache
  memoryCache = { sessions, cachedAt };

  // Try Redis
  if (config.redis.enabled) {
    try {
      const connected = await isRedisConnected();
      if (connected) {
        const client = await getRedisClient();
        const entry: CacheEntry = { sessions, cachedAt };
        await client.setex(
          CACHE_KEYS.SESSIONS_LIST,
          config.cache.ttlSeconds,
          JSON.stringify(entry)
        );
        logger.debug({ sessionCount: sessions.length }, 'Sessions cached in Redis');
      }
    } catch (error) {
      logger.debug({ error }, 'Redis cache write failed, using memory cache');
    }
  }
}

export async function invalidateCache(): Promise<void> {
  memoryCache = null;

  if (config.redis.enabled) {
    try {
      const connected = await isRedisConnected();
      if (connected) {
        const client = await getRedisClient();
        const pattern = 'opencode:*';
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
          logger.info({ keyCount: keys.length }, 'Redis cache invalidated');
        }
      }
    } catch (error) {
      logger.debug({ error }, 'Redis cache invalidation failed');
    }
  }
}

export async function getCacheInfo(): Promise<{ cachedAt: string | null; ttl: number }> {
  // Try Redis
  if (config.redis.enabled) {
    try {
      const connected = await isRedisConnected();
      if (connected) {
        const client = await getRedisClient();
        const cached = await client.get(CACHE_KEYS.SESSIONS_LIST);

        if (cached) {
          const entry = JSON.parse(cached) as CacheEntry;
          const ttl = await client.ttl(CACHE_KEYS.SESSIONS_LIST);
          return { cachedAt: entry.cachedAt, ttl };
        }
      }
    } catch {
      // Fall through
    }
  }

  // Memory fallback
  if (memoryCache) {
    return { cachedAt: memoryCache.cachedAt, ttl: config.cache.ttlSeconds };
  }

  return { cachedAt: null, ttl: 0 };
}
