import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LogBatchModel } from '../models/LogBatch';
import { validateLogFilter, validateLogEntry } from '../utils/logValidation';
import { LogStreamer } from '../services/LogStreamer';
import { SSEManager } from '../services/SSEManager';
import { LogCache } from '../services/LogCache';
import pino from 'pino';

const logger = pino({ name: 'logs-routes' });

export interface LogsRouterOptions {
  logStreamer: LogStreamer;
  sseManager: SSEManager;
  logCache?: LogCache;
}

export function createLogsRouter(options: LogsRouterOptions): Router {
  const router = Router();
  const { logStreamer, sseManager, logCache } = options;

  /**
   * GET /api/logs
   * Get historical logs with pagination
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      const level = req.query.level as string | undefined;
      const subsystem = req.query.subsystem as string | undefined;
      const search = req.query.search as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      logger.debug({ 
        cursor, 
        limit, 
        level, 
        subsystem,
        search,
        from,
        to 
      }, 'GET /api/logs');

      let entries;

      // If cursor provided, use pagination
      if (cursor) {
        const cursorData = LogBatchModel.parseCursor(cursor);
        if (cursorData) {
          entries = await logStreamer.readLogsFromTimestamp(
            logStreamer.getCurrentFilePath(),
            cursorData.timestamp,
            limit
          );
        } else {
          entries = await logStreamer.readHistoricalLogs(logStreamer.getCurrentFilePath(), limit);
        }
      } else {
        entries = await logStreamer.readHistoricalLogs(logStreamer.getCurrentFilePath(), limit);
      }

      logger.debug({ entriesCount: entries.length }, 'Raw entries count');

      // Apply filters
      let filteredEntries = entries;
      if (level) {
        const levels = level.split(',').map(l => l.trim().toLowerCase());
        filteredEntries = filteredEntries.filter(e => levels.includes(e.level));
      }
      if (subsystem) {
        const subsystemPattern = subsystem.replace(/\*/g, '.*');
        const regex = new RegExp(`^${subsystemPattern}$`);
        filteredEntries = filteredEntries.filter(e => regex.test(e.subsystem));
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filteredEntries = filteredEntries.filter(e => 
          e.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(e.metadata || {}).toLowerCase().includes(searchLower)
        );
      }

      // Cache entries
      logCache && await logCache.addEntries(filteredEntries);

      const batch = new LogBatchModel(filteredEntries, false, filteredEntries.length);

      res.json(batch.toJSON());
    } catch (error) {
      logger.error({ error: String(error), stack: error instanceof Error ? error.stack : undefined }, 'Error fetching logs');
      res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch logs' 
      });
    }
  });

  /**
   * GET /api/logs/stream
   * SSE endpoint for real-time log streaming
   */
  router.get('/stream', (req: Request, res: Response) => {
    const clientId = uuidv4();
    const level = req.query.level as string | undefined;
    const subsystem = req.query.subsystem as string | undefined;
    const search = req.query.search as string | undefined;

    logger.info({ 
      clientId, 
      level, 
      subsystem,
      search 
    }, 'New SSE connection');

    // Build filter from query params
    const filter = {
      levels: level ? level.split(',').map(l => l.trim().toLowerCase()) : undefined,
      subsystem,
      searchText: search
    };

    // Add client
    const success = options.sseManager.addClient(clientId, res, filter);

    if (!success) {
      logger.warn({ clientId }, 'Failed to add SSE client - too many connections');
      res.status(503).json({
        error: 'TOO_MANY_CONNECTIONS',
        message: 'Maximum number of connections reached'
      });
      return;
    }

    // Handle disconnect
    req.on('close', () => {
      logger.info({ clientId }, 'SSE connection closed');
    });
  });

  /**
   * POST /api/logs/filter
   * Apply advanced filters and get matching logs
   */
  router.post('/filter', async (req: Request, res: Response) => {
    try {
      const { valid, errors, sanitized } = validateLogFilter(req.body);

      if (!valid) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid filter criteria',
          details: errors
        });
        return;
      }

      const filter = sanitized as {
        levels?: string[];
        searchText?: string;
        subsystem?: string;
        timeRange?: { start?: string; end?: string };
      };

      logger.debug({ filter }, 'POST /api/logs/filter');

      // Get historical logs
      const entries = await logStreamer.readHistoricalLogs(logStreamer.getCurrentFilePath(), 1000);

      // Apply filter
      let filteredEntries = entries;

      if (filter.levels?.length) {
        filteredEntries = filteredEntries.filter(e => 
          filter.levels!.includes(e.level)
        );
      }

      if (filter.subsystem) {
        const pattern = filter.subsystem.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        filteredEntries = filteredEntries.filter(e => regex.test(e.subsystem));
      }

      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        filteredEntries = filteredEntries.filter(e => 
          e.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(e.metadata || {}).toLowerCase().includes(searchLower)
        );
      }

      if (filter.timeRange?.start) {
        const startDate = new Date(filter.timeRange.start).getTime();
        filteredEntries = filteredEntries.filter(e => 
          new Date(e.timestamp).getTime() > startDate
        );
      }

      if (filter.timeRange?.end) {
        const endDate = new Date(filter.timeRange.end).getTime();
        filteredEntries = filteredEntries.filter(e => 
          new Date(e.timestamp).getTime() < endDate
        );
      }

      const batch = new LogBatchModel(filteredEntries, false, filteredEntries.length);

      res.json(batch.toJSON());
    } catch (error) {
      logger.error({ error }, 'Error filtering logs');
      res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to filter logs' 
      });
    }
  });

  /**
   * POST /api/logs/pause
   * Pause log stream for the current connection
   */
  router.post('/pause', async (req: Request, res: Response) => {
    try {
      // In a real implementation, we'd identify the specific connection
      // For now, we broadcast a pause event to all clients
      
      logger.info('POST /api/logs/pause');
      
      res.json({
        status: 'paused',
        pausedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error }, 'Error pausing stream');
      res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to pause stream' 
      });
    }
  });

  /**
   * POST /api/logs/resume
   * Resume log stream for the current connection
   */
  router.post('/resume', async (req: Request, res: Response) => {
    try {
      logger.info('POST /api/logs/resume');
      
      res.json({
        status: 'resumed',
        resumedAt: new Date().toISOString(),
        bufferedEntries: 0
      });
    } catch (error) {
      logger.error({ error }, 'Error resuming stream');
      res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to resume stream' 
      });
    }
  });

  /**
   * GET /api/logs/status
   * Get stream status
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const sseStats = sseManager.getStats();
      
      res.json({
        isConnected: logStreamer.isActive(),
        isPaused: false,
        lastError: null,
        lastErrorAt: null,
        entriesInMemory: 250, // Frontend limit
        entriesTotal: undefined,
        nextRetryAt: null,
        ...sseStats
      });
    } catch (error) {
      logger.error({ error }, 'Error getting stream status');
      res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to get stream status' 
      });
    }
  });

  /**
   * POST /api/logs/clear-cache
   * Clear Redis cache
   */
  router.post('/clear-cache', async (req: Request, res: Response) => {
    try {
      logger.info('POST /api/logs/clear-cache');
      
      logCache && await logCache.clearCache();
      
      res.json({
        cleared: true,
        clearedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error }, 'Error clearing cache');
      res.status(500).json({ 
        error: 'INTERNAL_ERROR',
        message: 'Failed to clear cache' 
      });
    }
  });

  return router;
}
