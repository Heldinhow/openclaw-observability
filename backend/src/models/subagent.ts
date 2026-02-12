/**
 * Subagent entity types and interfaces
 * Based on data-model.md specification
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
  errorStack?: string | null;
  resourceUsage?: {
    cpuPercent?: number;
    memoryMB?: number;
  } | null;
  model?: string | null;
  summary?: string | null;
  annotations?: string | null;
  projectPath?: string | null;
  parentSessionId?: string | null;
}

export interface SubagentExecutionRecord {
  id: string;
  subagentId: string;
  name: string;
  status: Exclude<SubagentStatus, 'running' | 'idle'>;
  startTime: string;
  endTime: string;
  duration: number;
  taskId: string;
  sessionId: string;
  logSummary?: string;
  logFilePath: string;
  resourceUsage?: {
    cpuPercent?: number;
    memoryMB?: number;
  };
  createdAt: string;
}

export interface TaskAssociation {
  taskId: string;
  sessionId: string;
  subagentIds: string[];
  taskType: string;
  createdAt: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
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

export interface SubagentSearchRequest {
  search?: string;
  status?: SubagentStatus[];
  from?: string;
  to?: string;
  taskId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export interface SubagentFilters {
  status?: SubagentStatus | SubagentStatus[];
  from?: string;
  to?: string;
  search?: string;
  taskId?: string;
  sessionId?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
