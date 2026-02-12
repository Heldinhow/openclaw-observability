/**
 * Log reader service for subagent data
 * Reads from JSON Lines log files
 */

import { createReadStream } from 'fs';
import { readdir, stat, readFile } from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';
import { logger } from '../logger.js';
import type { Subagent, SubagentDetail, LogEntry } from '../models/subagent.js';

const DEFAULT_LOG_PATH = '/var/log/openclaw/subagents';

function getLogPath(): string {
  return process.env.SUBAGENT_LOG_PATH || DEFAULT_LOG_PATH;
}

// Use getLogPath() throughout the file instead of config.subagent?.logPath

export interface LogFileEntry {
  timestamp: string;
  type: 'subagent_start' | 'subagent_end' | 'subagent_log' | 'subagent_update';
  subagentId: string;
  data: Record<string, unknown>;
}

/**
 * Read running subagents from active log file
 */
export async function readRunningSubagents(): Promise<Subagent[]> {
  const subagentsMap = new Map<string, Subagent>();
  
  try {
    const logPath = getCurrentLogFilePath();
    const entries = await readLogFile(logPath);
    
    for (const entry of entries) {
      if (entry.type === 'subagent_start') {
        const subagent = parseSubagentFromEntry(entry);
        subagentsMap.set(subagent.id, subagent);
      } else if (entry.type === 'subagent_end') {
        subagentsMap.delete(entry.subagentId);
      } else if (entry.type === 'subagent_update') {
        const existing = subagentsMap.get(entry.subagentId);
        if (existing) {
          subagentsMap.set(entry.subagentId, { ...existing, ...parsePartialSubagent(entry.data) });
        }
      }
    }
    
    // Return only running subagents
    return Array.from(subagentsMap.values()).filter(s => s.status === 'running');
  } catch (error) {
    logger.error({ error }, 'Failed to read running subagents from log');
    return [];
  }
}

/**
 * Read subagent history from archived log files
 */
