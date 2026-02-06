/**
 * Type definitions for log streaming feature (shared with backend)
 * Based on data-model.md entities
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  subsystem: string;
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  sourceFile?: string;
  parsedAt: string;
}

export interface LogFilter {
  levels?: LogLevel[];
  searchText?: string;
  subsystem?: string;
  timeRange?: {
    start?: string;
    end?: string;
  };
}

export interface LogBatch {
  entries: LogEntry[];
  pagination: {
    cursor: string;
    hasMore: boolean;
    total?: number;
  };
}

export interface StreamStatus {
  isConnected: boolean;
  isPaused: boolean;
  lastError: string | null;
  lastErrorAt: string | null;
  entriesInMemory: number;
  entriesTotal?: number;
  nextRetryAt: string | null;
}

export interface StreamState {
  status: 'connecting' | 'connected' | 'paused' | 'error' | 'closed';
  error?: string;
  retryCount: number;
  entries: LogEntry[];
}
