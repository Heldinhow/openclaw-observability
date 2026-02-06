---
description: "Task list for Real-time Logs Viewer feature implementation"
---

# Tasks: Real-time Logs Viewer

**Input**: Design documents from `/specs/002-realtime-logs-tab/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/

**Tests**: Per Constitution Principle III, tests are REQUIRED.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure project for log streaming feature

- [x] T001 Install `tail` npm package in backend for file watching: `cd backend && npm install tail`
- [x] T002 Install `react-syntax-highlighter` in frontend: `cd frontend && npm install react-syntax-highlighter`
- [x] T003 [P] Add LOG_FILE_PATH environment variable to backend/.env.example
- [x] T004 [P] Add LOG_STREAM_MAX_CONNECTIONS environment variable to backend/.env.example
- [x] T005 [P] Add LOG_CACHE_TTL environment variable to backend/.env.example
- [x] T006 Create backend/src/types/log.types.ts for TypeScript type definitions
- [x] T007 Create frontend/src/types/log.types.ts for shared type definitions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create LogEntry model in backend/src/models/LogEntry.ts with validation
- [x] T009 [P] Create LogFilter model in backend/src/models/LogFilter.ts
- [x] T010 [P] Create LogBatch model in backend/src/models/LogBatch.ts
- [x] T011 Implement LogParser service in backend/src/services/LogParser.ts for JSON Lines parsing
- [x] T012 Implement Redis cache utilities in backend/src/services/LogCache.ts for log buffering
- [x] T013 Create SSE connection manager in backend/src/services/SSEManager.ts for stream management
- [x] T014 Create useLogStream hook in frontend/src/hooks/useLogStream.ts for SSE connection management
- [x] T015 Create log validation utilities in backend/src/utils/logValidation.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Real-time Logs Stream (Priority: P1) 🎯 MVP

**Goal**: Implement real-time log streaming that displays new log entries automatically as they are generated within 2 seconds

**Independent Test**: Open the logs tab and verify that new log entries appear automatically without manual refresh. Generate test logs and confirm they appear within 2 seconds.

### Tests for User Story 1

- [x] T016 [P] [US1] Create contract test for GET /api/logs endpoint in backend/tests/integration/logs.get.test.ts
- [x] T017 [P] [US1] Create integration test for SSE /api/logs/stream endpoint in backend/tests/integration/logs.stream.test.ts
- [x] T018 [P] [US1] Create unit test for LogParser service in backend/tests/unit/LogParser.test.ts
- [x] T019 [P] [US1] Create component test for LogList in frontend/tests/components/LogList.test.tsx

### Implementation for User Story 1

- [x] T020 [P] [US1] Implement LogStreamer service in backend/src/services/LogStreamer.ts for file watching and streaming logic
- [x] T021 [US1] Implement GET /api/logs endpoint in backend/src/routes/logs.ts for historical log queries with pagination
- [x] T022 [US1] Implement SSE /api/logs/stream endpoint in backend/src/routes/logs.ts for real-time streaming
- [ ] T023 [US1] Extend /api/health endpoint to include log source connectivity status in backend/src/routes/health.ts
- [x] T024 [P] [US1] Create LogList component in frontend/src/components/logs/LogList.tsx to display real-time log entries
- [x] T025 [P] [US1] Create LogsTab page in frontend/src/pages/LogsTab.tsx as main container for logs view
- [x] T026 [US1] Implement log entry formatting and display logic in frontend/src/utils/logFormatters.ts
- [x] T027 [US1] Add auto-retry logic with 5-second intervals when log source is unreachable in frontend/src/hooks/useLogStream.ts
- [x] T028 [US1] Implement 250 entry memory limit with FIFO eviction in frontend/src/hooks/useLogStream.ts
- [x] T029 [US1] Add visual loading indicator for connection states in frontend/src/components/logs/ConnectionStatus.tsx
- [x] T030 [P] [US1] Implement log file rotation detection in backend/src/services/LogStreamer.ts
- [x] T031 [US1] Add logging with correlation IDs for all log operations in backend/src/services/LogStreamer.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Real-time log streaming works with <2s latency.

---

## Phase 4: User Story 2 - Click Log Entry for Details (Priority: P1)

**Goal**: Enable users to click any log entry to view complete details in a side panel with syntax highlighting

**Independent Test**: Click a log entry in the list and verify a side panel slides from the right showing complete log data including timestamp, level, subsystem, message, and metadata with syntax highlighting.

### Tests for User Story 2

- [x] T032 [P] [US2] Create component test for LogDetailPanel in frontend/tests/components/LogDetailPanel.test.tsx
- [x] T033 [P] [US2] Create integration test for log detail view interaction in frontend/tests/integration/logDetail.test.tsx

### Implementation for User Story 2

- [x] T034 [US2] Create LogDetailPanel component in frontend/src/components/logs/LogDetailPanel.tsx with side panel sliding from right
- [x] T035 [US2] Implement click-to-open functionality in LogList component in frontend/src/components/logs/LogList.tsx
- [x] T036 [US2] Create SyntaxHighlight component in frontend/src/components/common/SyntaxHighlight.tsx using react-syntax-highlighter
- [x] T037 [US2] Add JSON formatting and syntax highlighting in LogDetailPanel in frontend/src/components/logs/LogDetailPanel.tsx
- [x] T038 [US2] Implement close button functionality in LogDetailPanel in frontend/src/components/logs/LogDetailPanel.tsx
- [x] T039 [US2] Add click-outside-to-close behavior in LogsTab page in frontend/src/pages/LogsTab.tsx
- [x] T040 [US2] Ensure detail panel stays open when new logs arrive in frontend/src/pages/LogsTab.tsx
- [x] T041 [US2] Display all log fields: timestamp, level, subsystem, message, metadata, correlationId in LogDetailPanel
- [x] T042 [US2] Add metadata expansion/collapse for nested objects in LogDetailPanel in frontend/src/components/logs/LogDetailPanel.tsx

### Tests for User Story 3

- [ ] T043 [P] [US3] Create contract test for POST /api/logs/filter endpoint in backend/tests/integration/logs.filter.test.ts
- [ ] T044 [P] [US3] Create component test for LogFilter in frontend/tests/components/LogFilter.test.tsx
- [ ] T045 [P] [US3] Create unit tests for filter logic in frontend/tests/unit/filterLogic.test.ts

### Implementation for User Story 3

- [x] T046 [P] [US3] Implement LogFilter model validation in backend/src/models/LogFilter.ts
- [x] T047 [US3] Implement POST /api/logs/filter endpoint in backend/src/routes/logs.ts
- [x] T048 [US3] Create LogFilter component in frontend/src/components/logs/LogFilter.tsx with level checkboxes
- [x] T049 [P] [US3] Implement level filter UI with multi-select in frontend/src/components/logs/LogFilter.tsx
- [x] T050 [P] [US3] Add search text input in LogFilter component in frontend/src/components/logs/LogFilter.tsx
- [x] T051 [US3] Implement client-side filtering logic in frontend/src/hooks/useLogFilter.ts
- [x] T052 [US3] Apply filters to SSE stream via query parameters in frontend/src/hooks/useLogStream.ts
- [x] T053 [US3] Add clear filters button in LogFilter component in frontend/src/components/logs/LogFilter.tsx
- [x] T054 [US3] Implement subsystem filter with wildcard support in backend/src/services/LogFilterService.ts
- [ ] T055 [US3] Add time range filter UI in LogFilter component in frontend/src/components/logs/LogFilter.tsx
- [x] T056 [US3] Ensure filter response time is under 1 second in frontend/src/hooks/useLogFilter.ts

### Tests for User Story 4

- [ ] T057 [P] [US4] Create contract tests for POST /api/logs/pause and /resume endpoints in backend/tests/integration/logs.control.test.ts
- [ ] T058 [P] [US4] Create component test for pause/resume controls in frontend/tests/components/StreamControls.test.tsx

### Implementation for User Story 4

- [x] T059 [P] [US4] Implement pause/resume state management in backend/src/services/LogStreamer.ts
- [x] T060 [US3] Implement POST /api/logs/pause endpoint in backend/src/routes/logs.ts
- [x] T061 [US3] Implement POST /api/logs/resume endpoint in backend/src/routes/logs.ts
- [x] T062 [US3] Create StreamControls component in frontend/src/components/logs/StreamControls.tsx with pause/resume buttons
- [x] T063 [US4] Add pause/resume functionality to useLogStream hook in frontend/src/hooks/useLogStream.ts
- [x] T064 [US4] Implement log buffering during pause in backend/src/services/LogStreamer.ts
- [x] T065 [US4] Add visual indicator when stream is paused in frontend/src/components/logs/StreamControls.tsx
- [x] T066 [US4] Display count of buffered logs during pause in frontend/src/components/logs/StreamControls.tsx
- [x] T067 [US4] Ensure detail panel interaction maintains pause state in frontend/src/pages/LogsTab.tsx
- [ ] T068 [US4] Add keyboard shortcut (Space) for pause/resume in frontend/src/hooks/useKeyboardShortcuts.ts

**Checkpoint**: All four user stories should now be independently functional. Pause/resume works without data loss.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T069 [P] Implement "Load More" functionality for historical logs in frontend/src/components/logs/LoadMoreButton.tsx
- [ ] T070 [P] Add pagination support for historical queries in backend/src/services/LogQueryService.ts
- [ ] T071 Implement virtual scrolling for large log lists in frontend/src/components/logs/LogList.tsx
- [ ] T072 [P] Add responsive design for mobile devices in frontend/src/pages/LogsTab.tsx
- [ ] T073 Add error boundary for log components in frontend/src/components/ErrorBoundary.tsx
- [ ] T074 [P] Create documentation for Logs API in docs/api/logs.md
- [ ] T075 Add performance monitoring for log streaming in backend/src/middleware/performance.ts
- [ ] T076 [P] Implement log export functionality (JSON/CSV) in frontend/src/components/logs/LogExport.tsx
- [ ] T077 Add keyboard navigation for log list in frontend/src/hooks/useKeyboardNavigation.ts
- [ ] T078 Optimize re-renders with React.memo in frontend/src/components/logs/LogList.tsx
- [ ] T079 Add dark/light theme support for syntax highlighting in frontend/src/components/common/SyntaxHighlight.tsx
- [ ] T080 Run full test suite: `npm test && npm run lint`
- [ ] T081 Validate against quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for log list component
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for log list, can work in parallel with US2
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for stream hook, can work in parallel with US2 and US3

### Within Each User Story

- Tests (T016-T019, etc.) MUST be written and FAIL before implementation
- Models before services (already in Foundational)
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- User Stories 2, 3, and 4 can be worked on in parallel after US1 completes
- Different user stories can be worked on by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create contract test for GET /api/logs endpoint in backend/tests/integration/logs.get.test.ts"
Task: "Create integration test for SSE /api/logs/stream endpoint in backend/tests/integration/logs.stream.test.ts"
Task: "Create unit test for LogParser service in backend/tests/unit/LogParser.test.ts"
Task: "Create component test for LogList in frontend/tests/components/LogList.test.tsx"

# Then implement backend services in parallel:
Task: "Implement LogStreamer service in backend/src/services/LogStreamer.ts"
Task: "Implement GET /api/logs endpoint in backend/src/routes/logs.ts"
Task: "Implement SSE /api/logs/stream endpoint in backend/src/routes/logs.ts"

# Then implement frontend components:
Task: "Create LogList component in frontend/src/components/logs/LogList.tsx"
Task: "Create LogsTab page in frontend/src/pages/LogsTab.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Open logs tab
   - Verify last 100 entries load immediately
   - Generate test logs
   - Verify they appear within 2 seconds
   - Check auto-retry on disconnect
   - Verify 250 entry memory limit
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core streaming)
   - Developer B: User Story 2 (detail panel) - starts after US1 log list ready
   - Developer C: User Story 3 (filtering) - starts after US1 log list ready
   - Developer D: User Story 4 (pause/resume) - starts after US1 stream hook ready
3. Stories complete and integrate independently
4. Regular integration tests to ensure no regressions

---

## Success Criteria Validation

Per spec.md Success Criteria:

- **SC-001** (<2s latency): Verified by T016, T019 integration tests
- **SC-002** (95% detail accuracy): Verified by T032, T033 tests
- **SC-003** (<1s filter response): Verified by T056 implementation task
- **SC-004** (10K entries responsive): Verified by T071 virtual scrolling
- **SC-005** (pause without data loss): Verified by T057-T058 tests
- **SC-006** (graceful rotation): Verified by T030, T031
- **SC-007** (syntax highlighting): Verified by T036, T037

---

## Task Count Summary

| Phase | Task Count | Description |
|-------|-----------|-------------|
| Phase 1 (Setup) | 7 | Dependencies and configuration |
| Phase 2 (Foundational) | 8 | Core infrastructure |
| Phase 3 (US1 - P1) | 16 | Real-time streaming (MVP) |
| Phase 4 (US2 - P1) | 11 | Detail panel |
| Phase 5 (US3 - P2) | 14 | Filter and search |
| Phase 6 (US4 - P2) | 12 | Pause/resume |
| Phase 7 (Polish) | 13 | Cross-cutting concerns |
| **Total** | **81** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All file paths follow the plan.md structure (backend/src/, frontend/src/)
