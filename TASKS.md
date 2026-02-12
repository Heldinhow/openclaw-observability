# TASKS.md

## Actionable Tasks

### Phase 1: Foundation Tasks

#### TASK 1.1: API Audit
```
ID: FEAT-101
Title: Audit backend API endpoints
Priority: P0
Estimate: 2h
Assignee: Backend Developer

Steps:
1.1.1 Call GET /api/subagents/running and document response
1.1.2 Call GET /api/subagents/history and document response
1.1.3 Check for pagination parameters
1.1.4 Check for filtering parameters
1.1.5 Verify response matches SPECIFICATION.md requirements
1.1.6 Document any gaps in API_GAP_ANALYSIS.md
1.1.7 Create issue for each missing/gap found

Acceptance Criteria:
- [ ] All endpoint responses documented
- [ ] Data types verified against TypeScript interfaces
- [ ] Gaps identified and documented
- [ ] Issues created for missing features
```

#### TASK 1.2: TypeScript Types
```
ID: FEAT-102
Title: Create TypeScript interfaces for subagent data
Priority: P0
Estimate: 1h
Assignee: Frontend Developer

Steps:
1.2.1 Create src/types/subagent.ts
1.2.2 Define RunningSubagent interface
1.2.3 Define SubagentHistory interface
1.2.4 Define SubagentDetails interface
1.2.5 Add JSDoc documentation
1.2.6 Review against API responses

Acceptance Criteria:
- [ ] All subagent data structures typed
- [ ] Matches API response format
- [ ] Passes TypeScript compilation
```

#### TASK 1.3: API Client
```
ID: FEAT-103
Title: Create subagent API client module
Priority: P0
Estimate: 2h
Assignee: Frontend Developer

Steps:
1.3.1 Create src/api/client.ts (base axios instance)
1.3.2 Create src/api/subagents.ts
1.3.3 Implement getRunningSubagents()
1.3.4 Implement getSubagentHistory()
1.3.5 Implement getSubagentDetails(id)
1.3.6 Add error handling
1.3.7 Write unit tests

Acceptance Criteria:
- [ ] All endpoints callable
- [ ] Proper error handling
- [ ] Type-safe responses
- [ ] Unit tests passing
```

#### TASK 1.4: Session Tracking Audit
```
ID: FEAT-104
Title: Verify subagent sessions are being tracked
Priority: P0
Estimate: 2h
Assignee: Backend Developer

Steps:
1.4.1 Review subagent creation flow
1.4.2 Check database tables for session records
1.4.3 Verify start_time is being recorded
1.4.4 Verify end_time is being updated on completion
1.4.5 Check error capturing for failed sessions
1.4.6 Test by spawning and completing a subagent
1.4.7 Document tracking flow

Acceptance Criteria:
- [ ] All subagent sessions logged to DB
- [ ] Start and end times captured
- [ ] Errors captured on failure
- [ ] Flow documented
```

---

### Phase 2: Core Feature Tasks

#### TASK 2.1: Running Subagents List Component
```
ID: FEAT-201
Title: Implement RunningSubagentsList component
Priority: P0
Estimate: 4h
Assignee: Frontend Developer

Steps:
2.1.1 Create src/components/subagents/RunningList.tsx
2.1.2 Set up React Query for data fetching
2.1.3 Implement polling (5s interval)
2.1.4 Create SubagentCard component
2.1.5 Add StatusBadge component
2.1.6 Implement live duration counter
2.1.7 Add loading skeleton
2.1.8 Add error state with retry

Acceptance Criteria:
- [ ] List displays running subagents
- [ ] Updates every 5 seconds
- [ ] Duration counts up live
- [ ] Loading and error states work
- [ ] Matches design spec
```

#### TASK 2.2: Execution History Component
```
ID: FEAT-202
Title: Implement HistoryTable component
Priority: P0
Estimate: 4h
Assignee: Frontend Developer

Steps:
2.2.1 Create src/components/subagents/HistoryTable.tsx
2.2.2 Set up pagination state
2.2.3 Implement page navigation
2.2.4 Create table with sortable headers
2.2.5 Add status badges
2.2.6 Add loading skeleton
2.2.7 Implement empty state
2.2.8 Test with >100 records

Acceptance Criteria:
- [ ] Paginated history view
- [ ] Previous/next buttons work
- [ ] Sortable columns
- [ ] Empty state displays
- [ ] Loading state shows
```

#### TASK 2.3: Subagent Details Panel
```
ID: FEAT-203
Title: Implement SubagentDetails slide-over panel
Priority: P0
Estimate: 3h
Assignee: Frontend Developer

Steps:
2.3.1 Create src/components/subagents/DetailsPanel.tsx
2.3.2 Implement slide-over animation
2.3.3 Display all metadata fields
2.3.4 Add copy ID button
2.3.5 Add export JSON button
2.3.6 Add close on ESC and backdrop click
2.3.7 Connect to details endpoint

Acceptance Criteria:
- [ ] Opens on subagent click
- [ ] Shows all metadata
- [ ] Copy/export actions work
- [ ] Closes properly
- [ ] Keyboard accessible
```

---

### Phase 3: UX Enhancement Tasks

#### TASK 3.1: Filter Bar Component
```
ID: FEAT-301
Title: Create FilterBar for subagent lists
Priority: P1
Estimate: 3h
Assignee: Frontend Developer

Steps:
3.1.1 Create src/components/subagents/FilterBar.tsx
3.1.2 Add status dropdown
3.1.3 Add model dropdown
3.1.4 Add date range picker
3.1.5 Add search input
3.1.6 Implement clear filters
3.1.7 Connect filters to API calls

Acceptance Criteria:
- [ ] All filter types work
- [ ] Filters apply to list
- [ ] Clear button resets all
- [ ] Active filters indicated
```

