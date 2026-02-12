import axios from 'axios';
import type {
  Session,
  SessionDetailResponse,
  ProjectResponse,
  HealthResponse,
  ZenUsage,
  ZenModels,
  ZenStatus,
  SubagentDetail,
  SubagentListResponse,
  SubagentHistoryListResponse,
  SubagentFilters,
} from '../types';

export const api = axios.create({
  baseURL: '',
  timeout: 30000,
  withCredentials: false,
});

// No auth required - interceptors removed

export interface LoginResponse {
  token: string;
  username: string;
}

export interface ValidateResponse {
  valid: boolean;
  username?: string;
}

// Keep functions for compatibility but they do nothing
export async function login(_username: string, _password: string): Promise<string> {
  return 'no-auth';
}

export function logout(): void {
  // No-op
}

export function getToken(): string | null {
  return 'no-auth';
}

export function getUsername(): string | null {
  return 'admin';
}

export async function validateToken(): Promise<boolean> {
  return true;
}

export async function getSessions(filters?: {
  project?: string;
  status?: string;
  refresh?: boolean;
}): Promise<{ sessions: Session[]; meta: { total: number; cachedAt: string } }> {
  const params = new URLSearchParams();
  if (filters?.project) params.append('project', filters.project);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.refresh) params.append('refresh', 'true');

  const response = await api.get(`/api/sessions?${params.toString()}`);
  return response.data;
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
}

export async function getProjects(): Promise<ProjectResponse> {
  const response = await api.get('/api/projects');
  return response.data;
}

export async function refreshSessions(): Promise<{ status: string }> {
  const response = await api.post('/api/refresh');
  return response.data;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await api.get('/api/health');
  return response.data;
}

export async function reportError(error: {
  error: string;
  stack?: string;
  url?: string;
  timestamp?: number;
}): Promise<void> {
  await api.post('/api/errors', error);
}

export async function getZenUsage(): Promise<ZenUsage> {
  const response = await api.get('/api/zen/usage');
  return response.data;
}

export async function getZenModels(): Promise<ZenModels> {
  const response = await api.get('/api/zen/models');
  return response.data;
}

export async function getZenStatus(): Promise<ZenStatus> {
  const response = await api.get('/api/zen/status');
  return response.data;
}

export async function getRunningSubagents(
  filters?: SubagentFilters
): Promise<SubagentListResponse> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const response = await api.get(`/api/subagents/running?${params.toString()}`);
  return response.data;
}

export async function getSubagentHistory(
  filters?: SubagentFilters
): Promise<SubagentHistoryListResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', String(filters.status));
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const response = await api.get(`/api/subagents/history?${params.toString()}`);
  return response.data;
}

export async function getSubagentDetail(
  subagentId: string
): Promise<{ data: SubagentDetail }> {
  const response = await api.get(`/api/subagents/${subagentId}`);
  return response.data;
}

export async function searchSubagents(
  search: string,
  filters?: SubagentFilters
): Promise<SubagentListResponse> {
  const response = await api.post('/api/subagents/search', {
    search,
    status: filters?.status,
    from: filters?.from,
    to: filters?.to,
    taskId: filters?.taskId,
    sessionId: filters?.sessionId,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
  });
  return response.data;
}

export async function refreshSubagentCache(): Promise<{
  message: string;
  invalidatedKeys: number;
}> {
  const response = await api.post('/api/subagents/refresh');
  return response.data;
}

export default api;