export async function readSubagentHistory(options: {
  from?: string;
  to?: string;
  status?: string | string[];
  limit?: number;
  offset?: number;
}): Promise<{ subagents: Subagent[]; totalCount: number }> {
  const subagentsMap = new Map<string, Subagent>();
  
  try {
    const logFiles = await getLogFilesInRange(options.from, options.to);
    
    for (const logFile of logFiles) {
      const entries = await readLogFile(logFile);
      
      for (const entry of entries) {
        if (entry.type === 'subagent_start' || entry.type === 'subagent_end') {
          const subagent = parseSubagentFromEntry(entry);
          
          // Apply status filter
          if (options.status) {
            const statuses = Array.isArray(options.status) ? options.status : [options.status];
            if (!statuses.includes(subagent.status)) continue;
          }
          
          // Only include completed subagents in history
          if (subagent.status !== 'running' && subagent.status !== 'idle') {
            subagentsMap.set(subagent.id, subagent);
          }
        }
      }
    }
    
    const allSubagents = Array.from(subagentsMap.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    const totalCount = allSubagents.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    
    return {
      subagents: allSubagents.slice(offset, offset + limit),
      totalCount,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to read subagent history from logs');
    return { subagents: [], totalCount: 0 };
  }
}

/**
 * Read detailed subagent information including logs
 * Reads from both subagent log files and parent session files
 */
export async function readSubagentDetail(subagentId: string): Promise<SubagentDetail | null> {
  try {
    const logFiles = await getAllLogFiles();
    logger.debug({ subagentId, logFileCount: logFiles.length }, 'Reading subagent detail');
    
    let subagent: Subagent | null = null;
    const logs: LogEntry[] = [];
    let parameters: Record<string, unknown> | null = null;
    let results: Record<string, unknown> | null = null;
    let errorMessage: string | null = null;
    let errorStack: string | null = null;
    let model: string | null = null;
    let summary: string | null = null;
    let annotations: string | null = null;
    let projectPath: string | null = null;
    let parentSessionId: string | null = null;
    
    // First, try to read from session files to get model, summary, etc.
    const sessionData = await readSubagentFromSessions(subagentId);
    logger.debug({ subagentId, sessionData }, 'Session data from parent sessions');
    
    if (sessionData) {
      model = sessionData.model || null;
      summary = sessionData.summary || null;
      annotations = sessionData.annotations || null;
      projectPath = sessionData.projectPath || null;
      parentSessionId = sessionData.parentSessionId || null;
    }
    
    // Also read from log files for any additional info
    for (const logFile of logFiles) {
      const entries = await readLogFile(logFile);
      
      for (const entry of entries) {
        if (entry.subagentId !== subagentId) continue;
        
        if (entry.type === 'subagent_start') {
          subagent = parseSubagentFromEntry(entry);
          parameters = (entry.data.parameters as Record<string, unknown>) || null;
          if (!projectPath) projectPath = (entry.data.projectPath as string) || null;
          if (!annotations) annotations = (entry.data.annotations as string) || null;
        } else if (entry.type === 'subagent_end') {
          if (!subagent) {
            subagent = parseSubagentFromEntry(entry);
          }
          results = (entry.data.results as Record<string, unknown>) || null;
          errorMessage = (entry.data.errorMessage as string) || null;
          errorStack = (entry.data.errorStack as string) || null;
          if (!summary) summary = (entry.data.summary as string) || null;
        } else if (entry.type === 'subagent_log') {
          const logEntry = parseLogEntry(entry.data);
          if (logEntry) logs.push(logEntry);
          
          // Extract model from message objects if present
          if (entry.data.model && typeof entry.data.model === 'string') {
            model = entry.data.model;
          }
          
          // Extract summary from tool results if present
          if (entry.data.summary && typeof entry.data.summary === 'string' && !summary) {
            summary = entry.data.summary;
          }
          
          // Extract annotations from log data if present
          if (entry.data.annotations && typeof entry.data.annotations === 'string' && !annotations) {
            annotations = entry.data.annotations;
          }
          
          // Extract error stack from error data if present
          if (entry.data.error && typeof entry.data.error === 'string' && !errorStack) {
            errorStack = entry.data.error;
          }
        }
      }
      
      // If we found the subagent, we can stop searching
      if (subagent) break;
    }
    
    if (!subagent) return null;
    
    return {
      ...subagent,
      logs: logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      parameters,
      results,
      errorMessage,
      errorStack,
      model: model || 'default',
      summary,
      annotations,
      projectPath,
      parentSessionId: sessionData?.parentSessionId || null,
    };
  } catch (error) {
    logger.error({ error, subagentId }, 'Failed to read subagent detail');
    return null;
  }
}

/**
 * Read subagent data from session files (parent session that spawned it)
 * Optimized for performance - stops at first match
 */
async function readSubagentFromSessions(subagentId: string): Promise<{
  model?: string;
  summary?: string;
  annotations?: string;
  projectPath?: string;
  parentSessionId?: string;
} | null> {
  const sessionDir = '/root/.openclaw/agents/main/sessions';
  
  try {
    const files = await fs.readdir(sessionDir);
    const startTime = Date.now();
    let filesChecked = 0;
    
    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      
      const filePath = path.join(sessionDir, file);
      filesChecked++;
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            
            // Look for sessions_spawn tool calls with this subagent
            if (parsed.type === 'message' && parsed.message?.toolName === 'sessions_spawn') {
              const details = parsed.message.details;
              if (details?.childSessionKey?.includes(subagentId)) {
                const args = parsed.message?.content?.[0]?.text || '';
                const parentSessionId = parsed.sessionId || parsed.parentId;
                
                let taskSummary = null;
                try {
                  const parsedArgs = JSON.parse(args);
                  taskSummary = parsedArgs.task?.substring(0, 500);
                } catch {
                  taskSummary = args.substring(0, 500);
                }
                
                logger.debug({ 
                  subagentId, 
                  filesChecked, 
                  duration: Date.now() - startTime,
                  parentSessionId 
                }, 'Found subagent in session files');
                
                return {
                  model: details.modelApplied === true ? 'default' : (details.modelApplied || null),
                  projectPath: null,
                  summary: taskSummary,
                  parentSessionId: parentSessionId || null,
                };
              }
            }
          } catch (e) {
            logger.debug({ error: e?.message, file }, 'Error parsing line');
            continue;
          }
        }
      } catch (e) {
        logger.debug({ error: e?.message, file: filePath }, 'Error reading file');
        continue;
      }
      
      // Timeout after 5 seconds to avoid blocking
      if (Date.now() - startTime > 5000) {
        logger.debug({ subagentId, filesChecked }, 'Timeout reading session files');
        break;
      }
    }
  } catch (error) {
    logger.error({ error: error?.message, subagentId }, 'Failed to read subagent from sessions');
  }
  
  return null;
}

