export interface SessionTime {
  created: number;
  updated: number;
}

export interface SessionSummary {
  additions: number;
  deletions: number;
  files: number;
}

export interface SessionMetadata {
  id: string;
  slug: string;
  version: string;
  projectID: string;
  directory: string;
  title: string;
  time: SessionTime;
  summary: SessionSummary;
}

export interface Session extends SessionMetadata {
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
  parentID?: string;
  mode?: string;
  path?: {
    cwd: string;
    root: string;
  };
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache?: {
      read: number;
      write: number;
    };
  };
  finish?: string;
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
  metadata?: {
    anthropic?: {
      signature: string;
    };
  };
}

export interface Message extends MessageMetadata {
  parts: MessagePart[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  lastScanned: string;
  sessionCount?: number;
}

export interface SessionFilters {
  project?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface SessionsResponse {
  sessions: Session[];
  meta: {
    total: number;
    cachedAt: string;
  };
}

export interface SessionDetailResponse extends Session {
  messages: Message[];
}

export interface ProjectResponse {
  projects: Project[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  redisConnected: boolean;
  discoveryLatency: number;
  lastDiscovery: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
}

export interface RefreshResponse {
  status: 'started';
}

export interface CacheEntry {
  sessions: Session[];
  cachedAt: string;
}
