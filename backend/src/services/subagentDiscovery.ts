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
 * Read subagent runs from runs.json to get actual completion status
 */
async function readSubagentRuns(): Promise<Map<string, { endedAt?: number; outcome?: { status: string } }>> {
  const runsPath = '/root/.openclaw/subagents/runs.json';
  const runStatusMap = new Map<string, { endedAt?: number; outcome?: { status: string } }>();

  try {
    const content = await fs.readFile(runsPath, 'utf-8');
    const data = JSON.parse(content);

    if (data.runs) {
      for (const runId in data.runs) {
        const run = data.runs[runId];
        if (run.childSessionKey) {
          // Extract the subagent ID from the childSessionKey
          const subagentId = run.childSessionKey.split(':').pop() || run.childSessionKey;
          runStatusMap.set(subagentId, {
            endedAt: run.endedAt,
            outcome: run.outcome,
          });
        }
      }
    }
  } catch (error) {
    logger.debug({ error, runsPath }, 'Failed to read subagent runs');
  }

  return runStatusMap;
}

/**
 * Determine subagent status from session file content
 */
async function determineSubagentStatus(filePath: string, subagentId: string): Promise<{
  status: SubagentStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  taskDescription?: string;
}> {
  try {
    // First, check runs.json for the actual run status
    const runStatusMap = await readSubagentRuns();
    const runStatus = runStatusMap.get(subagentId);

    // If the run has ended, use that information
    if (runStatus?.endedAt) {
      const endTime = new Date(runStatus.endedAt).toISOString();
      const status: SubagentStatus = runStatus.outcome?.status === 'error' ? 'failed' : 'completed';

      return {
        status,
        startTime: new Date().toISOString(), // Will be updated below
        endTime,
        taskDescription: '',
      };
    }

    // If the run hasn't ended, parse the session file for more details
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let startTime: string | undefined;
    let lastUpdateTime: string | undefined;
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
        }
      } catch {
        continue;
      }
    }

    // Determine status based on last update time
    let status: SubagentStatus = 'running';
    if (lastUpdateTime) {
      // Check if idle (no updates in 5 minutes)
      const lastUpdate = new Date(lastUpdateTime).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      status = lastUpdate < fiveMinutesAgo ? 'idle' : 'running';
    } else {
      status = 'idle';
    }

    return {
      status,
      startTime: startTime || new Date().toISOString(),
      taskDescription,
    };
  } catch (error) {
    logger.debug({ error, filePath, subagentId }, 'Failed to determine subagent status');
    return {
      status: 'idle',
      startTime: new Date().toISOString(),
    };
  }
}

/**
 * Scan all session files and identify subagents
 * Scans multiple paths:
 * - /root/.openclaw/agents/main/sessions/
 * - /root/.openclaw/workspace/projects/<project>/.opencode/sessions/
 * - /root/.openclaw/cron/runs/
 */
