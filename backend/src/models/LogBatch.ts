import { LogBatch, LogEntry } from '../types/log.types';
import { LogEntryModel } from './LogEntry';

export class LogBatchModel implements LogBatch {
  entries: LogEntry[];
  pagination: {
    cursor: string;
    hasMore: boolean;
    total?: number;
  };

  constructor(entries: LogEntry[], hasMore: boolean, total?: number) {
    this.entries = entries;
    this.pagination = {
      cursor: this.generateCursor(entries),
      hasMore,
      total
    };
  }

  /**
   * Generate an opaque cursor for pagination based on the last entry
   */
  private generateCursor(entries: LogEntry[]): string {
    if (entries.length === 0) {
      return '';
    }

    const lastEntry = entries[entries.length - 1];
    const cursorData = {
      timestamp: lastEntry.timestamp,
      id: lastEntry.id
    };

    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Parse a cursor to extract pagination info
   */
  static parseCursor(cursor: string): { timestamp: string; id: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      
      if (!parsed.timestamp || !parsed.id) {
        return null;
      }

      return {
        timestamp: parsed.timestamp,
        id: parsed.id
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a batch from raw log lines
   */
  static fromRawLines(lines: string[], sourceFile?: string): LogBatchModel {
    const entries: LogEntry[] = [];

    for (const line of lines) {
      const entry = LogEntryModel.fromRawLine(line, sourceFile);
      if (entry) {
        entries.push(entry.toJSON());
      }
    }

    return new LogBatchModel(entries, false);
  }

  /**
   * Create an empty batch
   */
  static empty(): LogBatchModel {
    return new LogBatchModel([], false, 0);
  }

  toJSON(): LogBatch {
    return {
      entries: this.entries,
      pagination: this.pagination
    };
  }
}
