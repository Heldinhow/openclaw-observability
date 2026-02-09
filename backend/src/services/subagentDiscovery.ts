import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../logger.js';
import type { Subagent, SubagentStatus, LogEntry } from '../models/subagent.js';

/**
 * Discovers subagents from existing OpenClaw session files
 * 
 * According to OpenClaw docs, subagents have session keys like:
 * agent:<agentId>:subagent:<uuid>
 * 
 * We scan session files and identify subagent sessions based on:
 * 1. Session ID pattern containing "subagent"
 * 2. Session metadata indicating it's a subagent run
 * 3. Parent-child relationships in messages (sessions_spawn tool usage)
 */

/**
 * Check if a session ID represents a subagent
 * Pattern: agent:<agentId>:subagent:<uuid> or contains "subagent"
 */
function isSubagentSession(sessionId: string): boolean {
  return sessionId.includes('subagent') || 
         sessionId.includes(':subagent:');
}

/**
 * Extract agent ID from subagent session ID
 * Format: agent:<agentId>:subagent:<uuid>
 */
function extractAgentId(sessionId: string): string | undefined {
  const match = sessionId.match(/agent:([^:]+):subagent:/);
  return match ? match[1] : undefined;
}

/**
 * Extract parent session ID from messages that contain sessions_spawn
 */
async function findParentSession(filePath: string, sessionId: string): Promise<string | undefined> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        // Look for tool calls or messages that reference this session as a subagent
        if (parsed.type === 'message' && parsed.message?.content) {
          const text = JSON.stringify(parsed.message.content);
          // Check if this message spawned the subagent
          if (text.includes('sessions_spawn') || text.includes(sessionId)) {
            return parsed.sessionId || parsed.parentId;
          }
        }
        // Check for tool results that created this subagent
        if (parsed.type === 'tool' && parsed.tool?.name === 'sessions_spawn') {
          const result = parsed.tool.result;
          if (result && (result.childSessionKey?.includes(sessionId) || result.runId === sessionId)) {
            return parsed.sessionId;
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    logger.debug({ error, filePath }, 'Failed to find parent session');
  }
  return undefined;
}

/**
 * Determine subagent status from session file content
 */
async function determineSubagentStatus(filePath: string): Promise<{
  status: SubagentStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  taskDescription?: string;
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let startTime: string | undefined;
    let endTime: string | undefined;
    let lastUpdateTime: string | undefined;
    let hasError = false;
    let hasCompleted = false;
    let taskDescription = '';

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        
        if (parsed.type === 'session') {
          startTime = parsed.timestamp;
        }
        
        if (parsed.type === 'message') {
          lastUpdateTime = parsed.timestamp;
          
          // Look for task description in first user message
          if (!taskDescription && parsed.message?.role === 'user' && parsed.message?.content) {
            const text = parsed.message.content
              .filter((c: { type: string; text?: string }) => c.type === 'text')
              .map((c: { text?: string }) => c.text)
              .join(' ');
            if (text) {
              taskDescription = text.slice(0, 100);
              if (text.length > 100) taskDescription += '...';
            }
          }
          
          // Check for error indicators
          if (parsed.message?.role === 'assistant' && parsed.message?.stopReason === 'error') {
            hasError = true;
          }
        }
        
        // Check for completion indicators
        if (parsed.type === 'tool' && parsed.tool?.name === 'announce') {
          hasCompleted = true;
          endTime = parsed.timestamp;
        }
      } catch {
        continue;
      }
    }

    // Determine status
    let status: SubagentStatus;
    if (hasError) {
      status = 'failed';
    } else if (hasCompleted) {
      status = 'completed';
    } else if (lastUpdateTime) {
      // Check if idle (no updates in 5 minutes)
      const lastUpdate = new Date(lastUpdateTime).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      status = lastUpdate < fiveMinutesAgo ? 'idle' : 'running';
    } else {
      status = 'idle';
    }

    // Calculate duration
    let duration: number | undefined;
    if (startTime && endTime) {
      duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    }

    return {
      status,
      startTime: startTime || new Date().toISOString(),
      endTime,
      duration: duration ? Math.floor(duration / 1000) : undefined,
      taskDescription,
    };
  } catch (error) {
    logger.debug({ error, filePath }, 'Failed to determine subagent status');
    return {
      status: 'idle',
      startTime: new Date().toISOString(),
    };
  }
}