#### TASK 3.2: Sorting Implementation
```
ID: FEAT-302
Title: Implement sorting on all lists
Priority: P1
Estimate: 2h
Assignee: Frontend Developer

Steps:
3.2.1 Add sort controls to table headers
3.2.2 Implement sort state
3.2.3 Add sort icon indicators
3.2.4 Connect sort to API calls
3.2.5 Add keyboard sorting

Acceptance Criteria:
- [ ] All columns sortable
- [ ] Ascending/descending toggle
- [ ] Visual indicators
- [ ] Default sort by recent
```

#### TASK 3.3: Performance Optimization
```
ID: FEAT-303
Title: Optimize dashboard performance
Priority: P2
Estimate: 2h
Assignee: Frontend Developer

Steps:
3.3.1 Add React.memo to components
3.3.2 Implement request deduplication
3.3.3 Add proper loading states
3.3.4 Lazy load details panel
3.3.5 Measure and optimize rendering

Acceptance Criteria:
- [ ] List loads < 500ms
- [ ] No unnecessary re-renders
- [ ] Deduplicated API calls
- [ ] Smooth animations
```

---

### Phase 4: Real-Time Tasks

#### TASK 4.1: WebSocket Server Setup
```
ID: FEAT-401
Title: Set up WebSocket for real-time updates
Priority: P1
Estimate: 4h
Assignee: Backend Developer

Steps:
4.1.1 Set up WebSocket server (socket.io/ws)
4.1.2 Create subagent events channel
4.1.3 Emit events on subagent state change
4.1.4 Add client connection handling
4.1.5 Implement reconnection logic
4.1.6 Add authentication

Acceptance Criteria:
- [ ] WebSocket server running
- [ ] Events emit on subagent changes
- [ ] Clients can subscribe
- [ ] Reconnection works
```

#### TASK 4.2: WebSocket Client
```
ID: FEAT-402
Title: Implement WebSocket client in frontend
Priority: P1
Estimate: 3h
Assignee: Frontend Developer

Steps:
4.2.1 Create WebSocket hook
4.2.2 Implement connection management
4.2.3 Add event handlers for subagent updates
4.2.4 Replace polling with WebSocket
4.2.5 Add connection status indicator
4.2.6 Handle fallback to polling

Acceptance Criteria:
- [ ] Real-time updates work
- [ ] Connection indicator shows
- [ ] Falls back to polling if WS fails
- [ ] Updates within 2s
```

#### TASK 4.3: Advanced Details with Logs
```
ID: FEAT-403
Title: Add logs viewer to details panel
Priority: P2
Estimate: 4h
Assignee: Frontend Developer

Steps:
4.3.1 Create LogsViewer component
4.3.2 Implement streaming logs fetch
4.3.3 Add auto-scroll on new logs
4.3.4 Add search in logs
4.3.5 Add copy/download logs
4.3.6 Implement log parsing

Acceptance Criteria:
- [ ] Logs display in real-time
- [ ] Auto-scrolls to bottom
- [ ] Search works
- [ ] Export works
```

---

### Bug Fix Tasks

#### BUG-001: Empty State Not Displaying
```
ID: BUG-001
Title: SubagentsTab shows empty when no subagents
Priority: P0
Status: TODO

Steps:
- Check if API returns empty array
- Verify conditional rendering
- Add empty state component

Assignee: Frontend Developer
Estimate: 1h
```

#### BUG-002: Loading State Missing
```
ID: BUG-002
Title: No loading indicator during API calls
Priority: P0
Status: TODO

Steps:
- Add loading state to React Query
- Implement skeleton loader
- Add suspense boundary

Assignee: Frontend Developer
Estimate: 1h
```

#### BUG-003: Duration Not Updating
```
ID: BUG-003
Title: Duration counter stuck on initial value
Priority: P1
Status: TODO

Steps:
- Check timer logic
- Verify state updates
- Add useEffect for live updates

Assignee: Frontend Developer
Estimate: 2h
```

---

### Documentation Tasks

#### DOC-001: API Documentation
```
ID: DOC-001
Title: Document subagent API endpoints
Priority: P1
Estimate: 2h

Steps:
- Document GET /api/subagents/running
- Document GET /api/subagents/history
- Document GET /api/subagents/:id
- Add example requests/responses
- Add error response documentation

Output: docs/api/subagents.md
```

#### DOC-002: User Guide
```
ID: DOC-002
Title: Create dashboard user guide
Priority: P2
Estimate: 3h

Steps:
- Screenshot tour of features
- How to filter and sort
- How to view details
- Keyboard shortcuts
- FAQ section

Output: docs/dashboard-guide.md
```

---

### Dependencies

1. **Backend API** → Must be working before frontend integration
2. **Session Tracking** → Must be logging before history can work
3. **Running List** → Required before filtering (foundation)
4. **WebSocket Server** → Required before client implementation

---

### Quick Wins (Can Be Done Immediately)

1. **Add empty state component** - Improves UX immediately
2. **Add loading skeleton** - Makes dashboard feel faster
3. **Document current API** - Helps identify issues
4. **Fix TypeScript errors** - Improves developer experience
5. **Add status badge component** - Reusable across features
