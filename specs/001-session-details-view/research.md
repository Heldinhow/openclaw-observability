# Research: Session Details View

## Decision Log

### 1. Session Discovery and Parsing

**Decision**: Read session metadata directly from JSON files in `~/.local/share/opencode/storage/session/`

**Rationale**: Sessions are stored as JSON files in the opencode storage directory, not via CLI commands. This provides direct access to structured data without command parsing overhead.

**Storage Structure**:
```
~/.local/share/opencode/storage/
├── session/           # Session metadata files
│   ├── {projectID}/
│   │   └── ses_{sessionID}.json
│   └── global/        # Global sessions (no project)
├── message/          # Message metadata files
│   └── {sessionID}/
│       └── msg_{messageID}.json
└── part/             # Message content (text, reasoning, steps)
    └── {messageID}/
        └── prt_{partID}.json
```

**Session JSON Structure**:
```json
{
  "id": "ses_3d038909dffeIjxyqNg2a2jEOp",
  "slug": "cosmic-eagle",
  "version": "1.1.52",
  "projectID": "0157b84abfed6cb31d46fcf9ddd446fa81625bff",
  "directory": "/root/.openclaw/workspace/projects/openclaw-observability",
  "title": "Desfazer mudanças pendentes e subir aplicação",
  "time": {
    "created": 1770328125283,
    "updated": 1770328131345
  },
  "summary": {
    "additions": 0,
    "deletions": 0,
    "files": 0
  }
}
```

**Implementation Approach**:
```typescript
// backend/src/services/discovery.ts
interface SessionMetadata {
  id: string;
  slug: string;
  projectID: string;
  directory: string;
  title: string;
  time: { created: number; updated: number };
  summary: { additions: number; deletions: number; files: number };
}

async function discoverSessions(projectPath: string): Promise<SessionMetadata[]> {
  const sessionDir = path.join(os.homedir(), '.local/share/opencode/storage/session');
  const projects = await fs.promises.readdir(sessionDir);
  
  const sessions: SessionMetadata[] = [];
  for (const project of projects) {
    const projectPath = path.join(sessionDir, project);
    if (!project.startsWith('ses_') && !project.startsWith('global')) {
      const files = await fs.promises.readdir(projectPath);
      for (const file of files) {
        if (file.startsWith('ses_') && file.endsWith('.json')) {
          const content = await fs.promises.readFile(path.join(projectPath, file), 'utf-8');
          sessions.push(JSON.parse(content));
        }
      }
    }
  }
  return sessions;
}
```

### 2. Session Title Extraction

**Decision**: Session titles are stored directly in the session metadata file as `title` field.

**Rationale**: Unlike my earlier assumption, opencode stores the session title in the metadata file, auto-generated from the first user message. No additional extraction logic is needed.

**Implementation Approach**:
```typescript
interface SessionMetadata {
  id: string;
  title: string;
  time: { created: number; updated: number };
  // ... other fields
}

// Display title directly from session metadata
const displayTitle = session.title;
```

**Alternatives Considered**:
- Require manual title entry on session creation (rejected: adds friction, users forget)
- Generate titles via LLM summarization (rejected: too complex, adds latency)

### 3. Session Status Determination

**Decision**: Session status is determined by checking if the session has received a message in the last 60 minutes using the `time.updated` timestamp.

**Rationale**: "Active" sessions are those with recent activity. A 60-minute window balances responsiveness with avoiding false positives from stale but open sessions. The `time.updated` field in session metadata tracks the last update timestamp.

**Implementation Approach**:
```typescript
function determineStatus(lastUpdated: number): 'active' | 'inactive' {
  const sixtyMinutesAgo = Date.now() - 60 * 60 * 1000;
  return lastUpdated > sixtyMinutesAgo ? 'active' : 'inactive';
}
```

**Alternatives Considered**:
- Use opencode's internal session state (not exposed in storage)
- User-configurable status (rejected: adds complexity, status is factual not opinion)
- Shorter window (30min) (risks marking active sessions as inactive during pauses)

### 4. Conversation History Loading

**Decision**: Load messages from `~/.local/share/opencode/storage/message/{sessionID}/` and content from `~/.local/share/opencode/storage/part/{messageID}/`

**Rationale**: Messages are stored in two locations:
- Message metadata in `message/` directory (JSON with role, timestamps, tokens)
- Message content in `part/` directory (text, reasoning steps, etc.)

**Message Metadata Structure**:
```json
{
  "id": "msg_c2f92b7be001faCk021Pbevjqy",
  "sessionID": "ses_3d06d4844ffekChO3O6ujPFuKZ",
  "role": "user",
  "time": { "created": 1770324670411 },
  "summary": { "title": "OpenCLAW WhatsApp non-response inquiry" },
  "agent": "build",
  "model": { "providerID": "opencode", "modelID": "minimax-m2.1-free" }
}
```

