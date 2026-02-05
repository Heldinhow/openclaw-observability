import axios from 'axios';
import type {
  Session,
  SessionDetailResponse,
  ProjectResponse,
  HealthResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://76.13.101.17:3000',
  timeout: 30000,
});

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

export default api;
