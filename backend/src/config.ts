import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  auth: {
    jwtSecret: process.env.AUTH_JWT_SECRET || 'openclaw-observability-jwt-secret-min-32chars',
    username: process.env.AUTH_USERNAME || 'admin',
    password: process.env.AUTH_PASSWORD || 'changeme',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    enabled: process.env.REDIS_ENABLED !== 'false',
  },
  storage: {
    path: process.env.STORAGE_PATH || '/root/.local/share/opencode/storage',
  },
  projects: {
    scanPath: process.env.PROJECTS_SCAN_PATH || path.resolve(__dirname, '../../projects'),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
  },
  observability: {
    logsUrl: process.env.OBSERVABILITY_URL || 'http://localhost:8080/logs',
    tasksUrl: process.env.TASK_TRACKING_URL || 'http://localhost:8080/tasks',
  },
  zen: {
    apiKey: process.env.ZEN_API_KEY || '',
  },
};
