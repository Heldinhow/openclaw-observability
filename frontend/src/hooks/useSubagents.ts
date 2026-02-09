import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRunningSubagents,
  getSubagentHistory,
  getSubagentDetail as getSubagentDetailApi,
  searchSubagents,
  refreshSubagentCache,
} from '../services/api';
import type { SubagentFilters, Subagent } from '../types';

// Query keys for cache management
const subagentKeys = {
  all: ['subagents'] as const,
  running: (filters?: SubagentFilters) => 
    [...subagentKeys.all, 'running', filters] as const,
  history: (filters?: SubagentFilters) => 
    [...subagentKeys.all, 'history', filters] as const,
  detail: (id: string) => 
    [...subagentKeys.all, 'detail', id] as const,
  search: (query: string, filters?: SubagentFilters) => 
    [...subagentKeys.all, 'search', query, filters] as const,
};

// Polling interval in milliseconds (5 seconds for real-time updates)
const POLLING_INTERVAL = 5000;

/**
 * Hook for fetching running subagents with real-time polling
 */
export function useRunningSubagents(filters?: SubagentFilters) {
  return useQuery({
    queryKey: subagentKeys.running(filters),
    queryFn: () => getRunningSubagents(filters),
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: POLLING_INTERVAL / 2,
  });
}

/**
 * Hook for fetching subagent history
 */
export function useSubagentHistory(filters?: SubagentFilters) {
  return useQuery({
    queryKey: subagentKeys.history(filters),
    queryFn: () => getSubagentHistory(filters),
    staleTime: 60000, // 1 minute stale time for history
  });
}

/**
 * Hook for fetching subagent details
 */
export function useSubagentDetail(subagentId: string | null) {
  return useQuery({
    queryKey: subagentKeys.detail(subagentId || ''),
    queryFn: () => getSubagentDetailApi(subagentId!),
    enabled: !!subagentId,
    staleTime: 30000, // 30 seconds stale time
  });
}

/**
 * Hook for searching subagents
 */
export function useSearchSubagents(query: string, filters?: SubagentFilters) {
  return useQuery({
    queryKey: subagentKeys.search(query, filters),
    queryFn: () => searchSubagents(query, filters),
    enabled: query.length > 0,
    staleTime: 30000,
  });
}

/**
 * Hook for refreshing subagent cache
 */
export function useRefreshSubagentCache() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: refreshSubagentCache,
    onSuccess: () => {
      // Invalidate all subagent queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: subagentKeys.all });
    },
  });
}

// Re-export types for backward compatibility
export type { Subagent };
