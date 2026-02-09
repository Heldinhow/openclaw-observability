/**
 * Subagent API Routes
 * Implements endpoints from contracts/openapi.yaml
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../logger';
import {
  getRunningSubagents,
  getSubagentHistory,
  getSubagentDetail,
  searchSubagents,
} from '../../services/subagentService';
import { invalidateSubagentCache } from '../../services/subagentCache';
import type { SubagentFilters, SubagentSearchRequest } from '../../models/subagent';

const router = Router();

// Validation schemas
const runningQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val || '50', 10)),
  offset: z.string().optional().transform(val => parseInt(val || '0', 10)),
});

const historyQuerySchema = z.object({
  status: z.enum(['completed', 'failed', 'cancelled']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val || '50', 10)),
  offset: z.string().optional().transform(val => parseInt(val || '0', 10)),
});

const searchBodySchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(['idle', 'running', 'completed', 'failed', 'cancelled'])).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  taskId: z.string().optional(),
  sessionId: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

/**
 * GET /api/subagents/running
 * List currently running subagents
 */
router.get('/running', async (req: Request, res: Response) => {
  try {
    const query = runningQuerySchema.parse(req.query);
    
    const filters: SubagentFilters = {};
    if (query.search) filters.search = query.search;

    const subagents = await getRunningSubagents(filters);
    
    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedSubagents = subagents.slice(offset, offset + limit);

    res.json({
      data: paginatedSubagents,
      pagination: {
        limit,
        offset,
        total: subagents.length,
        hasMore: offset + limit < subagents.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
      return;
    }
    logger.error({ error }, 'Failed to get running subagents');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get running subagents',
      },
    });
  }
});

/**
 * GET /api/subagents/history
 * List subagent execution history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const query = historyQuerySchema.parse(req.query);

    const result = await getSubagentHistory({
      status: query.status,
      from: query.from,
      to: query.to,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
    });

    res.json({
      data: result.subagents,
      pagination: {
        limit: query.limit || 50,
        offset: query.offset || 0,
        total: result.totalCount,
        hasMore: (query.offset || 0) + (query.limit || 50) < result.totalCount,
      },
      filters: {
        applied: {
          status: query.status,
          from: query.from,
          to: query.to,
          search: query.search,
        },
        totalCount: result.totalCount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
      return;
    }
    logger.error({ error }, 'Failed to get subagent history');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get subagent history',
      },
    });
  }
});

/**
 * GET /api/subagents/:id
 * Get detailed subagent information
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const subagent = await getSubagentDetail(id);
    
    if (!subagent) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Subagent with id '${id}' not found`,
        },
      });
      return;
    }

    res.json({ data: subagent });
  } catch (error) {
    logger.error({ error, subagentId: req.params.id }, 'Failed to get subagent detail');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get subagent detail',
      },
    });
  }
});

/**
 * POST /api/subagents/search
 * Search subagents with advanced filters
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const body = searchBodySchema.parse(req.body);

    const searchRequest: SubagentSearchRequest = {
      search: body.search,
      status: body.status,
      from: body.from,
      to: body.to,
      taskId: body.taskId,
      sessionId: body.sessionId,
      limit: body.limit,
      offset: body.offset,
    };

    const result = await searchSubagents(searchRequest);

    res.json({
      data: result.subagents,
      pagination: {
        limit: body.limit || 50,
        offset: body.offset || 0,
        total: result.totalCount,
        hasMore: (body.offset || 0) + (body.limit || 50) < result.totalCount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search criteria',
          details: error.errors,
        },
      });
      return;
    }
    logger.error({ error }, 'Failed to search subagents');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search subagents',
      },
    });
  }
});

/**
 * POST /api/refresh
 * Invalidate cache and refresh data
 */
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    await invalidateSubagentCache();
    logger.info('Subagent cache invalidated');
    
    res.json({
      message: 'Cache refreshed successfully',
      invalidatedKeys: 1,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to refresh cache');
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh cache',
      },
    });
  }
});

export { router as subagentRouter };
