import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Session, SessionMetadata } from '../types/index.js';

export function determineStatus(lastUpdated: number): 'active' | 'inactive' {
  const sixtyMinutesAgo = Date.now() - 60 * 60 * 1000;
  return lastUpdated > sixtyMinutesAgo ? 'active' : 'inactive';
}

// ============ JSONL Session Format Types ============

interface JsonlSessionLine {
  type: 'session';
  version: number;
  id: string;
  timestamp: string;
  cwd: string;
  title?: string;
}

interface JsonlMessageLine {
  type: 'message';
  id: string;
  parentId: string | null;
  timestamp: string;
  message: {
    role: 'user' | 'assistant';
    content: Array<{ type: string; text: string }>;
    provider?: string;
    model?: string;
    usage?: {
      input?: number;
      output?: number;
      totalTokens?: number;
    };
    stopReason?: string;
    timestamp?: number;
  };
}

type JsonlLine = JsonlSessionLine | JsonlMessageLine | { type: string; [key: string]: unknown };

// ============ JSONL Session Parsing ============

interface ParsedJsonlSession {
  sessionMeta: JsonlSessionLine;
  messages: JsonlMessageLine[];
  projectName: string;
  projectPath: string;
  filePath: string;
}

async function parseJsonlFile(filePath: string, projectName: string, projectPath: string): Promise<ParsedJsonlSession | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let sessionMeta: JsonlSessionLine | null = null;
    const messages: JsonlMessageLine[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as JsonlLine;

        if (parsed.type === 'session') {
          sessionMeta = parsed as JsonlSessionLine;
        } else if (parsed.type === 'message') {
          messages.push(parsed as JsonlMessageLine);
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    if (!sessionMeta) {
      logger.warn({ filePath }, 'JSONL file has no session header line');
      return null;
    }

    return { sessionMeta, messages, projectName, projectPath, filePath };
  } catch (error) {
    logger.warn({ error, filePath }, 'Failed to parse JSONL session file');
    return null;
  }
}

function jsonlSessionToSession(parsed: ParsedJsonlSession): Session {
  const { sessionMeta, messages, projectName, projectPath } = parsed;

  const timestamps = messages
    .map((m) => new Date(m.timestamp).getTime())
    .filter((t) => !isNaN(t));

  const createdAt = new Date(sessionMeta.timestamp).getTime();
  const lastUpdated = timestamps.length > 0 ? Math.max(...timestamps) : createdAt;

  const messageCount = messages.filter(
    (m) => m.message?.role === 'user' || m.message?.role === 'assistant'
  ).length;

  // Build a title from the session header or first user message
  let title = sessionMeta.title || '';
  if (!title) {
    const firstUserMsg = messages.find((m) => m.message?.role === 'user');
    if (firstUserMsg?.message?.content?.[0]?.text) {
      title = firstUserMsg.message.content[0].text.slice(0, 100);
      if (firstUserMsg.message.content[0].text.length > 100) {
        title += '...';
      }
    } else {
      title = `Session ${sessionMeta.id.slice(0, 8)}`;
    }
  }

  return {
    id: sessionMeta.id,
    slug: sessionMeta.id.slice(0, 16),
    version: String(sessionMeta.version || 3),
    projectID: projectName,
    directory: projectPath,
    title,
    time: {
      created: createdAt,
      updated: lastUpdated,
    },
    summary: {
      additions: 0,
      deletions: 0,
      files: 0,
    },
    status: determineStatus(lastUpdated),
    messageCount,
  };
}

// ============ JSONL Discovery (projects/*/.opencode/sessions/*.jsonl) ============

async function discoverJsonlSessions(): Promise<Session[]> {
  const projectsDir = config.projects.scanPath;
  const sessions: Session[] = [];

  logger.info({ projectsDir }, 'Scanning projects for JSONL sessions');

  try {
    const dirExists = await fs.access(projectsDir).then(() => true).catch(() => false);
    if (!dirExists) {
      logger.warn({ projectsDir }, 'Projects directory does not exist');
      return [];
    }

    const projectEntries = await fs.readdir(projectsDir, { withFileTypes: true });

    for (const projectEntry of projectEntries) {
      if (!projectEntry.isDirectory()) continue;

      const projectName = projectEntry.name;
      const projectPath = path.join(projectsDir, projectName);
      const sessionsDir = path.join(projectPath, '.opencode', 'sessions');

      try {
        const sessionsDirExists = await fs.access(sessionsDir).then(() => true).catch(() => false);
        if (!sessionsDirExists) continue;

        const files = await fs.readdir(sessionsDir);
        const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

        for (const file of jsonlFiles) {
          const filePath = path.join(sessionsDir, file);
          const parsed = await parseJsonlFile(filePath, projectName, projectPath);

          if (parsed) {
            sessions.push(jsonlSessionToSession(parsed));
          }
        }
      } catch (error) {
        logger.warn({ error, projectPath }, 'Failed to scan project sessions directory');
      }
    }
  } catch (error) {
    logger.error({ error, projectsDir }, 'Failed to scan projects directory');
  }

  logger.info({ sessionCount: sessions.length }, 'JSONL session discovery completed');
  return sessions;
}

