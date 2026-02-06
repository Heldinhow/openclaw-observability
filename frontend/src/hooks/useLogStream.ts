import { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, LogFilterOptions } from '../types/log.types';
import axios from 'axios';

interface UseLogStreamOptions {
  initialFilter?: LogFilterOptions;
  onError?: (error: Event) => void;
  onReconnect?: () => void;
}

export function useLogStream(options: UseLogStreamOptions = {}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInitialLogs = useCallback(async () => {
    try {
      const response = await axios.get('/api/logs', {
        params: { limit: 100 }
      });
      if (response.data.entries) {
        const historicalLogs: LogEntry[] = response.data.entries.map((entry: any) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          level: entry.level,
          service: entry.subsystem || entry.service || 'unknown',
          subsystem: entry.subsystem || entry.service || 'unknown',
          message: entry.message,
          metadata: entry.metadata,
        }));
        setLogs(historicalLogs);
      }
    } catch (e) {
      console.error('Failed to load initial logs:', e);
    }
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams();
    if (options.initialFilter?.levels?.length) {
      params.set('level', options.initialFilter.levels.join(','));
    }
    if (options.initialFilter?.services?.length) {
      params.set('subsystem', options.initialFilter.services.join(','));
    }
    if (options.initialFilter?.search) {
      params.set('search', options.initialFilter.search);
    }

    const url = `/api/logs/stream?${params.toString()}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      setIsPaused(false);
    };

    eventSource.onmessage = (event) => {
      if (isPaused) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log' && data.entry) {
          const newEntry: LogEntry = {
            id: data.entry.id || crypto.randomUUID(),
            timestamp: data.entry.timestamp || new Date().toISOString(),
            level: data.entry.level || 'info',
            message: data.entry.message || '',
            service: data.entry.service || data.entry.subsystem || 'unknown',
            subsystem: data.entry.subsystem || data.entry.service || 'unknown',
            metadata: data.entry.metadata,
          };
          setLogs((prev) => [newEntry, ...prev].slice(0, 250));
        }
      } catch (e) {
        console.error('Failed to parse log entry:', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      options.onError?.(new Event('error'));

      eventSource.close();
      eventSourceRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
        options.onReconnect?.();
      }, 3000);
    };

    eventSourceRef.current = eventSource;
  }, [options.initialFilter, options.onError, options.onReconnect, isPaused]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const updateFilter = useCallback((_filter: LogFilterOptions) => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  const clearEntries = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    loadInitialLogs();
    connect();
    return () => {
      disconnect();
    };
  }, [loadInitialLogs, connect, disconnect]);

  return {
    logs,
    isConnected,
    isPaused,
    connect,
    disconnect,
    pause,
    resume,
    updateFilter,
    clearEntries,
    streamState: {
      entries: logs,
      isPaused,
    },
    streamStatus: {
      isConnected,
      isPaused,
      entriesInMemory: logs.length,
    },
  };
}
