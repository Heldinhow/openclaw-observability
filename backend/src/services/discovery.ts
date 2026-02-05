import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Session, SessionMetadata } from '../types/index.js';

export function determineStatus(lastUpdated: number): 'active' | 'inactive' {
  const sixtyMinutesAgo = Date.now() - 60 * 60 * 1000;
  return lastUpdated > sixtyMinutesAgo ? 'active' : 'inactive';
}

async function readSessionFile(filePath: string): Promise<SessionMetadata | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const metadata = JSON.parse(content) as SessionMetadata;

    if (!metadata.id || !metadata.title) {
      logger.warn({ filePath }, 'Invalid session file: missing required fields');
      return null;
    }

    return metadata;
  } catch (error) {
    logger.warn({ error, filePath }, 'Failed to read session file');
    return null;
  }
}

async function countMessagesForSession(sessionId: string): Promise<number> {
  try {
    const messageDir = path.join(
      config.storage.path,
      'message',
      sessionId
    );

    const dirExists = await fs.access(messageDir).then(() => true).catch(() => false);
    if (!dirExists) {
      return 0;
    }

    const files = await fs.readdir(messageDir);
    return files.filter((f) => f.startsWith('msg_') && f.endsWith('.json')).length;
  } catch (error) {
    logger.warn({ error, sessionId }, 'Failed to count messages for session');
    return 0;
  }
}

export async function discoverSessions(): Promise<Session[]> {
  const startTime = Date.now();
  const sessionsDir = path.join(config.storage.path, 'session');

  logger.info({ sessionsDir }, 'Starting session discovery');

  const sessions: Session[] = [];

  try {
    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const projectPath = path.join(sessionsDir, entry.name);

      try {
        const files = await fs.readdir(projectPath);

        for (const file of files) {
          if (!file.startsWith('ses_') || !file.endsWith('.json')) {
            continue;
          }

          const filePath = path.join(projectPath, file);
          const metadata = await readSessionFile(filePath);

          if (!metadata) {
            continue;
          }

          const messageCount = await countMessagesForSession(metadata.id);
          const status = determineStatus(metadata.time.updated);

          sessions.push({
            ...metadata,
            status,
            messageCount,
          });
        }
      } catch (error) {
        logger.warn({ error, projectPath }, 'Failed to read project directory');
      }
    }
  } catch (error) {
    logger.error({ error, sessionsDir }, 'Failed to discover sessions');
    throw error;
  }

  const duration = Date.now() - startTime;
  logger.info({ sessionCount: sessions.length, duration }, 'Session discovery completed');

  return sessions;
}

export async function getProjectList(): Promise<{ name: string; path: string }[]> {
  const sessionsDir = path.join(config.storage.path, 'session');
  const projects: Map<string, { name: string; path: string }> = new Map();

  try {
    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const projectPath = path.join(sessionsDir, entry.name);

      if (entry.name === 'global') {
        projects.set('global', {
          name: 'Global',
          path: projectPath,
        });
      } else {
        projects.set(entry.name, {
          name: entry.name,
          path: projectPath,
        });
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to get project list');
    throw error;
  }

  return Array.from(projects.values());
}
