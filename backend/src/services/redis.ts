import Redis from 'ioredis';
import { config } from '../config.js';
import { logger } from '../logger.js';

let redisClient: Redis | null = null;
let redisAvailable = false;

export async function getRedisClient(): Promise<Redis> {
  if (!config.redis.enabled) {
    throw new Error('Redis is disabled');
  }

  if (redisClient && redisAvailable) {
    return redisClient;
  }

  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 2) {
          logger.warn('Redis unavailable after retries, running without cache');
          redisAvailable = false;
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('error', (err) => {
      if (redisAvailable) {
        logger.warn({ error: err.message }, 'Redis connection error, switching to no-cache mode');
      }
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      redisAvailable = true;
    });
  }

  try {
    await redisClient.connect();
    redisAvailable = true;
  } catch {
    redisAvailable = false;
    throw new Error('Redis connection failed');
  }

  return redisClient;
}

export async function isRedisConnected(): Promise<boolean> {
  if (!config.redis.enabled) return false;

  try {
    if (!redisClient || !redisAvailable) return false;
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Already closed
    }
    redisClient = null;
    redisAvailable = false;
  }
}
