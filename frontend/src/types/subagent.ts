/**
 * Subagent entity types for frontend
 * Mirrors backend/src/models/subagent.ts
 */

export type SubagentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface Subagent {
  id: string;
  name: string;
  status: SubagentStatus;
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  taskId: string;
  sessionId: string;
  logSummary?: string | null;
}

export interface SubagentDetail extends Subagent {
  logs: LogEntry[];
  parameters?: Record<string, unknown> | null;
  results?: Record<string, unknown> | null;
  errorMessage?: string | null;
  resourceUsage?: {
    cpuPercent?: number;
    memoryMB?: number;
  } | null;
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface SubagentListResponse {
  data: Subagent[];
  pagination: PaginationInfo;
}

export interface SubagentHistoryListResponse {
  data: Subagent[];
  pagination: PaginationInfo;
  filters: {
    applied: Record<string, unknown>;
    totalCount: number;
  };
}

export interface SubagentDetailResponse {
  data: SubagentDetail;
}

export interface SubagentFilters {
  status?: SubagentStatus | SubagentStatus[];
  from?: string;
  to?: string;
  search?: string;
  taskId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export type ViewMode = 'running' | 'history';
