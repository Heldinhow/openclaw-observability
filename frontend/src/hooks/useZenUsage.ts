import { useQuery } from '@tanstack/react-query';
import { getZenUsage, getZenModels, getZenStatus } from '../services/api';

export function useZenUsage() {
  return useQuery({
    queryKey: ['zen', 'usage'],
    queryFn: getZenUsage,
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
  });
}

export function useZenModels() {
  return useQuery({
    queryKey: ['zen', 'models'],
    queryFn: getZenModels,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useZenStatus() {
  return useQuery({
    queryKey: ['zen', 'status'],
    queryFn: getZenStatus,
    refetchInterval: 30000,
  });
}
