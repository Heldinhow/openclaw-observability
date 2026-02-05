export interface SessionTime {
  created: number;
  updated: number;
}

export interface SessionSummary {
  additions: number;
  deletions: number;
  files: number;
}

export interface Session {
  id: string;
  slug: string;
  version: string;
  projectID: string;
  directory: string;
  title: string;
  time: SessionTime;
  summary: SessionSummary;
  status: 'active' | 'inactive';
  messageCount: number;
}

export interface MessageTime {
  created: number;
  completed?: number;
}

export interface MessageModel {
  providerID: string;
  modelID: string;
}

export interface MessageMetadata {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  time: MessageTime;
  summary?: {
    title: string;
    diffs: unknown[];
  };
  agent?: string;
  model?: MessageModel;
}

export interface MessagePart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'text' | 'reasoning' | 'step-start' | 'step-finish';
  text?: string;
  reason?: string;
  time?: {
    start: number;
    end: number;
  };
}

export interface Message extends MessageMetadata {
  parts: MessagePart[];
}

export interface SessionDetailResponse extends Session {
  messages: Message[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  lastScanned: string;
  sessionCount?: number;
}

export interface ProjectResponse {
  projects: Project[];
}

export interface SessionsResponse {
  sessions: Session[];
  meta: {
    total: number;
    cachedAt: string;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  redisConnected: boolean;
  discoveryLatency: number;
  lastDiscovery: string;
}

export interface SessionFilters {
  project?: string;
  status?: 'active' | 'inactive' | 'all';
}
