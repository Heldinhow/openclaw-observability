import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Subagent Configuration
  SUBAGENT_LOG_PATH: z.string().default('/var/log/openclaw/subagents'),
  SUBAGENT_RETENTION_DAYS: z.string().default('30'),
  SUBAGENT_CACHE_TTL_RUNNING: z.string().default('5'),
  SUBAGENT_CACHE_TTL_HISTORY: z.string().default('60'),
  SUBAGENT_POLLING_INTERVAL: z.string().default('5000'),
  
  // Pagination
  DEFAULT_PAGE_LIMIT: z.string().default('50'),
  MAX_PAGE_LIMIT: z.string().default('100'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  server: {
    port: parseInt(parsed.data.PORT, 10),
    nodeEnv: parsed.data.NODE_ENV,
  },
  redis: {
    url: parsed.data.REDIS_URL,
  },
  subagent: {
    logPath: parsed.data.SUBAGENT_LOG_PATH,
    retentionDays: parseInt(parsed.data.SUBAGENT_RETENTION_DAYS, 10),
    cacheTtlRunning: parseInt(parsed.data.SUBAGENT_CACHE_TTL_RUNNING, 10),
    cacheTtlHistory: parseInt(parsed.data.SUBAGENT_CACHE_TTL_HISTORY, 10),
    pollingInterval: parseInt(parsed.data.SUBAGENT_POLLING_INTERVAL, 10),
  },
  pagination: {
    defaultLimit: parseInt(parsed.data.DEFAULT_PAGE_LIMIT, 10),
    maxLimit: parseInt(parsed.data.MAX_PAGE_LIMIT, 10),
  },
} as const;

export type Config = typeof config;
