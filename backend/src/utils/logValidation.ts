import { LogLevel } from '../types/log.types';

const VALID_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/**
 * Validate log entry data structure
 */
export function validateLogEntry(data: unknown): {
  valid: boolean;
  errors: string[];
  sanitized?: Record<string, unknown>;
} {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Data must be an object']
    };
  }

  const entry = data as Record<string, unknown>;

  // Validate timestamp
  if (!entry.timestamp) {
    errors.push('Missing required field: timestamp');
  } else if (typeof entry.timestamp !== 'string') {
    errors.push('timestamp must be a string');
  } else {
    const date = new Date(entry.timestamp);
    if (isNaN(date.getTime())) {
      errors.push('Invalid timestamp format');
    } else {
      sanitized.timestamp = entry.timestamp;
    }
  }

  // Validate level
  if (!entry.level) {
    errors.push('Missing required field: level');
  } else if (typeof entry.level !== 'string') {
    errors.push('level must be a string');
  } else {
    const normalizedLevel = entry.level.toLowerCase() as LogLevel;
    if (!VALID_LEVELS.includes(normalizedLevel)) {
      errors.push(`Invalid level: ${entry.level}. Must be one of: ${VALID_LEVELS.join(', ')}`);
    } else {
      sanitized.level = normalizedLevel;
    }
  }

  // Validate subsystem
  if (!entry.subsystem) {
    errors.push('Missing required field: subsystem');
  } else if (typeof entry.subsystem !== 'string') {
    errors.push('subsystem must be a string');
  } else if (entry.subsystem.length > 100) {
    errors.push('subsystem must not exceed 100 characters');
  } else {
    sanitized.subsystem = entry.subsystem;
  }

  // Validate message
  if (!entry.message) {
    errors.push('Missing required field: message');
  } else if (typeof entry.message !== 'string') {
    errors.push('message must be a string');
  } else {
    // Truncate if too long
    if (entry.message.length > 10000) {
      sanitized.message = entry.message.substring(0, 9997) + '[...]';
    } else {
      sanitized.message = entry.message;
    }
  }

  // Validate optional fields
  if (entry.correlationId !== undefined) {
    if (typeof entry.correlationId !== 'string') {
      errors.push('correlationId must be a string');
    } else if (!/^[a-zA-Z0-9-]+$/.test(entry.correlationId)) {
      errors.push('correlationId must be alphanumeric with dashes only');
    } else if (entry.correlationId.length > 64) {
      errors.push('correlationId must not exceed 64 characters');
    } else {
      sanitized.correlationId = entry.correlationId;
    }
  }

  if (entry.metadata !== undefined) {
    if (typeof entry.metadata === 'object' && entry.metadata !== null) {
      // Check for circular references
      try {
        JSON.stringify(entry.metadata);
        sanitized.metadata = entry.metadata;
      } catch {
        errors.push('metadata contains circular references');
      }
    } else {
      errors.push('metadata must be an object');
    }
  }

  if (entry.sourceFile !== undefined) {
    if (typeof entry.sourceFile === 'string') {
      sanitized.sourceFile = entry.sourceFile;
    }
  }

  sanitized.parsedAt = new Date().toISOString();
  sanitized.id = entry.id || generateUUID();

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate log filter data
 */
export function validateLogFilter(data: unknown): {
  valid: boolean;
  errors: string[];
  sanitized?: Record<string, unknown>;
} {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Filter must be an object']
    };
  }

  const filter = data as Record<string, unknown>;

  // Validate levels
  if (filter.levels !== undefined) {
    if (Array.isArray(filter.levels)) {
      const validLevels: LogLevel[] = [];
      for (const level of filter.levels) {
        const normalized = String(level).toLowerCase() as LogLevel;
        if (VALID_LEVELS.includes(normalized)) {
          validLevels.push(normalized);
        } else {
          errors.push(`Invalid level: ${level}`);
        }
      }
      if (validLevels.length > 0) {
        sanitized.levels = validLevels;
      }
    } else {
      errors.push('levels must be an array');
    }
  }

  // Validate searchText
  if (filter.searchText !== undefined) {
    if (typeof filter.searchText === 'string') {
      if (filter.searchText.length > 500) {
        errors.push('searchText must not exceed 500 characters');
      } else {
        sanitized.searchText = filter.searchText;
      }
    } else {
      errors.push('searchText must be a string');
    }
  }

  // Validate subsystem
  if (filter.subsystem !== undefined) {
    if (typeof filter.subsystem === 'string') {
      if (filter.subsystem.length > 100) {
        errors.push('subsystem must not exceed 100 characters');
      } else {
        sanitized.subsystem = filter.subsystem;
      }
    } else {
      errors.push('subsystem must be a string');
    }
  }

  // Validate timeRange
  if (filter.timeRange !== undefined) {
    if (typeof filter.timeRange === 'object' && filter.timeRange !== null) {
      const timeRange = filter.timeRange as Record<string, unknown>;
      const validatedRange: Record<string, string> = {};

      if (timeRange.start) {
        const startDate = new Date(String(timeRange.start));
        if (isNaN(startDate.getTime())) {
          errors.push('Invalid timeRange.start');
        } else {
          validatedRange.start = String(timeRange.start);
        }
      }

      if (timeRange.end) {
        const endDate = new Date(String(timeRange.end));
        if (isNaN(endDate.getTime())) {
          errors.push('Invalid timeRange.end');
        } else {
          validatedRange.end = String(timeRange.end);
        }
      }

      if (validatedRange.start && validatedRange.end) {
        if (new Date(validatedRange.start) > new Date(validatedRange.end)) {
          errors.push('timeRange.start must be before timeRange.end');
        }
      }

      sanitized.timeRange = validatedRange;
    } else {
      errors.push('timeRange must be an object');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Sanitize log message for safe display (XSS prevention)
 */
export function sanitizeForDisplay(message: string): string {
  // Replace potentially dangerous characters
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a value is a valid log level
 */
export function isValidLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && VALID_LEVELS.includes(value as LogLevel);
}
