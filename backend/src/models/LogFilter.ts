import { LogFilter, LogLevel } from '../types/log.types';

const VALID_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export class LogFilterModel implements LogFilter {
  levels?: LogLevel[];
  searchText?: string;
  subsystem?: string;
  timeRange?: {
    start?: string;
    end?: string;
  };

  constructor(data: Partial<LogFilter> = {}) {
    if (data.levels) {
      this.levels = this.validateLevels(data.levels);
    }
    
    if (data.searchText) {
      this.searchText = this.validateSearchText(data.searchText);
    }
    
    if (data.subsystem) {
      this.subsystem = this.validateSubsystem(data.subsystem);
    }
    
    if (data.timeRange) {
      this.timeRange = this.validateTimeRange(data.timeRange);
    }
  }

  private validateLevels(levels: unknown[]): LogLevel[] {
    if (!Array.isArray(levels)) {
      throw new Error('Levels must be an array');
    }

    return levels.map(level => {
      const strLevel = String(level).toLowerCase() as LogLevel;
      if (!VALID_LEVELS.includes(strLevel)) {
        throw new Error(`Invalid level: ${level}`);
      }
      return strLevel;
    });
  }

  private validateSearchText(searchText: string): string {
    if (typeof searchText !== 'string') {
      throw new Error('Search text must be a string');
    }

    if (searchText.length > 500) {
      throw new Error('Search text must not exceed 500 characters');
    }

    return searchText;
  }

  private validateSubsystem(subsystem: string): string {
    if (typeof subsystem !== 'string') {
      throw new Error('Subsystem must be a string');
    }

    if (subsystem.length > 100) {
      throw new Error('Subsystem must not exceed 100 characters');
    }

    return subsystem;
  }

  private validateTimeRange(timeRange: { start?: string; end?: string }): { start?: string; end?: string } {
    const validated: { start?: string; end?: string } = {};

    if (timeRange.start) {
      const startDate = new Date(timeRange.start);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start time');
      }
      validated.start = timeRange.start;
    }

    if (timeRange.end) {
      const endDate = new Date(timeRange.end);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end time');
      }
      validated.end = timeRange.end;
    }

    // Validate start <= end
    if (validated.start && validated.end) {
      const startDate = new Date(validated.start);
      const endDate = new Date(validated.end);
      if (startDate > endDate) {
        throw new Error('Start time must be before or equal to end time');
      }
    }

    return validated;
  }

  /**
   * Check if a log entry matches this filter
   */
  matches(entry: { level: LogLevel; subsystem: string; message: string; metadata?: Record<string, unknown> }): boolean {
    // Check levels
    if (this.levels && this.levels.length > 0) {
      if (!this.levels.includes(entry.level)) {
        return false;
      }
    }

    // Check subsystem (supports wildcards with *)
    if (this.subsystem) {
      if (!this.matchSubsystem(entry.subsystem, this.subsystem)) {
        return false;
      }
    }

    // Check search text (matches message or metadata)
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchLower);
      
      let metadataMatch = false;
      if (entry.metadata) {
        metadataMatch = JSON.stringify(entry.metadata).toLowerCase().includes(searchLower);
      }

      if (!messageMatch && !metadataMatch) {
        return false;
      }
    }

    return true;
  }

  private matchSubsystem(entrySubsystem: string, filterSubsystem: string): boolean {
    // Convert wildcard pattern to regex
    const pattern = filterSubsystem
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except *
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${pattern}$`);
    return regex.test(entrySubsystem);
  }

  toJSON(): LogFilter {
    const result: LogFilter = {};
    if (this.levels) result.levels = this.levels;
    if (this.searchText) result.searchText = this.searchText;
    if (this.subsystem) result.subsystem = this.subsystem;
    if (this.timeRange) result.timeRange = this.timeRange;
    return result;
  }
}
