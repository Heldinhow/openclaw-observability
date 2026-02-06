export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  metadata?: Record<string, any>;
}

export interface LogFilterOptions {
  search?: string;
  levels?: string[];
  services?: string[];
  startTime?: string;
  endTime?: string;
}
