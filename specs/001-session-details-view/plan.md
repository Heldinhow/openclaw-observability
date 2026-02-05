# Implementation Plan: Session Details View

**Branch**: `001-session-details-view` | **Date**: 2026-02-05 | **Spec**: [Link to spec.md](spec.md)
**Input**: Feature specification from `specs/001-session-details-view/spec.md`

## Summary

Build a session observability dashboard that automatically discovers opencode sessions from local storage files, displays them in a filterable table with titles, and allows users to click for full agent-user interaction history. Backend uses Node/Express with Redis cache (5-min TTL) via ioredis, frontend uses React/Vite with Tailwind dark theme. Integrates with existing observability infrastructure (logs/tasks).

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)  
**Primary Dependencies**: Node.js 20+, Express 4.x, React 18.x, Vite 5.x, Tailwind CSS 3.x, ioredis 5.x  
**Storage**: Redis for session caching (5-min TTL), direct file reads from ~/.local/share/opencode/storage/  
**Testing**: Jest 29.x (backend), Vitest 1.x (frontend)  
**Target Platform**: Linux server (backend), modern browsers (frontend)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: Session list load <5s, filter <2s, detail view <3s, refresh <10s  
**Constraints**: Port 3000 (backend), Port 5173 (frontend), dark theme required, no hardcoded production values  
**Scale/Scope**: 10-100 sessions, 1-10 projects, single-server deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Session Observability First | Auto-discover sessions from storage files | PASS | Direct reading from ~/.local/share/opencode/storage/ |
| I. Session Observability First | Cache session metadata in Redis (5-min TTL) | PASS | Fast reads with Redis cache |
| II. API-First Backend | RESTful API for all session operations | PASS | Endpoints for list, detail, refresh |
| II. API-First Backend | Redis cache with 5-min TTL | PASS | Performance-optimized caching |
| II. API-First Backend | Port 3000, structured logging | PASS | Configured in environment |
| III. Frontend Excellence | Dark-themed React/Vite UI | PASS | Tailwind dark mode class |
| III. Frontend Excellence | Filterable table with columns | PASS | Project, Session ID, Title, Updated, Messages, Status |
| III. Frontend Excellence | Session details on-click | PASS | Full interaction history panel |
| IV. Observability Integration | Emit structured logs | PASS | JSON logs to stdout |
| IV. Observability Integration | Report errors to task tracking | PASS | Frontend error boundary + API |
| V. Deployment Readiness | Ports 3000/5173, IP 76.13.101.17 | PASS | Environment-driven config |
| Technical Standards | TypeScript, ESLint, Prettier | PASS | Configured in project setup |
| Technical Standards | Jest (backend), Vitest (frontend) | PASS | Test frameworks specified |
| Development Workflow | Follow Specify methodology | PASS | Spec→Plan→Tasks→Implement |

## Project Structure

### Documentation (this feature)

```text
specs/001-session-details-view/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── types.ts
│   ├── services/
│   │   ├── discovery.ts
│   │   ├── messages.ts
│   │   └── cache.ts
│   ├── api/
│   │   ├── routes.ts
│   │   └── middleware/
│   └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/
│   │   ├── SessionTable.tsx
│   │   ├── SessionDetail.tsx
│   │   ├── Filters.tsx
│   │   └── Header.tsx
│   ├── pages/
│   │   └── Dashboard.tsx
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   │   └── useSessions.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── tests/
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

**Structure Decision**: Web application with separate backend and frontend directories. Backend handles session discovery from file system, caching with Redis, and API endpoints. Frontend provides dark-themed React dashboard with session table, filtering, and detail views.

## Complexity Tracking

No constitution violations requiring justification.

## Constitution Compliance (Post-Design Review)

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Session Observability First | Auto-discover sessions from file system | PASS | Direct reading from ~/.local/share/opencode/storage/ |
| I. Session Observability First | Cache session metadata in Redis (5-min TTL) | PASS | Fast reads with Redis cache |
| II. API-First Backend | RESTful API for all session operations | PASS | 5 endpoints defined in OpenAPI |
| II. API-First Backend | Redis cache with 5-min TTL | PASS | Performance-optimized caching |
| II. API-First Backend | Port 3000, structured logging | PASS | Environment-driven config |
| III. Frontend Excellence | Dark-themed React/Vite UI | PASS | Tailwind dark mode class |
| III. Frontend Excellence | Filterable table with columns | PASS | Project, Session ID, Title, Updated, Messages, Status |
| III. Frontend Excellence | Session details on-click | PASS | Full interaction history panel |
| IV. Observability Integration | Emit structured logs | PASS | JSON logs to stdout |
| IV. Observability Integration | Report errors to task tracking | PASS | Frontend error boundary + API |
| V. Deployment Readiness | Ports 3000/5173, IP 76.13.101.17 | PASS | Environment-driven config |
| Technical Standards | TypeScript, ESLint, Prettier | PASS | Configured in project setup |
| Technical Standards | Jest (backend), Vitest (frontend) | PASS | Test frameworks specified |
| Development Workflow | Follow Specify methodology | PASS | Spec→Plan→Tasks→Implement |
