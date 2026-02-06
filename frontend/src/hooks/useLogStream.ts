import { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, LogFilterOptions } from '../types/log.types';
import axios from 'axios';

interface UseLogStreamOptions {
  initialFilter?: LogFilterOptions;
  onError?: (error: Event) => void;
  onReconnect?: () => void;
  /** Polling interval in ms (default 5000) */
  pollInterval?: number;
}

export function useLogStream(options: UseLogStreamOptions = {}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logsPerSecond, setLogsPerSecond] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingTimestampsRef = useRef<number[]>([]);
  const lastTimestampRef = useRef<string | null>(null);
  const isPausedRef = useRef(isPaused);

  // Keep ref in sync so the interval callback sees the latest value
  isPausedRef.current = isPaused;

  const interval = options.pollInterval ?? 5000;

  // Calculate logs/sec every second based on a 5s sliding window
  useEffect(() => {
    rateIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const windowMs = 5000;
      incomingTimestampsRef.current = incomingTimestampsRef.current.filter(
        (ts) => now - ts < windowMs
      );
      const rate = incomingTimestampsRef.current.length / (windowMs / 1000);
      setLogsPerSecond(Math.round(rate * 10) / 10);
    }, 1000);

    return () => {
      if (rateIntervalRef.current) clearInterval(rateIntervalRef.current);
    };
  }, []);

  // Parse raw entries from the API into the frontend LogEntry shape
  const parseEntries = useCallback((raw: any[]): LogEntry[] => {
    return raw.map((entry: any) => ({
      id: entry.id || crypto.randomUUID(),
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level || 'info',
      service: entry.subsystem || entry.service || 'unknown',
      subsystem: entry.subsystem || entry.service || 'unknown',
      message: entry.message || '',
      metadata: entry.metadata,
      correlationId: entry.correlationId,
      sourceFile: entry.sourceFile,
    }));
  }, []);

  // Fetch logs from the API — used for both initial load and polling
  const fetchLogs = useCallback(async () => {
    if (isPausedRef.current) return;

    try {
      const params: Record<string, string> = { limit: '200' };

      // On subsequent fetches, only request logs newer than what we already have
      if (lastTimestampRef.current) {
        params.from = lastTimestampRef.current;
      }

      const response = await axios.get('/api/logs', { params });
      const entries: any[] = response.data.entries || [];

      if (entries.length === 0) {
        setIsConnected(true);
        return;
      }

      const parsed = parseEntries(entries);

      // Track new entries for rate calculation
      const now = Date.now();
      if (lastTimestampRef.current) {
        // Only count entries that are truly new (from polling, not initial load)
        parsed.forEach(() => incomingTimestampsRef.current.push(now));
      }

      setLogs((prev) => {
        // Merge: deduplicate by id, keep newest 500
        const existingIds = new Set(prev.map((l) => l.id));
        const newEntries = parsed.filter((l) => !existingIds.has(l.id));
        const merged = [...prev, ...newEntries];
        return merged.slice(-500);
      });

      // Update the watermark to the newest timestamp we've seen
      const newest = entries.reduce((max: string | null, e: any) => {
        if (!max) return e.timestamp;
        return e.timestamp > max ? e.timestamp : max;
      }, lastTimestampRef.current);
      if (newest) lastTimestampRef.current = newest;

      setIsConnected(true);
    } catch (e) {
      console.error('Failed to fetch logs:', e);
      setIsConnected(false);
      options.onError?.(new Event('error'));
    }
  }, [parseEntries, options.onError]);

  // Start polling
  const connect = useCallback(() => {
    // Initial fetch immediately
    fetchLogs();

    // Then poll every N seconds
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetchLogs();
    }, interval);

    setIsConnected(true);
  }, [fetchLogs, interval]);

  // Stop polling
  const disconnect = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    // Fetch immediately on resume to catch up
    fetchLogs();
  }, [fetchLogs]);

  const updateFilter = useCallback((_filter: LogFilterOptions) => {
    // Reset state and re-fetch with new filter
    lastTimestampRef.current = null;
    setLogs([]);
    fetchLogs();
  }, [fetchLogs]);

  const clearEntries = useCallback(() => {
    setLogs([]);
    lastTimestampRef.current = null;
    incomingTimestampsRef.current = [];
    setLogsPerSecond(0);
  }, []);

  // Start on mount, clean up on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    logs,
    isConnected,
    isPaused,
    logsPerSecond,
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
