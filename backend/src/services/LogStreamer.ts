import * as Tail from 'tail';
import pino from 'pino';
import { LogEntry } from '../types/log.types';
import { LogParser } from './LogParser';
import { SSEManager } from './SSEManager';
import { LogFilterModel } from '../models/LogFilter';

const logger = pino({ name: 'LogStreamer' });

export interface LogStreamerOptions {
  logFilePath: string;
  sseManager: SSEManager;
  onError?: (error: Error) => void;
  onRotation?: (oldPath: string, newPath: string) => void;
}

export class LogStreamer {
  private tail: Tail | null = null;
  private options: LogStreamerOptions;
  private isRunning = false;
  private currentFilePath: string;
  private remainder = '';

  constructor(options: LogStreamerOptions) {
    this.options = options;
    this.currentFilePath = options.logFilePath;
  }

  /**
   * Start watching the log file
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('LogStreamer is already running');
      return;
    }

    logger.info(`Starting to watch log file: ${this.currentFilePath}`);

    try {
      this.tail = new Tail(this.currentFilePath, {
        separator: /\r?\n/,
        follow: true,
        useWatchFile: true,
        flushAtEOF: true
      });

      this.tail.on('line', (data) => {
        this.handleLine(data);
      });

      this.tail.on('error', (error) => {
        logger.error({ error: error.message }, 'Tail error');
        this.options.onError?.(error);
        
        // Broadcast error to all connected clients
        this.options.sseManager.broadcastError(`Log source error: ${error.message}`);
      });

      // Handle file rotation
      this.tail.on('rename', (filename) => {
        logger.info({ filename }, 'File renamed (possibly rotated)');
        this.handleFileRotation(filename);
      });

      // Handle when we reach EOF (initial load complete)
      this.tail.on('end', () => {
        logger.debug('Reached end of file');
      });

      this.isRunning = true;
      logger.info('LogStreamer started successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to start LogStreamer');
      throw error;
    }
  }

  /**
   * Stop watching the log file
   */
  stop(): void {
    if (!this.isRunning || !this.tail) {
      return;
    }

    logger.info('Stopping LogStreamer');

    try {
      this.tail.unwatch();
      this.tail = null;
      this.isRunning = false;
      logger.info('LogStreamer stopped successfully');
    } catch (error) {
      logger.error({ error }, 'Error stopping LogStreamer');
      throw error;
    }
  }

  /**
   * Get the current file being watched
   */
  getCurrentFilePath(): string {
    return this.currentFilePath;
  }

  /**
   * Check if the streamer is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Handle a new line from the tail
   */
  private handleLine(data: string): void {
    // Combine with any remainder from previous chunk
    const line = (this.remainder + data).trim();
    this.remainder = '';

    if (!line) {
      return;
    }

    const entry = LogParser.parseLine(line, this.currentFilePath);
    
    if (entry) {
      // Broadcast to all SSE clients
      this.options.sseManager.broadcast(entry);
      
      logger.debug({ 
        id: entry.id, 
        level: entry.level,
        subsystem: entry.subsystem 
      }, 'Broadcasting log entry');
    }
  }

  /**
   * Handle file rotation
   */
  private handleFileRotation(filename: string): void {
    logger.info({ filename }, 'File rotation detected');
    
    const oldPath = this.currentFilePath;
    
    // Update current file path
    this.currentFilePath = filename;
    
    // Notify via SSE
    this.options.sseManager.broadcastError('Log file rotated');
    
    // Callback for additional handling
    this.options.onRotation?.(oldPath, filename);

    // Restart tail on the new file
    this.restart(filename);
  }

  /**
   * Restart tailing on a new file
   */
  private restart(newFilePath: string): void {
    logger.info(`Restarting tail on new file: ${newFilePath}`);
    
    this.stop();
    
    this.currentFilePath = newFilePath;
    
    // Small delay to ensure file is ready
    setTimeout(() => {
      try {
        this.start();
      } catch (error) {
        logger.error({ error }, 'Failed to restart after rotation');
      }
    }, 100);
  }

  /**
   * Read historical logs from a file
   * @param filePath - Path to read from (defaults to current log file)
   * @param limit - Maximum number of lines to read
   * @returns Array of parsed log entries
   */
  async readHistoricalLogs(filePath?: string, limit: number = 100): Promise<LogEntry[]> {
    const path = filePath || this.currentFilePath;
    
    logger.debug({ path, limit }, 'Reading historical logs');

    try {
      const fs = await import('fs');
      const content = await fs.promises.readFile(path, 'utf-8');
      
      // Split into lines and take the last 'limit' lines
      const lines = content.split(/\r?\n/);
      const recentLines = lines.slice(-limit);
      
      return LogParser.parseLines(recentLines, path);
    } catch (error) {
      logger.error({ error, path }, 'Failed to read historical logs');
      throw error;
    }
  }

  /**
   * Read logs from a specific position (for pagination)
   * @param filePath - Path to read from
   * @param fromTimestamp - Only read entries after this timestamp
   * @param limit - Maximum number of lines to read
   * @returns Array of parsed log entries
   */
  async readLogsFromTimestamp(
    filePath: string,
    fromTimestamp: string,
    limit: number = 1000
  ): Promise<LogEntry[]> {
    logger.debug({ 
      filePath, 
      fromTimestamp, 
      limit 
    }, 'Reading logs from timestamp');

    try {
      const fs = await import('fs');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      const fromDate = new Date(fromTimestamp).getTime();
      const lines = content.split(/\r?\n/);
      
      const matchingEntries: LogEntry[] = [];
      
      for (const line of lines) {
        const entry = LogParser.parseLine(line, filePath);
        
        if (entry) {
          const entryDate = new Date(entry.timestamp).getTime();
          
          if (entryDate > fromDate) {
            matchingEntries.push(entry);
            
            if (matchingEntries.length >= limit) {
              break;
            }
          }
        }
      }
      
      return matchingEntries;
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to read logs from timestamp');
      throw error;
    }
  }
}