**Message Part Structure** (content types: text, reasoning, step-start, step-finish):
```json
{
  "id": "prt_c2f92b7be002X72yWXitir3cMy",
  "sessionID": "ses_3d06d4844ffekChO3O6ujPFuKZ",
  "messageID": "msg_c2f92b7be001faCk021Pbevjqy",
  "type": "text",
  "text": "pq o meu openclaw parou de me responder no whatsapp?"
}
```

**Implementation Approach**:
```typescript
interface MessagePart {
  id: string;
  type: 'text' | 'reasoning' | 'step-start' | 'step-finish';
  text?: string;
  reason?: string;
  time?: { start: number; end: number };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  time: { created: number };
  parts: MessagePart[];
}

async function loadConversationHistory(sessionId: string): Promise<Message[]> {
  const messageDir = path.join(
    os.homedir(),
    '.local/share/opencode/storage/message',
    sessionId
  );
  
  const files = await fs.promises.readdir(messageDir);
  const messages: Message[] = [];
  
  for (const file of files) {
    if (file.startsWith('msg_') && file.endsWith('.json')) {
      const metadata = JSON.parse(
        await fs.promises.readFile(path.join(messageDir, file), 'utf-8')
      );
      
      const partsDir = path.join(
        os.homedir(),
        '.local/share/opencode/storage/part',
        metadata.id
      );
      
      const parts: MessagePart[] = [];
      if (await dirExists(partsDir)) {
        const partFiles = await fs.promises.readdir(partsDir);
        for (const partFile of partFiles) {
          if (partFile.startsWith('prt_')) {
            parts.push(JSON.parse(
              await fs.promises.readFile(path.join(partsDir, partFile), 'utf-8')
            ));
          }
        }
      }
      
      messages.push({ ...metadata, parts });
    }
  }
  
  return messages.sort((a, b) => a.time.created - b.time.created);
}
```

**Alternatives Considered**:
- Store cached history in SQLite (adds complexity, history changes infrequently)
- Real-time streaming (overkill for dashboard use case)

### 5. Observability Integration

**Decision**: Emit structured JSON logs to stdout and HTTP POST errors to task tracking API.

**Rationale**: Standard observability patterns: logs go to stdout (collected by container runtime), errors go to dedicated tracking system. The constitution specifies integration with existing infrastructure.

**Implementation Approach**:
```typescript
// Backend logging
function logDiscovery(sessions: Session[]): void {
  console.log(JSON.stringify({
    level: 'info',
    event: 'session_discovery',
    count: sessions.length,
    timestamp: new Date().toISOString()
  }));
}

// Frontend error reporting
async function reportError(error: Error): Promise<void> {
  await fetch('/api/tasks/errors', {
    method: 'POST',
    body: JSON.stringify({
      error: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now()
    })
  });
}
```

**Alternatives Considered**:
- Use existing logging library (e.g., winston) (adds dependency, stdout is sufficient)
- Batch error reporting (delays visibility, complexity not justified)

### 6. Redis Cache Architecture

**Decision**: Use ioredis for synchronous Redis operations with 5-minute TTL per entry.

**Rationale**: Redis provides fast in-memory caching with automatic expiration. The 5-minute TTL balances performance with data freshness. File system remains the source of truth.

**Implementation Approach**:
```typescript
// backend/src/services/cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  lazyConnect: true
});

const SESSION_CACHE_TTL = 300; // 5 minutes in seconds
const CACHE_KEYS = {
  SESSIONS: 'sessions:list',
  SESSION: (id: string) => `session:${id}`,
};

async function getCachedSessions(): Promise<SessionMetadata[] | null> {
  const cached = await redis.get(CACHE_KEYS.SESSIONS);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedSessions(sessions: SessionMetadata[]): Promise<void> {
  await redis.setex(
    CACHE_KEYS.SESSIONS,
    SESSION_CACHE_TTL,
    JSON.stringify(sessions)
  );
}

async function invalidateCache(): Promise<void> {
  await redis.del(CACHE_KEYS.SESSIONS);
}
```

**Alternatives Considered**:
- In-memory cache only (rejected: data loss on restart, no persistence)
- SQLite (rejected: Redis is faster for frequent reads)

### 7. Frontend State Management

**Decision**: Use React Query (TanStack Query) for server state, local state for UI interactions.

**Rationale**: React Query provides caching, refetching, and loading states out of the box. Minimal local state needed for filters and detail panel visibility.

**Implementation Approach**:
```typescript
// useSessions hook
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
    refetchInterval: 30000 // 30s auto-refresh
  });
}
```

**Alternatives Considered**:
- Redux (adds boilerplate, overkill for this scope)
- Context API (sufficient but less optimized for server state)

## Best Practices Applied

1. **Command Execution**: Use child_process with timeout to prevent hanging
2. **Error Handling**: Graceful degradation when commands fail
3. **Performance**: Batch project scans, parallel discovery
4. **Security**: Validate all paths, sanitize command inputs
5. **Observability**: Structured logging enables log aggregation
