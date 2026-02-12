# PLAN.md

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Establish core infrastructure and verify backend endpoints

#### 1.1 Backend API Audit
- [ ] Verify `/api/subagents/running` endpoint
- [ ] Verify `/api/subagents/history` endpoint
- [ ] Document current response formats
- [ ] Identify gaps in data tracking
- [ ] Create API documentation

**Deliverable:** `API_AUDIT.md` documenting current state and issues

#### 1.2 Frontend Infrastructure
- [ ] Set up API client module
- [ ] Configure React Query / data fetching
- [ ] Create TypeScript interfaces
- [ ] Set up error boundaries
- [ ] Create reusable UI components (StatusBadge, LoadingSpinner)

**Deliverable:** `src/api/subagents.ts` and component library

#### 1.3 Session Tracking Fixes
- [ ] Audit subagent creation flow
- [ ] Ensure session start logs to database
- [ ] Ensure session completion updates status
- [ ] Add error capturing for failed subagents
- [ ] Implement session cleanup job

**Deliverable:** `src/backend/session_tracker.py` improvements

---

### Phase 2: Core Features (Week 2)

**Goal:** Deliver working subagent visibility with basic features

#### 2.1 Running Subagents List
- [ ] Implement RunningSubagentsList component
- [ ] Connect to `/api/subagents/running`
- [ ] Add real-time updates (polling)
- [ ] Implement live duration counter
- [ ] Add status badges
- [ ] Test with actual running subagents

**Deliverable:** Working real-time list of running subagents

#### 2.2 Execution History
- [ ] Implement HistoryTable component
- [ ] Connect to `/api/subagents/history`
- [ ] Add pagination controls
- [ ] Implement empty state
- [ ] Add loading skeletons
- [ ] Test pagination with large datasets

**Deliverable:** Working paginated history view

#### 2.3 Basic Details Panel
- [ ] Implement SubagentDetails component
- [ ] Add slide-over/modal pattern
- [ ] Display subagent metadata
- [ ] Add action buttons (copy ID, export)
- [ ] Connect to single subagent endpoint

**Deliverable:** Functional details panel

---

### Phase 3: UX Improvements (Week 3)

**Goal:** Enhance usability with filtering, sorting, and polish

#### 3.1 Filter System
- [ ] Create FilterBar component
- [ ] Implement status filter
- [ ] Implement model filter
- [ ] Implement date range filter
- [ ] Add search functionality
- [ ] Connect filters to API queries

**Deliverable:** Full filtering system

#### 3.2 Sorting System
- [ ] Add sort controls to tables
- [ ] Implement recent activity sort
- [ ] Implement duration sort
- [ ] Implement name sort
- [ ] Add sort direction toggle

**Deliverable:** Sorting on all lists

#### 3.3 Polish & Performance
- [ ] Add skeleton loading states
- [ ] Optimize API calls (deduplication)
- [ ] Add error boundaries
- [ ] Implement proper empty states
- [ ] Add keyboard shortcuts
- [ ] Performance testing

**Deliverable:** Polished, performant dashboard

---

### Phase 4: Real-Time Features (Week 4)

**Goal:** Advanced real-time capabilities

#### 4.1 WebSocket Integration
- [ ] Set up WebSocket server
- [ ] Implement client-side WebSocket
- [ ] Replace polling with WebSocket
- [ ] Handle reconnection logic
- [ ] Add connection status indicator

**Deliverable:** Live updates without polling

#### 4.2 Advanced Details
- [ ] Add execution timeline view
- [ ] Implement logs viewer (with streaming)
- [ ] Add resource metrics display
- [ ] Implement child subagent view
- [ ] Add export functionality

**Deliverable:** Rich details panel with logs

---

### Milestone Timeline

| Week | Milestone | Key Deliverables |
|------|-----------|------------------|
| 1 | Foundation Complete | API verified, TypeScript types, basic API client |
| 2 | Core Features Complete | Running list, history, basic details |
| 3 | UX Complete | Filters, sorting, polish |
| 4 | Real-Time Complete | WebSocket, advanced details |

---

### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend endpoints missing data | High | Audit first, fix tracking if needed |
| Performance issues | Medium | Pagination, lazy loading, caching |
| WebSocket complexity | Medium | Start with polling, upgrade to WS |
| Browser compatibility | Low | Test early, use progressive enhancement |

---

### Success Metrics

1. **Phase 1:** API verified with documented response formats
2. **Phase 2:** Users can see running subagents and history
3. **Phase 3:** Filter and sort work correctly on all data
4. **Phase 4:** Real-time updates working with < 2s latency

---

### Rollout Plan

**Internal Beta (Week 2):**
- Deploy to staging
- Internal team testing
- Bug fixes based on feedback

**Soft Launch (Week 3):**
- Deploy to production
- Limited feature release
- Monitor metrics

**Full Release (Week 4):**
- All features enabled
- Documentation published
- User training materials