export async function discoverSubagentsFromSessions(): Promise<Subagent[]> {
  const subagents: Subagent[] = [];
  
  // Define scan paths
  const scanPaths = [
    '/root/.openclaw/agents/main/sessions',
    '/root/.openclaw/cron/runs',
  ];

  // Add projects path if configured
  const projectsDir = config.projects?.scanPath;
  if (projectsDir) {
    try {
      const projectsDirExists = await fs.access(projectsDir).then(() => true).catch(() => false);
      if (projectsDirExists) {
        const projectEntries = await fs.readdir(projectsDir, { withFileTypes: true });
        for (const projectEntry of projectEntries) {
          if (projectEntry.isDirectory()) {
            // First check direct .opencode/sessions path
            const sessionsDir = path.join(projectsDir, projectEntry.name, '.opencode', 'sessions');
            try {
              const sessionsDirExists = await fs.access(sessionsDir).then(() => true).catch(() => false);
              if (sessionsDirExists) {
                scanPaths.push(sessionsDir);
              }
            } catch {
              // Project doesn't have .opencode/sessions
            }

            // Also check nested projects/<subproject>/.opencode/sessions path
            const nestedProjectsDir = path.join(projectsDir, projectEntry.name, 'projects');
            try {
              const nestedProjectsExist = await fs.access(nestedProjectsDir).then(() => true).catch(() => false);
              if (nestedProjectsExist) {
                const nestedProjectEntries = await fs.readdir(nestedProjectsDir, { withFileTypes: true });
                for (const nestedProjectEntry of nestedProjectEntries) {
                  if (nestedProjectEntry.isDirectory()) {
                    const nestedSessionsDir = path.join(nestedProjectsDir, nestedProjectEntry.name, '.opencode', 'sessions');
                    try {
                      const nestedSessionsExist = await fs.access(nestedSessionsDir).then(() => true).catch(() => false);
                      if (nestedSessionsExist) {
                        scanPaths.push(nestedSessionsDir);
                      }
                    } catch {
                      // Nested project doesn't have .opencode/sessions
                    }
                  }
                }
              }
            } catch {
              // No nested projects directory
            }
          }
        }
      }
    } catch (error) {
      logger.warn({ error, projectsDir }, 'Failed to scan projects directory');
    }
  }

  logger.info({ scanPaths }, 'Scanning for subagent sessions');

  // Also check if subagent session files exist directly (with "subagent" in filename)
  const directSubagentSubagents = await discoverDirectSubagentSessions(scanPaths);
  subagents.push(...directSubagentSubagents);

  // Look for subagent references in parent session files (sessions_spawn tool)
  const referencedSubagents = await discoverSubagentsFromParentSessions(scanPaths);
  
  // Merge results, avoiding duplicates
  for (const subagent of referencedSubagents) {
    if (!subagents.find(s => s.id === subagent.id)) {
      subagents.push(subagent);
    }
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
 * Discover subagent sessions from parent session files
 * Looks for childSessionKey values containing "subagent" in sessions_spawn tool results
 */
async function discoverSubagentsFromParentSessions(scanPaths: string[]): Promise<Subagent[]> {
  const subagents: Subagent[] = [];

  for (const sessionsDir of scanPaths) {
    try {
      const dirExists = await fs.access(sessionsDir).then(() => true).catch(() => false);
      if (!dirExists) continue;

      const files = await fs.readdir(sessionsDir);
      const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

      for (const file of jsonlFiles) {
        const filePath = path.join(sessionsDir, file);
        const parentSessionId = file.replace('.jsonl', '');
        
        // Parse session file to find subagent references
        const subagentRefs = await parseSessionForSubagents(filePath, parentSessionId);
        
        for (const ref of subagentRefs) {
          // Get subagent details from the reference
          const subagent: Subagent = {
            id: ref.subagentId,
            name: ref.taskDescription || `Subagent ${ref.subagentId.slice(-8)}`,
            status: ref.status,
            startTime: ref.startTime,
            endTime: ref.endTime || null,
            duration: ref.duration || null,
            taskId: parentSessionId,
            sessionId: parentSessionId,
            logSummary: null,
          };
          
          subagents.push(subagent);
          logger.debug({ 
            subagentId: ref.subagentId, 
            parentSessionId,
            status: ref.status
          }, 'Discovered subagent from parent session');
        }
      }
    } catch (error) {
      logger.warn({ error, sessionsDir }, 'Failed to scan session directory for subagents');
    }
  }

  return subagents;
}

/**
 * Parse a session file to find subagent references in sessions_spawn tool results
 */
async function parseSessionForSubagents(filePath: string, parentSessionId: string): Promise<Array<{
  subagentId: string;
  status: SubagentStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  taskDescription?: string;
}>> {
  const subagents: Array<{
    subagentId: string;
    status: SubagentStatus;
    startTime: string;
    endTime?: string;
    duration?: number;
    taskDescription?: string;
  }> = [];

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    // Track subagents found and their completion status
    const subagentTracker = new Map<string, {
      subagentId: string;
      startTime?: string;
      taskDescription?: string;
      completed: boolean;
      failed: boolean;
      lastUpdateTime?: string;
      endTime?: string;
      duration?: number;
    }>();

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        
        // Look for sessions_spawn tool calls and results containing subagent references
        if (parsed.type === 'message' && parsed.message) {
          const message = parsed.message;
          
          // Check for tool calls with sessions_spawn (inside content)
          if (message.content) {
            for (const item of message.content) {
              if (item.type === 'toolCall' && item.name === 'sessions_spawn') {
                const args = item.arguments || {};
                const taskDescription = args.task || args.prompt || args.label || undefined;
                
                logger.debug({ 
                  parentSessionId,
                  arguments: args
                }, 'Found sessions_spawn tool call');
              }
            }
          }
          
          // Check for tool results with sessions_spawn (directly on message)
          if (message.toolName === 'sessions_spawn') {
            // The result can be in details or content
            const result = message.details || {};
            
            // Try to parse content if it's a JSON string
            let childSessionKey = result.childSessionKey;
            if (!childSessionKey && message.content && message.content.length > 0) {
              try {
                const contentText = typeof message.content[0] === 'string' 
                  ? message.content[0] 
                  : message.content[0]?.text;
                if (contentText) {
                  const parsedContent = JSON.parse(contentText);
                  childSessionKey = parsedContent.childSessionKey;
                }
              } catch {
                // Content is not JSON, ignore
              }
            }
            
            if (childSessionKey?.includes('subagent')) {
              // Extract the subagent ID from the session key
              const subagentId = childSessionKey.split(':').pop() || childSessionKey;
              
              subagentTracker.set(subagentId, {
                subagentId,
                startTime: parsed.timestamp,
                taskDescription: message.toolArguments?.task || message.toolArguments?.prompt || undefined,
                completed: false,
                failed: false,
              });
              
              logger.debug({ 
                subagentId, 
                parentSessionId,
                childSessionKey 
              }, 'Found subagent reference in sessions_spawn result');
            }
          }
        }
        
        // Look for announce tool that indicates subagent completion
        if (parsed.type === 'message' && parsed.message?.content) {
          const content = parsed.message.content;
          
          for (const item of content) {
            // Check for announce tool calls/results
            if (item.type === 'toolCall' && item.name === 'announce') {
              // Check if this announce mentions a subagent
              const contentStr = JSON.stringify(item);
              const subagentMatch = contentStr.match(/agent:main:subagent:([a-f0-9-]+)/);
              if (subagentMatch) {
                const subagentId = subagentMatch[1];
                const tracker = subagentTracker.get(subagentId);
                if (tracker) {
                  tracker.completed = true;
                  tracker.endTime = parsed.timestamp;
                  
                  // Calculate duration
                  if (tracker.startTime && tracker.endTime) {
                    const start = new Date(tracker.startTime).getTime();
                    const end = new Date(tracker.endTime).getTime();
                    tracker.duration = Math.floor((end - start) / 1000);
                  }
                }
              }
            }
          }
        }
        
        // Look for error indicators in message stopReason or content
        if (parsed.type === 'message' && parsed.message?.stopReason === 'error') {
          // Check if this is related to a subagent
          const content = JSON.stringify(parsed.message);
          const subagentMatch = content.match(/agent:main:subagent:([a-f0-9-]+)/);
          if (subagentMatch) {
            const subagentId = subagentMatch[1];
            const tracker = subagentTracker.get(subagentId);
            if (tracker) {
              tracker.failed = true;
              tracker.endTime = parsed.timestamp;
            }
          }
        }
        
        // Track last update time for each subagent
        if (parsed.type === 'message') {
          const content = JSON.stringify(parsed);
          const subagentMatches = content.matchAll(/agent:main:subagent:([a-f0-9-]+)/g);
          for (const match of subagentMatches) {
            const subagentId = match[1];
            const tracker = subagentTracker.get(subagentId);
            if (tracker) {
              tracker.lastUpdateTime = parsed.timestamp;
            }
          }
        }
      } catch {
        continue;
      }
    }

    // Read runs.json to get actual completion status
    const runStatusMap = await readSubagentRuns();

    // Convert tracker entries to subagent objects
    for (const [subagentId, tracker] of subagentTracker) {
      // First check runs.json for the actual run status
      const runStatus = runStatusMap.get(subagentId);

      // Determine status
      let status: SubagentStatus;
      let endTime: string | undefined;
      let duration: number | undefined;

      if (runStatus?.endedAt) {
        // Use the status from runs.json
        endTime = new Date(runStatus.endedAt).toISOString();
        status = runStatus.outcome?.status === 'error' ? 'failed' : 'completed';

        // Calculate duration
        if (tracker.startTime) {
          const start = new Date(tracker.startTime).getTime();
          const end = runStatus.endedAt;
          duration = Math.floor((end - start) / 1000);
        }
      } else if (tracker.failed) {
        status = 'failed';
      } else if (tracker.completed) {
        status = 'completed';
      } else if (tracker.lastUpdateTime) {
        // Check if idle (no updates in 5 minutes)
        const lastUpdate = new Date(tracker.lastUpdateTime).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        status = lastUpdate < fiveMinutesAgo ? 'idle' : 'running';
      } else {
        status = 'idle';
      }

      subagents.push({
        subagentId,
        status,
        startTime: tracker.startTime || new Date().toISOString(),
        endTime: endTime || tracker.endTime,
        duration: duration || tracker.duration,
        taskDescription: tracker.taskDescription,
      });
    }

  } catch (error) {
    logger.debug({ error, filePath }, 'Failed to parse session for subagents');
  }

  return subagents;
}