/**
 * Scan all session files and identify subagents
 */
export async function discoverSubagentsFromSessions(): Promise<Subagent[]> {
  const subagents: Subagent[] = [];
  const projectsDir = config.projects.scanPath;

  logger.info({ projectsDir }, 'Scanning for subagent sessions');

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
          
          // Extract session ID from filename (format: <sessionId>.jsonl)
          const sessionId = file.replace('.jsonl', '');
          
          // Check if this is a subagent session
          if (!isSubagentSession(sessionId)) continue;

          // Get subagent details
          const status = await determineSubagentStatus(filePath);
          const agentId = extractAgentId(sessionId);
          const parentSessionId = await findParentSession(filePath, sessionId);

          const subagent: Subagent = {
            id: sessionId,
            name: status.taskDescription || `Subagent ${sessionId.slice(-8)}`,
            status: status.status,
            startTime: status.startTime,
            endTime: status.endTime || null,
            duration: status.duration || null,
            taskId: parentSessionId || agentId || projectName,
            sessionId: parentSessionId || sessionId,
            logSummary: null,
          };

          subagents.push(subagent);
          logger.debug({ 
            subagentId: sessionId, 
            status: status.status,
            project: projectName 
          }, 'Discovered subagent');
        }
      } catch (error) {
        logger.warn({ error, projectPath }, 'Failed to scan project for subagents');
      }
    }
  } catch (error) {
    logger.error({ error, projectsDir }, 'Failed to scan projects for subagents');
  }

  // Sort by start time (newest first)
  subagents.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  logger.info({ 
    subagentCount: subagents.length,
    running: subagents.filter(s => s.status === 'running').length,
    completed: subagents.filter(s => s.status === 'completed').length,
    failed: subagents.filter(s => s.status === 'failed').length,
  }, 'Subagent discovery completed');

  return subagents;
}

/**
 * Get detailed logs for a subagent from its session file
 */
export async function getSubagentLogs(subagentId: string): Promise<LogEntry[]> {
  const projectsDir = config.projects.scanPath;
  const logs: LogEntry[] = [];

  try {
    const projectEntries = await fs.readdir(projectsDir, { withFileTypes: true });

    for (const projectEntry of projectEntries) {
      if (!projectEntry.isDirectory()) continue;

      const sessionsDir = path.join(
        projectsDir, 
        projectEntry.name, 
        '.opencode', 
        'sessions'
      );

      try {
        const filePath = path.join(sessionsDir, `${subagentId}.jsonl`);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'message' && parsed.message?.content) {
              const text = parsed.message.content
                .filter((c: { type: string; text?: string }) => c.type === 'text')
                .map((c: { text?: string }) => c.text)
                .join(' ');
              
              if (text) {
                logs.push({
                  timestamp: parsed.timestamp,
                  level: parsed.message.role === 'assistant' ? 'info' : 'debug',
                  message: text.slice(0, 500),
                  metadata: {
                    role: parsed.message.role,
                    model: parsed.message.model,
                  },
                });
              }
            }
          } catch {
            continue;
          }
        }

        return logs;
      } catch {
        continue;
      }
    }
  } catch (error) {
    logger.error({ error, subagentId }, 'Failed to get subagent logs');
  }

  return logs;
}

/**
 * Get subagent statistics
 */
export async function getSubagentStatsFromSessions(): Promise<{
  total: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  idle: number;
}> {
  const subagents = await discoverSubagentsFromSessions();

  return {
    total: subagents.length,
    running: subagents.filter(s => s.status === 'running').length,
    completed: subagents.filter(s => s.status === 'completed').length,
    failed: subagents.filter(s => s.status === 'failed').length,
    cancelled: subagents.filter(s => s.status === 'cancelled').length,
    idle: subagents.filter(s => s.status === 'idle').length,
  };
}
