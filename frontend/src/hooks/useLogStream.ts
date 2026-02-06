import { useState, useEffect, useCallback, useRef } from 'react';
import { LogEntry, LogFilter, StreamStatus, StreamState } from '../types/log.types';

const MAX_ENTRIES = 250;
const RETRY_INTERVAL = 5000;

interface UseLogStreamOptions {
  initialFilter?: LogFilter;
  onError?: (error: string) => void;
  onReconnect?: () => void;
}

interface UseLogStreamReturn {
  state: StreamState;
  status: StreamStatus;
  connect: () => void;
  disconnect: () => void;
  pause: () => void;
  resume: () => void;
  updateFilter: (filter: LogFilter) => void;
  clearEntries: () => void;
}

export function useLogStream(options: UseLogStreamOptions = {}): UseLogStreamReturn {
  const { initialFilter, onError, onReconnect } = options;

  const [state, setState] = useState<StreamState>({
    status: 'closed',
    retryCount: 0,
    entries: []
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterRef = useRef<LogFilter | undefined>(initialFilter);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filterRef.current?.levels?.length) {
      params.set('level', filterRef.current.levels.join(','));
    }
    if (filterRef.current?.subsystem) {
      params.set('subsystem', filterRef.current.subsystem);
    }
    if (filterRef.current?.searchText) {
      params.set('search', filterRef.current.searchText);
    }

    const queryString = params.toString();
    return `/api/logs/stream${queryString ? `?${queryString}` : ''}`;
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState(prev => ({ ...prev, status: 'connecting', error: undefined }));

    try {
      const url = buildUrl();
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setState(prev => ({ 
          ...prev, 
          status: 'connected', 
          retryCount: 0,
          error: undefined 
        }));
        onReconnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.status === 'connected') {
            return;
          }

          if (data.id && data.timestamp && data.level) {
            const newEntry: LogEntry = {
              id: data.id,
              timestamp: data.timestamp,
              level: data.level,
              subsystem: data.subsystem || 'unknown',
              message: data.message || '',
              metadata: data.metadata,
              correlationId: data.correlationId,
              sourceFile: data.sourceFile,
              parsedAt: data.parsedAt
            };

            setState(prev => {
              const newEntries = [...prev.entries, newEntry];
              // Keep only last MAX_ENTRIES
              if (newEntries.length > MAX_ENTRIES) {
                return { ...prev, entries: newEntries.slice(-MAX_ENTRIES) };
              }
              return { ...prev, entries: newEntries };
            });
          }
        } catch (parseError) {
          console.error('Failed to parse log entry:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        
        setState(prev => ({ 
          ...prev, 
          status: 'error',
          retryCount: prev.retryCount + 1,
          error: 'Connection lost. Retrying...'
        }));

        onError?.('Connection lost. Retrying...');

        // Auto-retry after RETRY_INTERVAL
        retryTimeoutRef.current = setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connect();
          }
        }, RETRY_INTERVAL);
      };

      eventSource.addEventListener('error', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) {
            onError?.(data.message);
          }
          if (data.retry) {
            retryTimeoutRef.current = setTimeout(() => {
              connect();
            }, data.retry);
          }
        } catch {
          // Not an error event, ignore
        }
      });

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      setState(prev => ({ 
        ...prev, 
        status: 'error',
        error: 'Failed to connect'
      }));
    }
  }, [buildUrl, onError, onReconnect]);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      status: 'closed', 
      error: undefined,
      retryCount: 0 
    }));
  }, []);

  const pause = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, status: 'connecting' }));
    connect();
  }, [connect]);

  const updateFilter = useCallback((filter: LogFilter) => {
    filterRef.current = filter;
    disconnect();
    connect();
  }, [connect, disconnect]);

  const clearEntries = useCallback(() => {
    setState(prev => ({ ...prev, entries: [] }));
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const status: StreamStatus = {
    isConnected: state.status === 'connected',
    isPaused: state.status === 'paused',
    lastError: state.status === 'error' ? state.error || 'Unknown error' : null,
    lastErrorAt: state.status === 'error' ? new Date().toISOString() : null,
    entriesInMemory: state.entries.length,
    nextRetryAt: state.status === 'error' ? new Date(Date.now() + RETRY_INTERVAL).toISOString() : null
  };

  return {
    state,
    status,
    connect,
    disconnect,
    pause,
    resume,
    updateFilter,
    clearEntries
  };
}
