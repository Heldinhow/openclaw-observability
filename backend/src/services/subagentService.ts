/**
 * Subagent Service - Business logic for subagent operations
 */

import {
  getRunningSubagentsCache,
  setRunningSubagentsCache,
  getSubagentHistoryCache,
  setSubagentHistoryCache,
  getSubagentDetailCache,
  setSubagentDetailCache,
  generateFilterHash,
} from './subagentCache.js';

import {
  readRunningSubagents,
  readSubagentHistory,
  readSubagentDetail,
} from './subagentLogReader.js';

import {
  discoverSubagentsFromSessions,
  getSubagentLogs,
} from './subagentDiscovery.js';

import { logger } from '../logger.js';
import type {
  Subagent,
  SubagentDetail,
  SubagentFilters,
  SubagentSearchRequest,
} from '../models/subagent.js';

/**
 * Get running subagents with caching
 */
export async function getRunningSubagents(filters?: SubagentFilters): Promise<Subagent[]> {
  try {
    // Try cache first
    const cached = await getRunningSubagentsCache();
    if (cached && !filters) {
      logger.debug({ count: cached.length }, 'Returning cached running subagents');
      return cached;
    }

    // Read from log files
    let subagents = await readRunningSubagents();

    // If no subagents from logs, discover from session files
    if (subagents.length === 0) {
      logger.info('No subagents in log files, discovering from session files');
      const discoveredSubagents = await discoverSubagentsFromSessions();
      // Filter only running/idle subagents
      subagents = discoveredSubagents.filter(s => s.status === 'running' || s.status === 'idle');
    }

    // Apply filters if provided
    if (filters) {
      subagents = applyFilters(subagents, filters);
    }

    // Cache the results
    await setRunningSubagentsCache(subagents);

    logger.debug({ count: subagents.length }, 'Retrieved running subagents');
    return subagents;
  } catch (error) {
    logger.error({ error }, 'Failed to get running subagents');
    throw error;
  }
}

/**
 * Get subagent history with filtering and pagination
 */
