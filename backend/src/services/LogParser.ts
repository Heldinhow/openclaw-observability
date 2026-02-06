import { LogEntry } from '../types/log.types';
import { LogEntryModel } from '../models/LogEntry';

/**
 * Service for parsing log files in JSON Lines format
 */
export class LogParser {
  /**
   * Parse a single JSON Lines log entry
   * @param line - Raw log line from file
   * @param sourceFile - Optional source file path for tracking
   * @returns Parsed LogEntry or null if parsing fails
   */
  static parseLine(line: string, sourceFile?: string): LogEntry | null {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      return null;
    }

    return LogEntryModel.fromRawLine(trimmedLine, sourceFile)?.toJSON() || null;
  }

  /**
   * Parse multiple log lines
   * @param lines - Array of raw log lines
   * @param sourceFile - Optional source file path
   * @returns Array of successfully parsed LogEntry objects
   */
  static parseLines(lines: string[], sourceFile?: string): LogEntry[] {
    const entries: LogEntry[] = [];
    let errorCount = 0;

    for (const line of lines) {
      const entry = this.parseLine(line, sourceFile);
      if (entry) {
        entries.push(entry);
      } else {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      console.warn(`LogParser: Failed to parse ${errorCount} lines`);
    }

    return entries;
  }

  /**
   * Parse a chunk of log file content (may contain partial lines)
   * @param chunk - Raw file chunk
   * @param sourceFile - Optional source file path
   * @returns Object with parsed entries and any incomplete line to carry over
   */
  static parseChunk(chunk: string, sourceFile?: string): {
    entries: LogEntry[];
    remainder: string;
  } {
    const lines = chunk.split('\n');
    
    // Last line might be incomplete
    const remainder = lines.pop() || '';
    
    const entries = this.parseLines(lines, sourceFile);

    return {
      entries,
      remainder
    };
  }

  /**
   * Validate that a string is valid JSON Lines format
   * @param content - Content to validate
   * @returns Validation result with any errors found
   */
  static validateFormat(content: string): {
    valid: boolean;
    errors: string[];
    lineCount: number;
    validEntries: number;
  } {
    const errors: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    let validEntries = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      try {
        const parsed = JSON.parse(line);
        
        // Check for required fields
        if (!parsed.timestamp) {
          errors.push(`Line ${i + 1}: Missing 'timestamp' field`);
        }
        if (!parsed.level) {
          errors.push(`Line ${i + 1}: Missing 'level' field`);
        }
        if (!parsed.message) {
          errors.push(`Line ${i + 1}: Missing 'message' field`);
        }

        if (parsed.timestamp && parsed.level && parsed.message) {
          validEntries++;
        }
      } catch (error) {
        errors.push(`Line ${i + 1}: Invalid JSON - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      lineCount: lines.length,
      validEntries
    };
  }

  /**
   * Format a log entry for display
   * @param entry - Log entry to format
   * @returns Formatted string representation
   */
  static formatEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const level = entry.level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${level} ${entry.subsystem}: ${entry.message}`;
  }
}