/**
 * Discover subagent sessions that have files directly named with "subagent"
 */
async function discoverDirectSubagentSessions(scanPaths: string[]): Promise<Subagent[]> {
  const subagents: Subagent[] = [];

  for (const sessionsDir of scanPaths) {
    try {
      const dirExists = await fs.access(sessionsDir).then(() => true).catch(() => false);
      if (!dirExists) continue;

      const files = await fs.readdir(sessionsDir);
      const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

      for (const file of jsonlFiles) {
        const filePath = path.join(sessionsDir, file);
        
        // Extract session ID from filename
        const sessionId = file.replace('.jsonl', '');
        
        // Check if this is a subagent session by filename
        if (!isSubagentSession(sessionId)) continue;

        // Get subagent details
        const status = await determineSubagentStatus(filePath, sessionId);
        const agentId = extractAgentId(sessionId);
        const parentSessionId = await findParentSession(filePath, sessionId);

        const subagent: Subagent = {
          id: sessionId,
          name: status.taskDescription || `Subagent ${sessionId.slice(-8)}`,
          status: status.status,
          startTime: status.startTime,
          endTime: status.endTime || null,
          duration: status.duration || null,
          taskId: parentSessionId || agentId || sessionId,
          sessionId: parentSessionId || sessionId,
          logSummary: null,
        };

        subagents.push(subagent);
        logger.debug({ 
          subagentId: sessionId, 
          status: status.status,
          sessionsDir 
        }, 'Discovered subagent from filename');
      }
    } catch (error) {
      logger.warn({ error, sessionsDir }, 'Failed to scan session directory');
    }
  }

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

      // Check direct .opencode/sessions path
      const sessionsDir = path.join(
        projectsDir, 
        projectEntry.name, 
        '.opencode', 
        'sessions'
      );

      try {
        const filePath = path.join(sessionsDir, `${subagentId}.jsonl`);
        const content = await fs.readFile(filePath, 'utf-8');
        return parseLogsFromContent(content);
      } catch {
        // Not found in direct path, continue
      }

      // Check nested projects/<subproject>/.opencode/sessions path
      const nestedProjectsDir = path.join(projectsDir, projectEntry.name, 'projects');
      try {
        const nestedProjectsExist = await fs.access(nestedProjectsDir).then(() => true).catch(() => false);
        if (!nestedProjectsExist) continue;

        const nestedProjectEntries = await fs.readdir(nestedProjectsDir, { withFileTypes: true });
        for (const nestedProjectEntry of nestedProjectEntries) {
          if (!nestedProjectEntry.isDirectory()) continue;

          const nestedSessionsDir = path.join(nestedProjectsDir, nestedProjectEntry.name, '.opencode', 'sessions');
          try {
            const filePath = path.join(nestedSessionsDir, `${subagentId}.jsonl`);
            const content = await fs.readFile(filePath, 'utf-8');
            return parseLogsFromContent(content);
          } catch {
            continue;
          }
        }
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
 * Parse logs from JSONL content
 */
function parseLogsFromContent(content: string): LogEntry[] {
  const logs: LogEntry[] = [];
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