export async function getSubagentHistory(options: {
  from?: string;
  to?: string;
  status?: string | string[];
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ subagents: Subagent[]; totalCount: number }> {
  try {
    // Generate cache key from filters
    const filterHash = generateFilterHash(options);
    
    // Try cache first
    const cached = await getSubagentHistoryCache(filterHash);
    if (cached) {
      logger.debug({ count: cached.subagents.length }, 'Returning cached subagent history');
      return {
        subagents: cached.subagents,
        totalCount: cached.totalCount,
      };
    }

    // Read from log files
    let result = await readSubagentHistory(options);

    // If no subagents from logs, discover from session files
    if (result.subagents.length === 0) {
      logger.info('No subagents in log files, discovering from session files');
      const discoveredSubagents = await discoverSubagentsFromSessions();
      
      // Filter out running/idle (they go to "running" view)
      let historySubagents = discoveredSubagents.filter(s => 
        s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled'
      );

      // Apply status filter
      if (options.status) {
        const statuses = Array.isArray(options.status) ? options.status : [options.status];
        historySubagents = historySubagents.filter(s => statuses.includes(s.status));
      }

      // Apply text search
      if (options.search) {
        historySubagents = applyTextSearch(historySubagents, options.search);
      }

      result = {
        subagents: historySubagents,
        totalCount: historySubagents.length,
      };
    }

    // Apply text search if provided
    if (options.search && result.subagents.length > 0) {
      result.subagents = applyTextSearch(result.subagents, options.search);
      result.totalCount = result.subagents.length;
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginatedSubagents = result.subagents.slice(offset, offset + limit);

    // Cache the results
    await setSubagentHistoryCache(filterHash, paginatedSubagents, result.totalCount);

    logger.debug({ count: paginatedSubagents.length, total: result.totalCount }, 'Retrieved subagent history');
    return {
      subagents: paginatedSubagents,
      totalCount: result.totalCount,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get subagent history');
    throw error;
  }
}

/**
 * Get detailed subagent information
 */
export async function getSubagentDetail(subagentId: string): Promise<SubagentDetail | null> {
  try {
    // Try cache first
    const cached = await getSubagentDetailCache(subagentId);
    if (cached) {
      logger.debug({ subagentId }, 'Returning cached subagent detail');
      return cached;
    }

    // Read from log files
    let detail = await readSubagentDetail(subagentId);

    // If not found in logs, try to discover from session files
    if (!detail) {
      logger.debug({ subagentId }, 'Subagent not in logs, trying session discovery');
      const discoveredSubagents = await discoverSubagentsFromSessions();
      const subagent = discoveredSubagents.find(s => s.id === subagentId);
      
      if (subagent) {
        // Get logs from session file
        const logs = await getSubagentLogs(subagentId);
        
        detail = {
          ...subagent,
          logs,
          parameters: null,
          results: null,
          errorMessage: null,
          resourceUsage: null,
        };
      }
    }

    if (detail) {
      // Cache the result
      await setSubagentDetailCache(subagentId, detail);
      logger.debug({ subagentId }, 'Retrieved subagent detail');
    } else {
      logger.debug({ subagentId }, 'Subagent not found');
    }

    return detail;
  } catch (error) {
    logger.error({ error, subagentId }, 'Failed to get subagent detail');
    throw error;
  }
}

/**
 * Search subagents across running and history
 */
export async function searchSubagents(
  request: SubagentSearchRequest
): Promise<{ subagents: Subagent[]; totalCount: number }> {
  try {
    const results: Subagent[] = [];

    // Search in running subagents
    if (!request.status || request.status.includes('running') || request.status.includes('idle')) {
      const running = await getRunningSubagents();
      results.push(...running);
    }

    // Search in history
    const historyStatuses = request.status?.filter(s => s !== 'running' && s !== 'idle') || [];
    if (historyStatuses.length > 0 || !request.status) {
      const history = await getSubagentHistory({
        from: request.from,
        to: request.to,
        status: historyStatuses.length > 0 ? historyStatuses : undefined,
        limit: 1000, // Get more for searching
        offset: 0,
      });
      results.push(...history.subagents);
    }

    // Apply text search
    let filtered = results;
    if (request.search) {
      filtered = applyTextSearch(results, request.search);
    }

    // Apply additional filters
    if (request.taskId) {
      filtered = filtered.filter(s => s.taskId === request.taskId);
    }
    if (request.sessionId) {
      filtered = filtered.filter(s => s.sessionId === request.sessionId);
    }

    // Sort by start time (newest first)
    filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const totalCount = filtered.length;
    const offset = request.offset || 0;
    const limit = request.limit || 50;

    return {
      subagents: filtered.slice(offset, offset + limit),
      totalCount,
    };
  } catch (error) {
    logger.error({ error, request }, 'Failed to search subagents');
    throw error;
  }
}

/**
 * Apply filters to subagent list
 */
function applyFilters(subagents: Subagent[], filters: SubagentFilters): Subagent[] {
  let result = [...subagents];

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    result = result.filter(s => statuses.includes(s.status));
  }

  if (filters.taskId) {
    result = result.filter(s => s.taskId === filters.taskId);
  }

  if (filters.sessionId) {
    result = result.filter(s => s.sessionId === filters.sessionId);
  }

  if (filters.search) {
    result = applyTextSearch(result, filters.search);
  }

  return result;
}

/**
 * Apply text search across subagent fields
 */
function applyTextSearch(subagents: Subagent[], search: string): Subagent[] {
  const searchLower = search.toLowerCase();
  
  return subagents.filter(s =>
    s.name.toLowerCase().includes(searchLower) ||
    s.taskId.toLowerCase().includes(searchLower) ||
    s.sessionId.toLowerCase().includes(searchLower) ||
    s.id.toLowerCase().includes(searchLower)
  );
}

/**
 * Get subagent statistics
 */
export async function getSubagentStats(): Promise<{
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}> {
  try {
    const [running, history] = await Promise.all([
      getRunningSubagents(),
      getSubagentHistory({ limit: 10000, offset: 0 }),
    ]);

    const stats = {
      running: running.length,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const subagent of history.subagents) {
      if (subagent.status === 'completed') stats.completed++;
      else if (subagent.status === 'failed') stats.failed++;
      else if (subagent.status === 'cancelled') stats.cancelled++;
    }

    return stats;
  } catch (error) {
    logger.error({ error }, 'Failed to get subagent stats');
    throw error;
  }
}
