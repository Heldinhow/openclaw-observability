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

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  server.close(async () => {
    await closeRedisClient();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down');
  server.close(async () => {
    await closeRedisClient();
    process.exit(0);
  });
});
