---
description: "Task list template for feature implementation"
---

# Tasks: Session Details View

**Input**: Design documents from `specs/001-session-details-view/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/, research.md
**Tests**: Tests are NOT requested in the feature specification
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`
- Config: `backend/`, `frontend/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize backend project with TypeScript 5.x and package.json in backend/
- [X] T002 Initialize frontend project with Vite 5.x, React 18.x, and TypeScript in frontend/
- [X] T003 [P] Configure ESLint and Prettier for backend with TypeScript 5.x
- [X] T004 [P] Configure ESLint and Prettier for frontend with TypeScript 5.x
- [X] T005 [P] Setup Tailwind CSS 3.x configuration with dark mode support in frontend/
- [X] T006 [P] Configure Vitest 1.x for frontend testing with React Testing Library
- [X] T007 [P] Configure Jest 29.x for backend testing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Setup environment configuration in backend with dotenv (PORT, REDIS_HOST, REDIS_PORT)
- [X] T009 [P] Create Redis connection and types in backend/src/services/redis.ts using ioredis
- [X] T010 [P] Create TypeScript types for Session, Message, Project per data-model.md in backend/src/types/
- [X] T011 [P] Create frontend TypeScript types per data-model.md in frontend/src/types/index.ts
- [X] T012 Implement session discovery service reading from ~/.local/share/opencode/storage/session/ in backend/src/services/discovery.ts
- [X] T013 [P] Implement Redis cache service with 5-min TTL in backend/src/services/cache.ts
- [X] T014 [P] Create API routes structure in backend/src/api/routes.ts
- [X] T015 Create Express app with CORS and JSON parsing in backend/src/index.ts
- [X] T016 [P] Create API client service in frontend/src/services/api.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Session List with Titles (Priority: P1) MVP

**Goal**: Display all sessions in a unified table with columns for Project, Session ID, Title, Updated, Messages, Status

**Independent Test**: Access dashboard and verify session table displays with all required columns visible

### Tests for User Story 1 (NOT REQUESTED - skipping per specification)

### Implementation for User Story 1

- [X] T017 [P] [US1] Create GET /api/sessions endpoint in backend/src/api/sessions.ts with filtering support
- [X] T018 [P] [US1] Create Header component with title in frontend/src/components/Header.tsx
- [X] T019 [P] [US1] Create SessionTable component with columns for Project, Session ID, Title, Updated, Messages, Status in frontend/src/components/SessionTable.tsx
- [X] T020 [P] [US1] Implement SessionRow subcomponent for individual session display in SessionTable.tsx
- [X] T021 [US1] Create useSessions hook with React Query in frontend/src/hooks/useSessions.ts
- [X] T022 [US1] Implement Dashboard page layout in frontend/src/pages/Dashboard.tsx
- [X] T023 [US1] Add empty state component for when no sessions exist in frontend/src/components/SessionTable.tsx
- [X] T024 [US1] Style SessionTable with Tailwind dark mode classes in frontend/src/components/SessionTable.tsx

**Checkpoint**: User Story 1 complete - sessions can be viewed in a table with all columns

---

## Phase 4: User Story 2 - Filter and Search Sessions (Priority: P1)

**Goal**: Allow users to filter sessions by project name and status (active/inactive)

**Independent Test**: Create multiple sessions across projects, then use filters to verify only matching sessions display

### Tests for User Story 2 (NOT REQUESTED - skipping per specification)

### Implementation for User Story 2

- [X] T025 [P] [US2] Create Filters component with project dropdown and status toggle in frontend/src/components/Filters.tsx
- [X] T026 [P] [US2] Implement filter state management in useSessions hook (frontend/src/hooks/useSessions.ts)
- [X] T027 [P] [US2] Update GET /api/sessions endpoint to support project and status query parameters (backend/src/api/sessions.ts)
- [X] T028 [US2] Add status indicator badges (green for active, gray for inactive) in SessionTable.tsx
- [X] T029 [US2] Implement empty filter results state in Filters component

**Checkpoint**: User Stories 1 and 2 complete - sessions can be viewed and filtered independently

---

## Phase 5: User Story 3 - View Session Interaction History (Priority: P1)

**Goal**: Click any session to view complete agent-user conversation history with clear attribution

**Independent Test**: Click session row and verify detail panel opens displaying all messages in chronological order

### Tests for User Story 3 (NOT REQUESTED - skipping per specification)

### Implementation for User Story 3

- [X] T030 [P] [US3] Create GET /api/sessions/:sessionId endpoint with message history in backend/src/api/sessions.ts
- [X] T031 [P] [US3] Implement message loading from ~/.local/share/opencode/storage/message/ in backend/src/services/messages.ts
- [X] T032 [P] [US3] Create SessionDetail component with message list in frontend/src/components/SessionDetail.tsx
- [X] T033 [P] [US3] Implement MessageBubble component with agent/user attribution styling in SessionDetail.tsx
- [X] T034 [P] [US3] Create detail panel overlay with close button in SessionDetail.tsx
- [X] T035 [US3] Implement session metadata display (title, status, project, timestamps) in SessionDetail.tsx
- [X] T036 [US3] Add click handler on SessionTable rows to open detail panel
- [X] T037 [US3] Implement close panel functionality to return to session list

**Checkpoint**: All P1 stories complete - sessions can be viewed, filtered, and detailed

---

## Phase 6: User Story 4 - Real-time Session Updates (Priority: P2)

**Goal**: Refresh button triggers immediate cache invalidation and rediscovery of all sessions

**Independent Test**: Click refresh button and verify session list updates with current data

### Tests for User Story 4 (NOT REQUESTED - skipping per specification)

### Implementation for User Story 4

- [X] T038 [P] [US4] Create POST /api/refresh endpoint in backend/src/api/routes.ts
- [X] T039 [P] [US4] Implement Redis cache invalidation in backend/src/services/cache.ts
- [X] T040 [P] [US4] Create RefreshButton component in frontend/src/components/Filters.tsx
- [X] T041 [US4] Implement refresh loading state and disable during refresh in useSessions hook
- [X] T042 [US4] Add optimistic UI update for instant feedback on refresh
- [X] T043 [US4] Configure React Query refetchInterval for auto-refresh in useSessions.ts

**Checkpoint**: User Story 4 complete - sessions can be manually and automatically refreshed

---

## Phase 7: User Story 5 - Integration with Observability (Priority: P2)

**Goal**: Backend emits structured logs, frontend reports errors to task tracking

**Independent Test**: Verify backend logs are emitted and frontend errors are reported

### Tests for User Story 5 (NOT REQUESTED - skipping per specification)

### Implementation for User Story 5

- [X] T044 [P] [US5] Implement structured JSON logging in backend discovery service (backend/src/services/discovery.ts)
- [X] T045 [P] [US5] Implement structured JSON logging in backend cache service (backend/src/services/cache.ts)
- [X] T046 [P] [US5] Create error tracking API endpoint POST /api/errors in backend/src/api/routes.ts
- [X] T047 [P] [US5] Create error boundary component in frontend (React Query handles errors)
- [X] T048 [P] [US5] Implement frontend error reporting service in frontend/src/services/api.ts
- [X] T049 [US5] Create GET /api/health endpoint in backend/src/api/routes.ts with Redis connection status
- [X] T050 [US5] Display health status and Redis connection status in Dashboard header

**Checkpoint**: All user stories complete - full feature functionality achieved

---

## Phase 8: Polish and Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T051 [P] Add loading skeletons for session table in frontend/src/components/SessionTable.tsx
- [X] T052 [P] Add toast notifications for refresh completion and errors
- [X] T053 [P] Implement keyboard navigation (Escape to close detail panel) in SessionDetail.tsx
- [ ] T054 [P] Add responsive design for mobile viewports in SessionTable
- [ ] T055 [P] Write README.md with setup and deployment instructions
- [ ] T056 [P] Run npm test and npm run lint to verify code quality

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Stories are prioritized: P1 (US1, US2, US3) before P2 (US4, US5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all model/service tasks for User Story 1 together:
Task: "Create GET /api/sessions endpoint in backend/src/api/sessions.ts"
Task: "Create Header component in frontend/src/components/Header.tsx"
Task: "Create SessionTable component in frontend/src/components/SessionTable.tsx"
Task: "Create useSessions hook in frontend/src/hooks/useSessions.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Polish phase → Final deployment
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Task Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 56 |
| Setup Tasks | 7 |
| Foundational Tasks | 9 |
| User Story 1 Tasks | 8 |
| User Story 2 Tasks | 5 |
| User Story 3 Tasks | 8 |
| User Story 4 Tasks | 6 |
| User Story 5 Tasks | 7 |
| Polish Tasks | 6 |
| Parallel Tasks | 25 |
| MVP Scope (Phase 1-3) | 24 tasks |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tests are NOT included per specification (tests not requested)
