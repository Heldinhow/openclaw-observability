import { Router, Request, Response } from 'express';
import { zenService } from '../services/zen.js';
import { logger } from '../logger.js';

export const router = Router();

/**
 * GET /api/zen/usage
 * Get Zen usage statistics from local OpenCode storage
 */
router.get('/usage', async (_req: Request, res: Response) => {
  try {
    const usage = await zenService.getLocalUsage();

    res.json(usage);
  } catch (error) {
    logger.error({ error }, 'Failed to get Zen usage');
    res.status(500).json({
      error: 'FAILED_TO_GET_USAGE',
      message: 'Failed to fetch usage from local storage'
    });
  }
});

/**
 * GET /api/zen/models
 * Get available Zen models (public endpoint)
 */
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const models = await zenService.getModels();

    // Filter to show only free models prominently
    const freeModels = models.filter(m =>
      m.id.includes('-free') || m.id === 'gpt-5-nano' || m.id === 'big-pickle'
    );

    res.json({
      models,
      freeModels,
      totalModels: models.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get Zen models');
    res.status(500).json({
      error: 'FAILED_TO_GET_MODELS',
      message: 'Failed to fetch models from Zen'
    });
  }
});

/**
 * GET /api/zen/status
 * Check if Zen is configured
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    configured: zenService.isConfigured(),
    hasApiKey: !!zenService['apiKey'],
  });
});
