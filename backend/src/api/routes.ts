import { Router, Request, Response } from 'express';
import { discoverSessions, getProjectList } from '../services/discovery.js';
import { getCachedSessions, setCachedSessions, invalidateCache, getCacheInfo } from '../services/cache.js';
import { loadSessionMessages } from '../services/messages.js';
import { isRedisConnected } from '../services/redis.js';
import { logger } from '../logger.js';
import { Session, SessionFilters, SessionDetailResponse, Project, HealthResponse } from '../types/index.js';
import { createLogsRouter } from '../routes/logs.js';
import { LogStreamer } from '../services/LogStreamer.js';
import { SSEManager } from '../services/SSEManager.js';
import { LogCache } from '../services/LogCache.js';
import { getRedisClient } from '../services/redis.js';

export const router = Router();

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const filters: SessionFilters = {
      project: req.query.project as string | undefined,
      status: req.query.status as 'active' | 'inactive' | 'all' | undefined,
    };

    let sessions = await getCachedSessions();

    if (!sessions) {
      logger.info('Cache miss, discovering sessions');
      sessions = await discoverSessions();
      await setCachedSessions(sessions);
    }

    let filteredSessions = sessions;

    if (filters.project) {
      filteredSessions = filteredSessions.filter(
        (s) => s.projectID === filters.project || s.directory.includes(filters.project!)
      );
    }

    if (filters.status && filters.status !== 'all') {
      filteredSessions = filteredSessions.filter((s) => s.status === filters.status);
    }

    const cacheInfo = await getCacheInfo();

    res.json({
      sessions: filteredSessions,
      meta: {
        total: filteredSessions.length,
        cachedAt: cacheInfo.cachedAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get sessions');
    res.status(500).json({ code: 500, message: 'Failed to get sessions' });
  }
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const sessions = await getCachedSessions();
    let session = sessions?.find((s) => s.id === sessionId);

    if (!session) {
      const allSessions = await discoverSessions();
      session = allSessions.find((s) => s.id === sessionId);

      if (!session) {
        res.status(404).json({ code: 404, message: 'Session not found' });
        return;
      }
    }

    const messages = await loadSessionMessages(sessionId);

    const response: SessionDetailResponse = {
      ...session,
      messages,
    };

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Failed to get session details');
    res.status(500).json({ code: 500, message: 'Failed to get session details' });
  }
});

router.get('/projects', async (req: Request, res: Response) => {
  try {
    const projects = await getProjectList();

    const sessions = await getCachedSessions();
    const sessionCountByProject = new Map<string, number>();

    for (const session of sessions || []) {
      const count = sessionCountByProject.get(session.projectID) || 0;
      sessionCountByProject.set(session.projectID, count + 1);
    }

    const response: Project[] = projects.map((p) => ({
      id: p.name.toLowerCase().replace(/\s+/g, '-'),
      name: p.name,
      path: p.path,
      lastScanned: new Date().toISOString(),
      sessionCount: sessionCountByProject.get(p.name) || 0,
    }));

    res.json({ projects: response });
  } catch (error) {
    logger.error({ error }, 'Failed to get projects');
    res.status(500).json({ code: 500, message: 'Failed to get projects' });
  }
});

router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    await invalidateCache();

    const sessions = await discoverSessions();
    await setCachedSessions(sessions);

    res.json({ status: 'started' });
  } catch (error) {
    logger.error({ error }, 'Failed to refresh sessions');
    res.status(500).json({ code: 500, message: 'Failed to refresh sessions' });
  }
});

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    await discoverSessions();
    const discoveryLatency = Date.now() - startTime;

    const redisConnected = await isRedisConnected();

    const cacheInfo = await getCacheInfo();

    const response: HealthResponse = {
      status: redisConnected ? 'healthy' : 'degraded',
      redisConnected,
      discoveryLatency,
      lastDiscovery: cacheInfo.cachedAt || new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    res.status(500).json({ code: 500, message: 'Health check failed' });
  }
});

router.post('/errors', (req: Request, res: Response) => {
  try {
    const { error, stack, url, timestamp } = req.body;

    logger.error({ error, stack, url, timestamp, type: 'frontend-error' }, 'Frontend error reported');

    res.json({ status: 'received' });
  } catch (error) {
    logger.error({ error }, 'Failed to report error');
    res.status(500).json({ code: 500, message: 'Failed to report error' });
  }
});

// ============ LOGS ROUTES ============

// Initialize log streaming components (singleton)
let logStreamer: LogStreamer | null = null;
let sseManager: SSEManager | null = null;
let logCache: LogCache | null = null;

function getOrCreateLogsComponents() {
  if (!logStreamer) {
    const config = require('../config.js');
    const redis = getRedisClient();
    sseManager = new SSEManager(parseInt(process.env.LOG_STREAM_MAX_CONNECTIONS || '100'));
    logCache = new LogCache(redis, parseInt(process.env.LOG_CACHE_TTL || '60'));
    logStreamer = new LogStreamer({
      logFilePath: process.env.LOG_FILE_PATH || '/tmp/openclaw/openclaw.log',
      sseManager
    });
  }
  return { logStreamer, sseManager, logCache };
}

// Mount logs routes
const { logStreamer: streamer, sseManager: sse, logCache: cache } = getOrCreateLogsComponents();
router.use('/logs', createLogsRouter({
  logStreamer: streamer,
  sseManager: sse,
  logCache: cache
}));
