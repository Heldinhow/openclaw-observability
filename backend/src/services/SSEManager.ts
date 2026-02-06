import { Response } from 'express';
import { LogEntry, LogFilter } from '../types/log.types';
import { LogFilterModel } from '../models/LogFilter';

interface ClientConnection {
  id: string;
  response: Response;
  filter?: LogFilterModel;
  connectedAt: Date;
  lastEventId?: string;
  entriesDelivered: number;
  isPaused: boolean;
  bufferedEntries: LogEntry[];
}

/**
 * Manager for Server-Sent Events connections
 */
export class SSEManager {
  private clients: Map<string, ClientConnection> = new Map();
  private maxConnections: number;

  constructor(maxConnections: number = 100) {
    this.maxConnections = maxConnections;
  }

  /**
   * Add a new SSE client connection
   * @param clientId - Unique client identifier
   * @param response - Express response object
   * @param filter - Optional filter for this connection
   * @returns boolean indicating if connection was successful
   */
  addClient(clientId: string, response: Response, filter?: LogFilter): boolean {
    if (this.clients.size >= this.maxConnections) {
      console.warn(`SSEManager: Maximum connections (${this.maxConnections}) reached`);
      return false;
    }

    if (this.clients.has(clientId)) {
      console.warn(`SSEManager: Client ${clientId} already connected`);
      return false;
    }

    // Setup SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // Send initial connection event
    this.sendEvent(response, 'connected', {
      status: 'connected',
      timestamp: new Date().toISOString(),
      clientId
    });

    const connection: ClientConnection = {
      id: clientId,
      response,
      filter: filter ? new LogFilterModel(filter) : undefined,
      connectedAt: new Date(),
      entriesDelivered: 0,
      isPaused: false,
      bufferedEntries: []
    };

    this.clients.set(clientId, connection);
    console.log(`SSEManager: Client ${clientId} connected. Total clients: ${this.clients.size}`);

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });

    response.on('error', (error) => {
      console.error(`SSEManager: Error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    return true;
  }

  /**
   * Remove a client connection
   * @param clientId - Client identifier to remove
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`SSEManager: Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
      
      try {
        client.response.end();
      } catch (error) {
        // Client may already be disconnected
      }
    }
  }

  /**
   * Broadcast a log entry to all connected clients
   * @param entry - Log entry to broadcast
   */
  broadcast(entry: LogEntry): void {
    for (const [clientId, client] of this.clients) {
      try {
        // Skip if client is paused
        if (client.isPaused) {
          client.bufferedEntries.push(entry);
          continue;
        }

        // Apply filter if set
        if (client.filter && !client.filter.matches(entry)) {
          continue;
        }

        // Send the entry
        this.sendEvent(client.response, 'log', entry, entry.id);
        client.entriesDelivered++;
        client.lastEventId = entry.id;
      } catch (error) {
        console.error(`SSEManager: Failed to send to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Send an error event to all clients
   * @param message - Error message
   * @param retryAfter - Milliseconds to wait before retry (for auto-reconnect)
   */
  broadcastError(message: string, retryAfter: number = 5000): void {
    for (const [clientId, client] of this.clients) {
      try {
        this.sendEvent(client.response, 'error', {
          message,
          retry: retryAfter
        });
      } catch (error) {
        console.error(`SSEManager: Failed to send error to client ${clientId}:`, error);
      }
    }
  }

  /**
   * Pause streaming for a specific client
   * @param clientId - Client to pause
   */
  pauseClient(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    client.isPaused = true;
    console.log(`SSEManager: Client ${clientId} paused`);
    return true;
  }

  /**
   * Resume streaming for a specific client
   * @param clientId - Client to resume
   */
  resumeClient(clientId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    client.isPaused = false;

    // Send buffered entries
    for (const entry of client.bufferedEntries) {
      if (client.filter && !client.filter.matches(entry)) {
        continue;
      }

      try {
        this.sendEvent(client.response, 'log', entry, entry.id);
        client.entriesDelivered++;
      } catch (error) {
        console.error(`SSEManager: Failed to send buffered entry to client ${clientId}:`, error);
      }
    }

    const bufferedCount = client.bufferedEntries.length;
    client.bufferedEntries = [];

    console.log(`SSEManager: Client ${clientId} resumed. Sent ${bufferedCount} buffered entries.`);
    return true;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalClients: number;
    pausedClients: number;
    totalEntriesDelivered: number;
  } {
    let totalEntriesDelivered = 0;
    let pausedClients = 0;

    for (const client of this.clients.values()) {
      totalEntriesDelivered += client.entriesDelivered;
      if (client.isPaused) {
        pausedClients++;
      }
    }

    return {
      totalClients: this.clients.size,
      pausedClients,
      totalEntriesDelivered
    };
  }

  /**
   * Get list of connected client IDs
   */
  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if a client is connected
   */
  hasClient(clientId: string): boolean {
    return this.clients.has(clientId);
  }

  /**
   * Update filter for a specific client
   */
  updateClientFilter(clientId: string, filter: LogFilter): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    client.filter = new LogFilterModel(filter);
    return true;
  }

  /**
   * Send an SSE event
   */
  private sendEvent(
    response: Response,
    event: string,
    data: unknown,
    id?: string
  ): void {
    let message = '';
    
    if (id) {
      message += `id: ${id}\n`;
    }
    
    message += `event: ${event}\n`;
    message += `data: ${JSON.stringify(data)}\n\n`;

    response.write(message);
  }

  /**
   * Close all connections and cleanup
   */
  cleanup(): void {
    console.log(`SSEManager: Cleaning up ${this.clients.size} connections`);
    
    for (const [clientId, client] of this.clients) {
      try {
        this.sendEvent(client.response, 'closed', {
          message: 'Server shutting down',
          timestamp: new Date().toISOString()
        });
        client.response.end();
      } catch (error) {
        console.error(`SSEManager: Error closing client ${clientId}:`, error);
      }
    }
    
    this.clients.clear();
  }
}
