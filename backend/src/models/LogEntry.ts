import { LogEntry, LogLevel } from '../types/log.types';
import { v4 as uuidv4 } from 'uuid';

const VALID_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export interface OpenClawRawLog {
  0?: string;
  1?: string;
  2?: string;
  timestamp?: string;
  level?: string;
  message?: string;
  subsystem?: string;
  metadata?: Record<string, unknown>;
  _meta?: {
    runtime?: string;
    runtimeVersion?: string;
    hostname?: string;
    name?: string;
    parentNames?: string[];
    date?: string;
    logLevelId?: number;
    logLevelName?: string;
    path?: {
      fullFilePath?: string;
      fileName?: string;
      fileNameWithLine?: string;
      method?: string;
    };
  };
  time?: string;
}

export class LogEntryModel implements LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  subsystem: string;
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  sourceFile?: string;
  parsedAt: string;

  constructor(data: Partial<LogEntry>) {
    this.id = data.id || uuidv4();
    this.timestamp = data.timestamp || new Date().toISOString();
    this.level = LogEntryModel.normalizeLevel(data.level);
    this.subsystem = LogEntryModel.normalizeSubsystem(data.subsystem);
    this.message = LogEntryModel.normalizeMessage(data.message);
    this.metadata = data.metadata;
    this.correlationId = data.correlationId;
    this.sourceFile = data.sourceFile;
    this.parsedAt = data.parsedAt || new Date().toISOString();
  }

  private static normalizeLevel(level: unknown): LogLevel {
    if (typeof level !== 'string') return 'info';
    const normalized = level.toLowerCase() as LogLevel;
    return VALID_LEVELS.includes(normalized) ? normalized : 'info';
  }

  private static normalizeSubsystem(subsystem: unknown): string {
    if (typeof subsystem !== 'string' || !subsystem) return 'unknown';
    return subsystem.length > 100 ? subsystem.substring(0, 100) : subsystem;
  }

  private static normalizeMessage(message: unknown): string {
    if (typeof message !== 'string' || !message) return 'No message';
    return message.length > 10000 ? message.substring(0, 9997) + '[...]' : message;
  }

  private parseOpenClawLog(parsed: OpenClawRawLog): Partial<LogEntry> {
    let subsystem = 'unknown';
    let message = 'No message';
    let level: LogLevel = 'info';
    let timestamp = new Date().toISOString();

    if (parsed._meta) {
      const meta = parsed._meta;
      timestamp = meta.date || parsed.time || timestamp;
      
      if (meta.logLevelName) {
        level = LogEntryModel.normalizeLevel(meta.logLevelName);
      } else if (meta.logLevelId) {
        const levelMap: Record<number, LogLevel> = { 1: 'trace', 2: 'debug', 3: 'info', 4: 'warn', 5: 'error', 6: 'fatal' };
        level = levelMap[meta.logLevelId] || 'info';
      }

      if (meta.name) {
        try {
          const nameObj = JSON.parse(meta.name);
          subsystem = nameObj.subsystem || meta.name;
        } catch {
          subsystem = meta.name || 'unknown';
        }
      } else if (meta.path?.fileName) {
        subsystem = meta.path.fileName.split('.')[0];
      }
    }

    if (typeof parsed[1] === 'string') {
      message = parsed[1];
    } else if (typeof parsed[2] === 'string') {
      message = parsed[2];
    }

    return {
      timestamp,
      level,
      subsystem: subsystem || 'unknown',
      message,
      metadata: { originalLog: parsed, meta: parsed._meta }
    };
  }

  static fromRawLine(line: string, sourceFile?: string): LogEntryModel | null {
    try {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const parsed = JSON.parse(trimmed) as OpenClawRawLog;

      if (parsed._meta || parsed[0] || parsed[1]) {
        const data = new LogEntryModel({}).parseOpenClawLog(parsed);
        return new LogEntryModel({
          ...data,
          sourceFile,
          parsedAt: new Date().toISOString()
        });
      }

      if (parsed.timestamp && parsed.level && parsed.message) {
        return new LogEntryModel({
          timestamp: parsed.timestamp,
          level: LogEntryModel.normalizeLevel(parsed.level),
          subsystem: parsed.subsystem || 'unknown',
          message: parsed.message,
          metadata: parsed.metadata,
          sourceFile,
          parsedAt: new Date().toISOString()
        });
      }

      return null;
    } catch {
      return null;
    }
  }

  toJSON(): LogEntry {
    return {
      id: this.id,
      timestamp: this.timestamp,
      level: this.level,
      subsystem: this.subsystem,
      message: this.message,
      metadata: this.metadata,
      correlationId: this.correlationId,
      sourceFile: this.sourceFile,
      parsedAt: this.parsedAt
    };
  }
}
