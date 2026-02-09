# Implementation Tasks: Subagents Dashboard Tab

**Branch**: `001-subagents-dashboard`  
**Date**: 2026-02-09  
**Based on**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml)

---

## Implementation Strategy

**MVP Scope**: User Stories 1 & 2 (P1) provide core value - real-time visibility and historical tracking. These can be implemented independently and delivered as a working MVP.

**Incremental Delivery**:
1. Phase 1-2: Setup and foundational infrastructure
2. Phase 3: US1 - Real-time running subagents (MVP)
3. Phase 4: US2 - Historical execution records (MVP complete)
4. Phase 5: US3 - Search and filter (enhancement)
5. Phase 6: US4 - Detail view (enhancement)
6. Phase 7: Polish and cross-cutting concerns

**Testing Approach**: Tests are included as optional tasks. Run `/speckit.test --tdd` if TDD approach is desired.

---

## Phase 1: Project Setup

**Goal**: Initialize backend and frontend project structure with dependencies

### Backend Setup

- [x] T001 Create backend project structure per implementation plan in `backend/src/{api,services,models,config}/`
- [x] T002 Initialize Node.js project with TypeScript configuration in `backend/package.json` and `backend/tsconfig.json`
- [x] T003 Install backend dependencies: Express, ioredis, Pino, and dev dependencies in `backend/`
- [x] T004 Create environment configuration loader in `backend/src/config/index.ts`
- [x] T005 Create basic Express server setup with middleware in `backend/src/app.ts`

### Frontend Setup

- [x] T006 Create frontend project structure per implementation plan in `frontend/src/{components,pages,services,hooks}/`
- [x] T007 Initialize Vite + React + TypeScript project in `frontend/package.json` and `frontend/tsconfig.json`
- [x] T008 Install frontend dependencies: React, TanStack Query, Tailwind CSS, Axios in `frontend/`
- [x] T009 Configure Tailwind CSS with base styles in `frontend/tailwind.config.js` and `frontend/src/index.css`
- [x] T010 Create API client configuration with Axios in `frontend/src/services/api.ts`

---

## Phase 2: Foundational Infrastructure

**Goal**: Create shared services and models used by all user stories

### Data Models

- [x] T011 [P] Define Subagent TypeScript interfaces in `backend/src/models/subagent.ts`
- [x] T012 [P] Define LogEntry TypeScript interface in `backend/src/models/subagent.ts`
- [x] T013 [P] Define PaginationInfo and response types in `backend/src/models/subagent.ts`
- [x] T014 Create shared type definitions file for frontend in `frontend/src/types/subagent.ts`

### Core Services

- [x] T015 Implement CacheService with Redis abstraction in `backend/src/services/subagentCache.ts`
- [x] T016 Implement LogReaderService for file system operations in `backend/src/services/subagentLogReader.ts`
- [x] T017 Implement Pino logger configuration with correlation IDs in `backend/src/lib/logger.ts`
- [x] T018 Create error handling middleware in `backend/src/api/middleware/errorHandler.ts`

### Main Service & API Routes

- [x] T019 Create SubagentService with business logic in `backend/src/services/subagentService.ts`
- [x] T020 Implement API routes in `backend/src/api/routes/subagents.ts`
- [x] T021 Mount subagent routes in main router `backend/src/api/routes.ts`

---

## Phase 3: User Story 1 - View Currently Running Subagents (P1)

**Story Goal**: Display real-time view of all active subagents with auto-refresh

**Independent Test Criteria**: Navigate to Subagents tab, verify running subagents display with status and task info, new subagents appear within 5 seconds without refresh

### Backend - US1

- [x] T022 [US1] Implement GET /api/subagents/running endpoint in `backend/src/api/routes/subagents.ts`
- [x] T023 [US1] Create SubagentService.getRunningSubagents() method in `backend/src/services/subagentService.ts`
- [x] T024 [US1] [P] Implement real-time data aggregation from Redis index in `backend/src/services/subagentService.ts`
- [x] T025 [US1] Add cache layer with 5-second TTL for running subagents in `backend/src/services/subagentCache.ts`
- [x] T026 [US1] [P] Add request validation middleware for query parameters in `backend/src/api/routes/subagents.ts`

### Frontend - US1

