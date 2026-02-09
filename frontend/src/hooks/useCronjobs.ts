import { useState, useEffect, useCallback } from 'react';

export interface Cronjob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  nextRun?: number;
  lastRun?: number;
  lastStatus?: 'ok' | 'error' | 'idle';
  lastDurationMs?: number;
  enabled: boolean;
}

export interface CronRun {
  id: string;
  jobId: string;
  timestamp: number;
  status: 'ok' | 'error';
  summary?: string;
  error?: string;
  durationMs: number;
  nextRunAtMs?: number;
}

export interface CronHistoryResponse {
  jobId: string;
  jobName: string;
  runs: CronRun[];
  totalRuns: number;
}

export interface QueueTask {
  id?: string;
  task: string;
  status: 'ready' | 'in-progress' | 'blocked' | 'done';
  timestamp?: string;
}

export interface QueueData {
  ready: QueueTask[];
  inProgress: QueueTask[];
  blocked: QueueTask[];
  done: QueueTask[];
}

export interface CronjobsData {
  cronjobs: Cronjob[];
}

export function useCronjobs() {
  const [cronjobs, setCronjobs] = useState<Cronjob[]>([]);
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCronjobs = async () => {
    try {
      const response = await fetch('/api/cronjobs');
      if (!response.ok) throw new Error('Failed to fetch cronjobs');
      const data: CronjobsData = await response.json();
      setCronjobs(data.cronjobs || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching cronjobs:', err);
      setCronjobs([]);
    }
  };

  const fetchCronHistory = useCallback(async (jobId: string, limit = 50): Promise<CronHistoryResponse | null> => {
    try {
      const response = await fetch(`/api/cronjobs/${jobId}/history?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch cron history');
      return await response.json();
    } catch (err) {
      console.error('Error fetching cron history:', err);
      return null;
    }
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/cronjobs/queue');
      if (!response.ok) throw new Error('Failed to fetch queue');
      const data = await response.json();
      setQueue(data.queue || { ready: [], inProgress: [], blocked: [], done: [] });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching queue:', err);
      setQueue({ ready: [], inProgress: [], blocked: [], done: [] });
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCronjobs(), fetchQueue()]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    try {
      await fetch('/api/cronjobs/refresh', { method: 'POST' });
      await fetchAll();
    } catch (err) {
      console.error('Error refreshing cronjobs:', err);
    }
  };

  useEffect(() => {
    fetchAll();

    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    cronjobs,
    queue,
    isLoading,
    error,
    lastUpdated,
    refresh,
    refetch: fetchAll,
    fetchCronHistory,
  };
}