// ============ JSONL Message Loading ============

export async function loadJsonlSessionMessages(sessionId: string): Promise<{
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  time: { created: number; completed?: number };
  parts: Array<{
    id: string;
    sessionID: string;
    messageID: string;
    type: 'text';
    text: string;
  }>;
  model?: { providerID: string; modelID: string };
}[]> {
  const projectsDir = config.projects.scanPath;

  try {
    const projectEntries = await fs.readdir(projectsDir, { withFileTypes: true });

    for (const projectEntry of projectEntries) {
      if (!projectEntry.isDirectory()) continue;

      const sessionsDir = path.join(projectsDir, projectEntry.name, '.opencode', 'sessions');

      try {
        const files = await fs.readdir(sessionsDir);
        const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

        for (const file of jsonlFiles) {
          const filePath = path.join(sessionsDir, file);
          const parsed = await parseJsonlFile(filePath, projectEntry.name, path.join(projectsDir, projectEntry.name));

          if (parsed && parsed.sessionMeta.id === sessionId) {
            return parsed.messages
              .filter((m) => m.message?.role === 'user' || m.message?.role === 'assistant')
              .map((m) => ({
                id: m.id,
                sessionID: sessionId,
                role: m.message.role,
                time: {
                  created: new Date(m.timestamp).getTime(),
                },
                parts: (m.message.content || [])
                  .filter((c) => c.type === 'text' && c.text)
                  .map((c, idx) => ({
                    id: `${m.id}-part-${idx}`,
                    sessionID: sessionId,
                    messageID: m.id,
                    type: 'text' as const,
                    text: c.text,
                  })),
                model: m.message.provider
                  ? { providerID: m.message.provider, modelID: m.message.model || 'unknown' }
                  : undefined,
              }));
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    logger.error({ error, sessionId }, 'Failed to load JSONL session messages');
  }

  return [];
}

// ============ Original OpenCode Storage Discovery ============

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
    const messageDir = path.join(config.storage.path, 'message', sessionId);
    const dirExists = await fs.access(messageDir).then(() => true).catch(() => false);
    if (!dirExists) return 0;

    const files = await fs.readdir(messageDir);
    return files.filter((f) => f.startsWith('msg_') && f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

async function discoverOriginalSessions(): Promise<Session[]> {
  const sessionsDir = path.join(config.storage.path, 'session');
  const sessions: Session[] = [];

  try {
    const dirExists = await fs.access(sessionsDir).then(() => true).catch(() => false);
    if (!dirExists) return [];

    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = path.join(sessionsDir, entry.name);

      try {
        const files = await fs.readdir(projectPath);

        for (const file of files) {
          if (!file.startsWith('ses_') || !file.endsWith('.json')) continue;

          const filePath = path.join(projectPath, file);
          const metadata = await readSessionFile(filePath);

          if (!metadata) continue;

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
    logger.warn({ error, sessionsDir }, 'Failed to discover original sessions');
  }

  return sessions;
}

// ============ Combined Discovery ============

export async function discoverSessions(): Promise<Session[]> {
  const startTime = Date.now();

  const [jsonlSessions, originalSessions] = await Promise.all([
    discoverJsonlSessions(),
    discoverOriginalSessions(),
  ]);

  // Merge, deduplicating by ID (JSONL takes priority)
  const sessionMap = new Map<string, Session>();

  for (const session of originalSessions) {
    sessionMap.set(session.id, session);
  }
  for (const session of jsonlSessions) {
    sessionMap.set(session.id, session);
  }

  const sessions = Array.from(sessionMap.values())
    .sort((a, b) => b.time.updated - a.time.updated);

  const duration = Date.now() - startTime;
  logger.info({
    sessionCount: sessions.length,
    jsonlCount: jsonlSessions.length,
    originalCount: originalSessions.length,
    duration,
  }, 'Combined session discovery completed');

  return sessions;
}

export async function getProjectList(): Promise<{ name: string; path: string }[]> {
  const projects: Map<string, { name: string; path: string }> = new Map();

  // From JSONL projects
  try {
    const projectsDir = config.projects.scanPath;
    const dirExists = await fs.access(projectsDir).then(() => true).catch(() => false);

    if (dirExists) {
      const entries = await fs.readdir(projectsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sessionsDir = path.join(projectsDir, entry.name, '.opencode', 'sessions');
          const hasSessionsDir = await fs.access(sessionsDir).then(() => true).catch(() => false);
          if (hasSessionsDir) {
            projects.set(entry.name, {
              name: entry.name,
              path: path.join(projectsDir, entry.name),
            });
          }
        }
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to scan projects for project list');
  }

  // From original storage
  try {
    const sessionsDir = path.join(config.storage.path, 'session');
    const dirExists = await fs.access(sessionsDir).then(() => true).catch(() => false);

    if (dirExists) {
      const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !projects.has(entry.name)) {
          projects.set(entry.name, {
            name: entry.name === 'global' ? 'Global' : entry.name,
            path: path.join(sessionsDir, entry.name),
          });
        }
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to get project list from original storage');
  }

  return Array.from(projects.values());
}
