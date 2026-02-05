# Data Model: Session Details View

## Entities

### Session

Represents an opencode session with its metadata and current state.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | Required, UUID format | Unique session identifier from opencode |
| project | string | Required, max 255 chars | Project name derived from directory path |
| title | string | Required, max 255 chars | Session title (first user message or extracted) |
| status | 'active' \| 'inactive' | Required | Active if updated within 60 minutes |
| lastUpdated | Date | Required | Timestamp of last session activity |
| messageCount | number | Required, >= 0 | Total number of messages in session |
| cachedAt | Date | Required | Timestamp when this record was cached |

**Relationships**:
- One Session belongs to one Project
- One Session has many Messages

**State Transitions**:
- `inactive` → `active`: When session receives new messages
- `active` → `inactive`: When 60 minutes pass without activity

### Message

Represents a single communication within a session between agent and user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | Required, UUID format | Unique message identifier |
| sessionId | string | Required, FK to Session.id | Parent session |
| role | 'agent' \| 'user' | Required | Author attribution |
| content | string | Required | Message text content |
| timestamp | Date | Required | When message was created |

**Relationships**:
- Many Messages belong to one Session

**Validation Rules**:
- Messages must be ordered chronologically by timestamp within a session
- Content length is unbounded but UI truncates display at 2000 chars

### Project

Represents a project directory containing opencode sessions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| name | string | Required, max 255 chars | Project directory name |
| path | string | Required, absolute path | Full filesystem path to project |
| lastScanned | Date | Required | When project was last checked for sessions |

**Relationships**:
- One Project has many Sessions

**Validation Rules**:
- Path must exist and be readable
- Path must be within configured projects directory

## Redis Cache Structure

```typescript
// backend/src/types/cache.ts

interface CachedSessionList {
  sessions: Session[];
  cachedAt: string; // ISO timestamp
  ttl: number; // Seconds until expiration
}

interface CachedSessionDetail {
  session: Session;
  messages: Message[];
  cachedAt: string;
  ttl: number;
}

// Cache keys pattern
const CACHE_KEYS = {
  SESSIONS_LIST: 'opencode:sessions:list',
  SESSION_DETAIL: (sessionId: string) => `opencode:session:${sessionId}`,
  PROJECT_SESSIONS: (projectId: string) => `opencode:project:${projectId}:sessions`,
};

// TTL configuration
const CACHE_TTL = {
  SESSIONS_LIST: 300, // 5 minutes
  SESSION_DETAIL: 300, // 5 minutes
  PROJECT_SESSIONS: 300, // 5 minutes
};
```

## Data Flow

1. **Discovery**: Backend reads session JSON files from `~/.local/share/opencode/storage/session/`
2. **Caching**: Results stored in Redis with 5-minute TTL
3. **TTL Check**: On read, cached data served if exists and not expired
4. **API Response**: Backend returns cached data with metadata
5. **Frontend Display**: React Query caches API response, updates UI
6. **Detail View**: Click triggers message loading from `~/.local/share/opencode/storage/message/` and `~/.local/share/opencode/storage/part/`
