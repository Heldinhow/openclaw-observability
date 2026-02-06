# Implementation Plan: Real-time Logs Viewer

**Branch**: `002-realtime-logs-tab` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-realtime-logs-tab/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a real-time logs viewer tab in the OpenClaw Observability Dashboard that streams OpenClaw gateway logs live, allows filtering/searching, and displays detailed log information in a side panel with syntax highlighting. The feature enables developers to monitor system activity and debug issues in real-time.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: 
- Backend: Express 4.x, ioredis 5.x, Pino (logging), node-tail (file watching)
- Frontend: React 18.x, Vite 5.x, TanStack Query, Tailwind CSS 3.x
**Storage**: File system (OpenClaw log files in JSON Lines format), Redis (cache layer)  
**Testing**: Jest (backend), Vitest (frontend), Supertest (API testing)  
**Target Platform**: Linux server, Modern web browsers  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: 
- <2s latency from log generation to display
- Sub-second filtering response
- Responsive with 10K entries loaded  
**Constraints**: 
- 250 entry memory limit on client
- Auto-retry on disconnect (5s intervals)
- Log file rotation handling  
**Scale/Scope**: Single-instance OpenClaw gateway, up to 1000 log entries/minute

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: API-First Architecture
- [x] All data access flows through `/api/*` endpoints
  - `/api/logs` - GET historical logs with pagination
  - `/api/logs/stream` - SSE endpoint for real-time log streaming
  - `/api/logs/filter` - POST filtered log queries
- [x] Request/response contracts documented
  - Will document in OpenAPI format in contracts/
- [x] Backend remains stateless
  - Stream state managed via SSE connections, no session state

### Principle II: Observability by Design
- [x] Structured logging plan defined (Pino)
  - All log operations logged with correlation IDs
- [x] Health check endpoint identified
  - Extend existing `/api/health` to include log source connectivity
- [x] Error tracking strategy defined
  - File watching errors, SSE connection errors tracked

### Principle III: Testing Discipline
- [x] Test strategy covers backend (`npm test`)
  - Unit tests for log parsing, stream management
  - Integration tests for file watching, SSE endpoints
- [x] Test strategy covers frontend (`npm run test`)
  - Component tests for log list, detail panel
  - Integration tests for stream connection, filtering
- [x] Integration tests planned for cache and file system
  - Redis cache integration for log buffering
  - File system integration for log tailing

### Principle IV: Performance Through Caching
- [x] Redis caching strategy defined
  - Cache recent logs (last 1000) in Redis for fast initial load
  - Cache TTL: 60 seconds for real-time data
- [x] Cache invalidation plan documented
  - `POST /api/logs/refresh` to invalidate cache
  - Automatic invalidation on log rotation detection
- [x] Response pagination considered for large datasets
  - Cursor-based pagination for historical logs
  - 100 entries per page default

### Principle V: Environment-Aware Configuration
- [x] Environment variables identified
  - `LOG_FILE_PATH` - Path to OpenClaw log files
  - `LOG_STREAM_MAX_CONNECTIONS` - SSE connection limit
  - `LOG_CACHE_TTL` - Redis cache TTL for logs
- [x] No hardcoded values in design
  - All paths, limits, and intervals configurable
- [x] Docker deployment considered
  - Log directory mounted as volume
  - Environment variables passed through docker-compose

## Project Structure

### Documentation (this feature)

```text
specs/002-realtime-logs-tab/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── openapi.yaml     # API specification
│   └── schemas/         # JSON schemas
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── routes/
│   │   └── logs.ts          # Log API endpoints including SSE
│   ├── services/
│   │   ├── LogStreamer.ts   # File watching and streaming logic
│   │   └── LogParser.ts     # JSON Lines parsing
│   └── models/
│       └── LogEntry.ts      # Log entry type definitions
└── tests/
    ├── integration/
    │   └── logs.test.ts     # API integration tests
    └── unit/
        └── LogStreamer.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── logs/
│   │   │   ├── LogList.tsx       # Real-time log list
│   │   │   ├── LogDetailPanel.tsx # Side panel detail view
│   │   │   ├── LogFilter.tsx     # Filter controls
│   │   │   └── LogStream.tsx     # Stream management hook
│   │   └── common/
│   │       └── SyntaxHighlight.tsx # Code/syntax highlighter
│   ├── hooks/
│   │   └── useLogStream.ts       # SSE connection management
│   └── pages/
│       └── LogsTab.tsx           # Main logs tab page
└── tests/
    ├── integration/
    │   └── LogList.test.tsx
    └── unit/
        └── LogDetailPanel.test.tsx
```

**Structure Decision**: Web application (Option 2) - maintains existing backend/frontend separation. Backend handles file watching and SSE streaming, frontend manages real-time display and user interactions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. All constitution principles can be satisfied with the planned design.

## Phase 0: Research & Technology Decisions

### Unknowns to Resolve

1. **Real-time Streaming Protocol**: SSE vs WebSocket
   - **Research**: Compare Server-Sent Events vs WebSocket for one-way log streaming
   - **Decision Factors**: Browser support, reconnection handling, infrastructure complexity

2. **File Watching Strategy**: node-tail vs fs.watch
   - **Research**: Evaluate file watching libraries for log tailing
   - **Decision Factors**: Cross-platform support, log rotation handling, performance

3. **Syntax Highlighting**: Prism.js vs highlight.js vs react-syntax-highlighter
   - **Research**: Compare syntax highlighting libraries for React
   - **Decision Factors**: Bundle size, JSON support, performance with large logs

4. **Log Parsing Performance**: Streaming parser vs batch parsing
   - **Research**: Best practices for parsing JSON Lines at scale
   - **Decision Factors**: Memory usage, parsing speed, error recovery

### Research Findings

See [research.md](./research.md) for detailed findings.

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for entity definitions.

Key entities:
- **LogEntry**: timestamp, level, subsystem, message, metadata, correlationId
- **LogStream**: connection state, filters, client info
- **LogFilter**: level[], searchText, timeRange

### API Contracts

See [contracts/openapi.yaml](./contracts/openapi.yaml) for full specification.

Key endpoints:
- `GET /api/logs` - Query historical logs with pagination
- `GET /api/logs/stream` - SSE endpoint for real-time streaming
- `POST /api/logs/filter` - Apply filters to log stream

### Quick Start

See [quickstart.md](./quickstart.md) for development setup.