/**
 * Read a log file and parse JSON Lines entries
 */
async function readLogFile(filePath: string): Promise<LogFileEntry[]> {
  const entries: LogFileEntry[] = [];
  
  try {
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    
    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const entry = JSON.parse(line) as LogFileEntry;
        entries.push(entry);
      } catch {
        // Skip invalid JSON lines
        logger.debug({ line }, 'Skipping invalid JSON line');
      }
    }
    
    return entries;
  } catch (error) {
    logger.debug({ error, filePath }, 'Failed to read log file');
    return [];
  }
}

/**
 * Get current log file path
 */
function getCurrentLogFilePath(): string {
  const today = new Date().toISOString().split('T')[0];
  return path.join(getLogPath(), `subagents-${today}.jsonl`);
}

/**
 * Get all log files in a date range
 */
async function getLogFilesInRange(from?: string, to?: string): Promise<string[]> {
  const logPath = getLogPath();
  
  try {
    const files = await readdir(logPath);
    const logFiles: string[] = [];
    
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();
    
    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      
      const match = file.match(/subagents-(\d{4}-\d{2}-\d{2})\.jsonl/);
      if (!match) continue;
      
      const fileDate = new Date(match[1]);
      if (fileDate >= fromDate && fileDate <= toDate) {
        logFiles.push(path.join(logPath, file));
      }
    }
    
    return logFiles.sort();
  } catch (error) {
    logger.debug({ error }, 'Failed to get log files in range');
    return [];
  }
}

/**
 * Get all log files
 */
async function getAllLogFiles(): Promise<string[]> {
  const logPath = getLogPath();
  
  try {
    const files = await readdir(logPath);
    return files
      .filter(f => f.endsWith('.jsonl'))
      .map(f => path.join(logPath, f))
      .sort()
      .reverse();
  } catch (error) {
    logger.debug({ error }, 'Failed to get all log files');
    return [];
  }
}

/**
 * Parse subagent from log entry
 */
function parseSubagentFromEntry(entry: LogFileEntry): Subagent {
  const data = entry.data;
  
  return {
    id: entry.subagentId,
    name: (data.name as string) || 'Unknown',
    status: (data.status as Subagent['status']) || 'idle',
    startTime: (data.startTime as string) || entry.timestamp,
    endTime: (data.endTime as string) || null,
    duration: data.duration ? parseInt(String(data.duration), 10) : null,
    taskId: (data.taskId as string) || '',
    sessionId: (data.sessionId as string) || '',
    logSummary: (data.logSummary as string) || null,
  };
}

/**
 * Parse partial subagent update
 */
function parsePartialSubagent(data: Record<string, unknown>): Partial<Subagent> {
  const partial: Partial<Subagent> = {};
  
  if (data.status) partial.status = data.status as Subagent['status'];
  if (data.endTime) partial.endTime = data.endTime as string;
  if (data.duration) partial.duration = parseInt(String(data.duration), 10);
  if (data.logSummary) partial.logSummary = data.logSummary as string;
  
  return partial;
}

/**
 * Parse log entry from log data
 */
function parseLogEntry(data: Record<string, unknown>): LogEntry | null {
  if (!data.timestamp || !data.message) return null;
  
  return {
    timestamp: data.timestamp as string,
    level: (data.level as LogEntry['level']) || 'info',
    message: data.message as string,
    metadata: (data.metadata as Record<string, unknown>) || undefined,
  };
}

/**
 * Tail log file for real-time updates (returns async generator)
 */
export async function* tailLogFile(filePath: string, fromPosition = 0): AsyncGenerator<LogFileEntry> {
  try {
    const fileStream = createReadStream(filePath, { 
      encoding: 'utf-8',
      start: fromPosition,
    });
    
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    
    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const entry = JSON.parse(line) as LogFileEntry;
        yield entry;
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch (error) {
    logger.debug({ error, filePath }, 'Failed to tail log file');
  }
}

/**
 * Get log file stats
 */
export async function getLogFileStats(filePath: string): Promise<{ size: number; modified: Date } | null> {
  try {
    const stats = await stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
    };
  } catch {
    return null;
  }
}
