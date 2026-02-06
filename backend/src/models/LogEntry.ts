import { LogEntry, LogLevel } from '../types/log.types';
import { v4 as uuidv4 } from 'uuid';

const VALID_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

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
    this.level = this.validateLevel(data.level);
    this.subsystem = this.validateSubsystem(data.subsystem);
    this.message = this.validateMessage(data.message);
    this.metadata = data.metadata;
    this.correlationId = data.correlationId ? this.validateCorrelationId(data.correlationId) : undefined;
    this.sourceFile = data.sourceFile;
    this.parsedAt = data.parsedAt || new Date().toISOString();
  }

  private validateLevel(level: unknown): LogLevel {
    if (typeof level !== 'string') {
      throw new Error('Log level must be a string');
    }
    
    const normalizedLevel = level.toLowerCase() as LogLevel;
    if (!VALID_LEVELS.includes(normalizedLevel)) {
      throw new Error(`Invalid log level: ${level}. Must be one of: ${VALID_LEVELS.join(', ')}`);
    }
    
    return normalizedLevel;
  }

  private validateSubsystem(subsystem: unknown): string {
    if (typeof subsystem !== 'string' || subsystem.length === 0) {
      throw new Error('Subsystem must be a non-empty string');
    }
    
    if (subsystem.length > 100) {
      throw new Error('Subsystem must not exceed 100 characters');
    }
    
    return subsystem;
  }

  private validateMessage(message: unknown): string {
    if (typeof message !== 'string' || message.length === 0) {
      throw new Error('Message must be a non-empty string');
    }
    
    // Truncate if exceeds 10,000 chars
    if (message.length > 10000) {
      return message.substring(0, 9997) + '[...]';
    }
    
    return message;
  }

  private validateCorrelationId(correlationId: string): string {
    // Alphanumeric with dashes, max 64 chars
    const validPattern = /^[a-zA-Z0-9-]+$/;
    if (!validPattern.test(correlationId)) {
      throw new Error('CorrelationId must be alphanumeric with dashes only');
    }
    
    if (correlationId.length > 64) {
      throw new Error('CorrelationId must not exceed 64 characters');
    }
    
    return correlationId;
  }

  static fromRawLine(line: string, sourceFile?: string): LogEntryModel | null {
    try {
      const parsed = JSON.parse(line);
      
      // Validate required fields exist
      if (!parsed.timestamp || !parsed.level || !parsed.message) {
        console.warn('Missing required fields in log line:', line.substring(0, 100));
        return null;
      }

      return new LogEntryModel({
        ...parsed,
        sourceFile,
        parsedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to parse log line:', error instanceof Error ? error.message : 'Unknown error');
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