- [x] T027 [US1] Create useRunningSubagents hook with 5-second polling in `frontend/src/hooks/useSubagents.ts`
- [x] T028 [US1] Implement RunningSubagentsList component in `frontend/src/components/SubagentsTab.tsx`
- [x] T029 [US1] [P] Add empty state UI for "No subagents currently running" in `frontend/src/components/SubagentsTab.tsx`
- [x] T030 [US1] [P] Create SubagentStatusBadge component for status display in `frontend/src/components/SubagentsTab.tsx`
- [x] T031 [US1] [P] Add elapsed time formatter utility in `frontend/src/components/SubagentsTab.tsx`
- [x] T032 [US1] Create SubagentsTab main container component in `frontend/src/components/SubagentsTab.tsx`
- [x] T033 [US1] Add Subagents tab to dashboard navigation in `frontend/src/pages/Dashboard.tsx`

### Integration - US1

- [x] T034 [US1] Wire up SubagentsTab with data fetching and state management in `frontend/src/pages/Dashboard/SubagentsPage.tsx`

---

## Phase 4: User Story 2 - View Subagent Execution History (P1)

**Story Goal**: Display chronological list of completed subagent executions with filtering

**Independent Test Criteria**: Navigate to history section, verify completed executions display with times and status, date/status filters work correctly

### Backend - US2

- [x] T035 [US2] Implement GET /api/subagents/history endpoint in `backend/src/api/routes/subagents.ts`
- [x] T036 [US2] Create SubagentService.getSubagentHistory() method in `backend/src/services/subagentService.ts`
- [x] T037 [US2] Implement date range filtering for history queries in `backend/src/services/subagentService.ts`
- [x] T038 [US2] [P] Implement status filtering for history queries in `backend/src/services/subagentService.ts`
- [x] T039 [US2] Add offset-based pagination logic in `backend/src/services/subagentService.ts`
- [x] T040 [US2] Add cache layer with 60-second TTL for history in `backend/src/services/subagentCache.ts`
- [x] T041 [US2] [P] Implement archive log file reader for historical data in `backend/src/services/subagentLogReader.ts`

### Frontend - US2

- [x] T042 [US2] Create useSubagentHistory hook with pagination in `frontend/src/hooks/useSubagents.ts`
- [x] T043 [US2] Implement SubagentHistoryList component in `frontend/src/components/SubagentsTab.tsx`
- [x] T044 [US2] [P] Create SubagentFilters component for date and status filters in `frontend/src/components/SubagentsTab.tsx`
- [x] T045 [US2] [P] Add pagination controls component in `frontend/src/components/SubagentsTab.tsx`
- [x] T046 [US2] [P] Create tabbed view for Running vs History in `frontend/src/components/SubagentsTab.tsx`
- [ ] T047 [US2] [P] Add history empty state for retention period exceeded in `frontend/src/components/SubagentHistoryList.tsx`

### Integration - US2

- [ ] T048 [US2] Integrate filters with history data fetching in `frontend/src/components/SubagentHistoryList.tsx`

---

## Phase 5: User Story 3 - Search and Filter Subagent Records (P2)

**Story Goal**: Enable searching and filtering subagent records across running and history

**Independent Test Criteria**: Enter search term, verify filtered results; apply multiple filters simultaneously; clear filters restores full list

### Backend - US3

- [ ] T049 [US3] Implement POST /api/subagents/search endpoint in `backend/src/api/routes/subagents.ts`
- [ ] T050 [US3] Create SubagentService.searchSubagents() method in `backend/src/services/subagentService.ts`
- [ ] T051 [US3] [P] Implement text search across name, taskId, and sessionId in `backend/src/services/subagentService.ts`
- [ ] T052 [US3] [P] Add combined filter logic (search + status + date) in `backend/src/services/subagentService.ts`
- [ ] T053 [US3] Implement search request validation in `backend/src/api/middleware/validation.ts`

### Frontend - US3

- [ ] T054 [US3] Create useSearchSubagents hook in `frontend/src/hooks/useSubagents.ts`
- [ ] T055 [US3] Implement SubagentSearch component with search input in `frontend/src/components/SubagentSearch.tsx`
- [ ] T056 [US3] [P] Add clear filters button and functionality in `frontend/src/components/SubagentFilters.tsx`
- [ ] T057 [US3] [P] Create filter state management and persistence in `frontend/src/hooks/useFilters.ts`
- [ ] T058 [US3] [P] Add filter pills/tags showing active filters in `frontend/src/components/ActiveFilters.tsx`

