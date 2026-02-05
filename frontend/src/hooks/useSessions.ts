import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, refreshSessions, getHealth, getSessionDetail } from '../services/api';
import type { SessionFilters } from '../types';

export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => getSessions(filters),
    refetchInterval: 60000,
  });
}

export function useRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30000,
  });
}

export function useSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSessionDetail(sessionId!),
    enabled: !!sessionId,
  });
}
