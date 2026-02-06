import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { router } from './api/routes.js';
import { logger } from './logger.js';
import { closeRedisClient } from './services/redis.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', router);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ code: 500, message: 'Internal server error' });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
  logger.info({ projectsScanPath: config.projects.scanPath }, 'Scanning projects path');
  logger.info({ storagePath: config.storage.path }, 'OpenCode storage path');
  logger.info({ redisEnabled: config.redis.enabled }, 'Redis status');
});

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    try {
      await closeRedisClient();
    } catch {
      // Already closed
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