### Integration - US3

- [ ] T059 [US3] Integrate search component with running and history lists in `frontend/src/components/SubagentsTab.tsx`

---

## Phase 6: User Story 4 - View Subagent Details (P2)

**Story Goal**: Display detailed execution information including logs, parameters, and results

**Independent Test Criteria**: Click subagent entry, verify detail view opens with full logs; for running subagents, logs update in real-time; back button preserves filter state

### Backend - US4

- [ ] T060 [US4] Implement GET /api/subagents/{id} endpoint in `backend/src/api/routes/subagents.ts`
- [ ] T061 [US4] Create SubagentService.getSubagentDetails() method in `backend/src/services/subagentService.ts`
- [ ] T062 [US4] [P] Implement full log retrieval from log files in `backend/src/services/logReaderService.ts`
- [ ] T063 [US4] [P] Add parameters and results extraction in `backend/src/services/subagentService.ts`
- [ ] T064 [US4] [P] Implement real-time log streaming for running subagents in `backend/src/services/logReaderService.ts`
- [ ] T065 [US4] Add 404 error handling for missing subagents in `backend/src/api/routes/subagents.ts`

### Frontend - US4

- [ ] T066 [US4] Create useSubagentDetails hook in `frontend/src/hooks/useSubagents.ts`
- [ ] T067 [US4] Implement SubagentDetail modal/drawer component in `frontend/src/components/SubagentDetail.tsx`
- [ ] T068 [US4] [P] Create LogViewer component with syntax highlighting in `frontend/src/components/LogViewer.tsx`
- [ ] T069 [US4] [P] Add real-time log updates for running subagents in `frontend/src/components/LogViewer.tsx`
- [ ] T070 [US4] [P] Create ParametersDisplay component in `frontend/src/components/ParametersDisplay.tsx`
- [ ] T071 [US4] [P] Create ResultsDisplay component in `frontend/src/components/ResultsDisplay.tsx`
- [ ] T072 [US4] [P] Implement back button with filter state preservation in `frontend/src/components/SubagentDetail.tsx`

### Integration - US4

- [ ] T073 [US4] Wire up click handlers from list views to detail view in `frontend/src/components/RunningSubagentsList.tsx`
- [ ] T074 [US4] Wire up click handlers from history list to detail view in `frontend/src/components/SubagentHistoryList.tsx`
- [ ] T075 [US4] Add route or modal state management for detail view in `frontend/src/pages/Dashboard/SubagentsPage.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Cache refresh, error handling, performance optimization, and testing

### System Endpoints

- [ ] T076 [P] Implement POST /api/refresh endpoint in `backend/src/api/routes/subagents.ts`
- [ ] T077 [P] Add cache invalidation logic for subagent keys in `backend/src/services/cacheService.ts`
- [ ] T078 [P] Add refresh button to UI in `frontend/src/components/SubagentsTab.tsx`

### Error Handling & Observability

- [ ] T079 [P] Implement comprehensive error boundaries in frontend in `frontend/src/components/ErrorBoundary.tsx`
- [ ] T080 [P] Add structured logging to all API endpoints in `backend/src/api/routes/subagents.ts`
- [ ] T081 [P] Implement loading states and skeletons in `frontend/src/components/LoadingSkeleton.tsx`
- [ ] T082 [P] Add error toast notifications in `frontend/src/components/ToastNotifications.tsx`

### Performance Optimization

- [ ] T083 [P] Implement virtualized scrolling for large lists in `frontend/src/components/VirtualizedList.tsx`
- [ ] T084 [P] Add request deduplication in TanStack Query in `frontend/src/hooks/useSubagents.ts`
- [ ] T085 [P] Optimize Redis pipeline operations in `backend/src/services/cacheService.ts`

### Contract Validation

- [ ] T086 [P] Create JSON schema validation from OpenAPI in `backend/src/lib/validators.ts`
- [ ] T087 [P] Add request/response validation middleware in `backend/src/api/middleware/validation.ts`

---

## Dependencies & Execution Order

### User Story Dependencies

```
Phase 1 (Setup) ───────────────────────────────┐
                                               │
