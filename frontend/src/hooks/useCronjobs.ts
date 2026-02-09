import { useState, useEffect } from 'react';

export interface Cronjob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  nextRun?: number;
  lastRun?: number;
  status: 'ok' | 'error' | 'idle' | 'disabled';
  enabled: boolean;
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
      // Set empty data if fetch fails
      setCronjobs([]);
    }
  };

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
    
    // Refresh every 30 seconds
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
    refetch: fetchAll
  };
}
