export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  subsystem: string;
  metadata?: Record<string, any>;
  correlationId?: string;
  sourceFile?: string;
  parsedAt?: string;
}

export interface LogFilterOptions {
  search?: string;
  levels?: string[];
  services?: string[];
  startTime?: string;
  endTime?: string;
}

export interface LogFilter {
  levels?: LogLevel[];
  searchText?: string;
  subsystem?: string;
}

export interface StreamStatus {
  isConnected: boolean;
  isPaused: boolean;
  lastError?: string;
  retryCount: number;
  entriesInMemory: number;
}