Phase 2 (Foundation) ──────────────────────────┤
       │                                       │
       ├── Models ─────────────────────────────┤
       ├── CacheService ───────────────────────┤
       ├── LogReaderService ───────────────────┤
       └── IndexService ───────────────────────┤
                                               │
Phase 3 (US1 - Running) ◄──────────────────────┤ MVP Start
       │                                       │
       └── Running endpoints ──────────────────┤
       └── Running UI ─────────────────────────┤
                                               │
Phase 4 (US2 - History) ◄──────────────────────┤ MVP Complete
       │                                       │
       └── History endpoints ──────────────────┤
       └── History UI ─────────────────────────┤
                                               │
Phase 5 (US3 - Search) ◄───────────────────────┤ Enhancement
       │                                       │
       └── Search endpoint ────────────────────┤
       └── Filter UI ──────────────────────────┤
                                               │
Phase 6 (US4 - Details) ◄──────────────────────┤ Enhancement
       │                                       │
       └── Detail endpoint ────────────────────┤
       └── Detail UI ──────────────────────────┤
                                               │
Phase 7 (Polish) ◄─────────────────────────────┘
```

### Critical Path

1. **T001-T005**: Backend structure → Blocks all backend work
2. **T006-T010**: Frontend structure → Blocks all frontend work
3. **T011-T014**: Models → Blocks all services
4. **T015-T018**: Core services → Block US1 implementation
5. **T022-T026**: US1 Backend → Blocks US1 Frontend
6. **T027-T034**: US1 Frontend → MVP Demo Ready
7. **T035-T041**: US2 Backend → Blocks US2 Frontend
8. **T042-T048**: US2 Frontend → MVP Complete

### Parallel Execution Opportunities

**Within Phase 2 (Foundation)**:
- T011 [P], T012 [P], T013 [P], T014 [P] - All models can be created in parallel
- T015, T016, T017, T018 - Services can be developed in parallel after models
- T019, T020, T021 - Index management can be parallel

**Within Phase 3 (US1)**:
- T022-T026 Backend tasks can be done sequentially
- T027-T033 Frontend tasks can be done in parallel with backend once T011-T014 complete
- T034 Integration requires both backend and frontend completion

**Within Phase 4 (US2)**:
- T037, T038, T041 [P] - Filter implementations can be parallel
- T044, T045, T046, T047 [P] - UI components can be parallel

**Across Phases**:
- US3 (Search) and US4 (Details) can be developed in parallel once MVP is complete
- Phase 7 polish tasks marked [P] can be done in parallel with each other

---

## Task Count Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 10 | 5 |
| Phase 2: Foundation | 11 | 7 |
| Phase 3: US1 - Running | 13 | 6 |
| Phase 4: US2 - History | 14 | 7 |
| Phase 5: US3 - Search | 11 | 5 |
| Phase 6: US4 - Details | 16 | 7 |
| Phase 7: Polish | 12 | 12 |
| **Total** | **87** | **49** |

### By User Story

- **US1 (P1)**: 13 tasks - Real-time running subagents
- **US2 (P1)**: 14 tasks - Historical execution records
- **US3 (P2)**: 11 tasks - Search and filter
- **US4 (P2)**: 16 tasks - Detail view

---

## MVP Scope Recommendation

**Deliver First**: Phases 1-4 (Tasks T001-T048)
- Provides complete core functionality
- Running subagents with real-time updates
- Historical execution records with filtering
- Demonstrates all key technical capabilities (Redis, file system, polling)

**Enhancement Scope**: Phases 5-7 (Tasks T049-T087)
- Search functionality
- Detail view with logs
- Performance optimizations
- Comprehensive error handling

**Estimated MVP Timeline**: ~50% of total tasks (43 of 87)

---

## Next Steps

1. **Begin Implementation**: Start with Phase 1 (T001-T010)
2. **Run Tests**: Execute `/speckit.test` after Phase 2 completion
3. **MVP Review**: Evaluate after Phase 4 (US1 + US2 complete)
4. **Deploy MVP**: Deploy when US1 and US2 are functional
5. **Iterate**: Continue with US3, US4, and polish phases

**Command to execute tasks**: Run individual tasks or groups using the Task ID (e.g., implement T001-T005 for backend setup)
