# Implementation Plan: Subagents Dashboard Tab

**Branch**: `001-subagents-dashboard` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-subagents-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a new "Subagents" tab in the OpenClaw Observability dashboard that provides real-time visibility into running subagents and historical execution records. The feature enables administrators to monitor active subagents, filter and search execution history, and drill into detailed execution logs for debugging and analysis. The implementation follows a web application architecture with a React frontend and Express backend, leveraging existing Redis cache and file system log storage infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+  
**Primary Dependencies**: 
- Backend: Express 4.x, ioredis 5.x, Pino (structured logging)
- Frontend: React 18.x, Vite 5.x, Tailwind CSS 3.x, TanStack Query  
**Storage**: Redis (cache layer), File system (JSON Lines log files)  
**Testing**: Jest (backend), Vitest (frontend) - run via `npm test`  
**Target Platform**: Web application (Linux server deployment via Docker)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Sub-second response times, real-time updates within 5 seconds, support for 1000+ concurrent subagent records  
**Constraints**: 
- <200ms p95 for API responses
- Real-time updates without overwhelming Redis/file system
- Pagination required for datasets >100 records  
**Scale/Scope**: Single observability dashboard instance, multiple concurrent users, potentially thousands of historical subagent records

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ ALL PRINCIPLES COMPLIANT (Post-Phase 1 Re-evaluation)

### Principle I: API-First Architecture ✅
- [x] All data access flows through `/api/*` endpoints
  - **Implemented**: `GET /api/subagents/running`, `GET /api/subagents/history`, `GET /api/subagents/{id}`, `POST /api/subagents/search`, `POST /api/refresh`
  - **Location**: Documented in [contracts/openapi.yaml](./contracts/openapi.yaml)
- [x] Request/response contracts documented
  - **Implemented**: Complete OpenAPI 3.0 specification with all schemas (Subagent, SubagentDetail, LogEntry, PaginationInfo, ErrorResponse)
- [x] Backend remains stateless
  - **Verified**: No session state on backend; TanStack Query manages client-side cache; Redis used for shared state only

### Principle II: Observability by Design ✅
- [x] Structured logging plan defined (Pino)
  - **Implemented**: All service methods (cacheService, logReaderService, subagentService) will use Pino with correlation IDs
  - **Logging points**: API requests, cache hits/misses, file system reads, errors
- [x] Health check endpoint identified
  - **Verified**: `/api/health` validates Redis connectivity and file system access to log directories
- [x] Error tracking strategy defined
  - **Implemented**: `/api/errors` accepts frontend reports; all 500 errors include full context; error middleware standardizes responses

### Principle III: Testing Discipline ✅
- [x] Test strategy covers backend (`npm test`)
  - **Unit tests**: `subagentService.test.ts` - business logic, filtering, pagination
  - **Integration tests**: `redis.test.ts`, `logReader.test.ts` - external dependencies
  - **Contract tests**: `subagents.api.test.ts` - API endpoint validation
- [x] Test strategy covers frontend (`npm run test`)
  - **Component tests**: `SubagentsTab.test.tsx`, `SubagentDetail.test.tsx` - UI rendering, interactions
  - **Hook tests**: `useSubagents.test.ts` - TanStack Query hooks, caching behavior
- [x] Integration tests planned for cache and file system
  - **Redis**: Cache set/get/expiration, index management
  - **File System**: Log file reading, tail following, archive access

### Principle IV: Performance Through Caching ✅
- [x] Redis caching strategy defined
  - **Running subagents**: 5-second TTL (key: `subagents:running`)
  - **History**: 60-second TTL (key: `subagents:history:{filter_hash}`)
  - **Indexes**: `index:subagents:running`, `index:subagents:history:{date}` for efficient filtering
- [x] Cache invalidation plan documented
  - **Auto**: TTL expiration for time-sensitive data
  - **Manual**: `POST /api/refresh` clears all subagent cache keys
  - **Selective**: Index-based invalidation when new subagents start/complete
- [x] Response pagination considered for large datasets
  - **Backend**: Offset-based pagination with configurable limit (default 50, max 100)
  - **Frontend**: Virtualized scrolling for large lists; TanStack Query manages infinite scroll
  - **Validation**: Supports 1000+ records (SC-006)

### Principle V: Environment-Aware Configuration ✅
- [x] Environment variables identified
  - `REDIS_URL` - Redis connection string
  - `SUBAGENT_LOG_PATH` - Directory for subagent log files
  - `SUBAGENT_RETENTION_DAYS` - How long to keep historical data
  - `SUBAGENT_CACHE_TTL_RUNNING` - TTL for running subagents cache (seconds)
  - `SUBAGENT_CACHE_TTL_HISTORY` - TTL for history cache (seconds)
  - `SUBAGENT_POLLING_INTERVAL` - Frontend polling interval (milliseconds)
- [x] No hardcoded values in design
  - **Verified**: All timeouts, paths, limits, and retention periods are configurable
- [x] Docker deployment considered
  - **Verified**: Works with existing Docker Compose; no new infrastructure required; Redis and file system paths configurable for container environment

## Project Structure

### Documentation (this feature)

```text
specs/001-subagents-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── openapi.yaml     # API contract specification
│   └── schemas/         # JSON schemas for request/response validation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   └── subagents.ts       # Subagent API endpoints
│   │   └── middleware/
│   │       └── errorHandler.ts    # Error handling middleware
│   ├── services/
│   │   ├── subagentService.ts     # Business logic for subagents
│   │   ├── cacheService.ts        # Redis cache abstraction
│   │   └── logReaderService.ts    # File system log reading
│   ├── models/
│   │   └── subagent.ts            # Subagent entity types
│   └── config/
│       └── index.ts               # Environment configuration
├── tests/
│   ├── unit/
│   │   └── services/
│   │       └── subagentService.test.ts
│   ├── integration/
│   │   ├── redis.test.ts
│   │   └── logReader.test.ts
│   └── contract/
│       └── subagents.api.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── SubagentsTab.tsx       # Main tab container
│   │   ├── RunningSubagentsList.tsx
│   │   ├── SubagentHistoryList.tsx
│   │   ├── SubagentFilters.tsx
│   │   ├── SubagentSearch.tsx
│   │   └── SubagentDetail.tsx     # Detail view modal/page
│   ├── pages/
│   │   └── Dashboard/
│   │       └── SubagentsPage.tsx
│   ├── services/
│   │   └── subagentApi.ts         # API client for subagent endpoints
│   └── hooks/
│       └── useSubagents.ts        # TanStack Query hooks
├── tests/
│   ├── components/
│   │   ├── SubagentsTab.test.tsx
│   │   └── SubagentDetail.test.tsx
│   └── hooks/
│       └── useSubagents.test.ts
```

**Structure Decision**: Web application with separate backend and frontend directories. Backend follows service-oriented architecture with clear separation between API routes, business services, and data models. Frontend uses component-based React architecture with TanStack Query for server state management. This structure aligns with the existing 001-session-details-view feature structure and maintains consistency across the codebase.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
