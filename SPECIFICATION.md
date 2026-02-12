# SPECIFICATION.md

## OpenClaw Observability Dashboard - Subagent Visibility

### Current State Analysis

**Backend:**
- Has `/api/subagents/running` endpoint (returns active subagents)
- Has `/api/subagents/history` endpoint (returns execution records)
- Sessions are tracked in the system

**Frontend:**
- Has `SubagentsTab` component
- Currently displays empty or limited data
- Integration with backend endpoints incomplete

**Gap Analysis:**
- Endpoint responses not being consumed properly
- No real-time data flow established
- Missing loading/error states
- No filtering or sorting implemented
- Details view not implemented

---

### Functional Requirements

#### FR1: Running Subagents List

**Priority:** P0 (Critical)

**Description:** Display all currently running subagents in real-time

**Fields Required:**
- Subagent ID (unique identifier)
- Subagent slug/name
- Model being used
- Start time (timestamp)
- Current status (running, idle, processing)
- Duration (live counter)
- Parent session/project context
- Action buttons (view details, terminate)

**Behavior:**
- Updates within 3 seconds of state change
- Shows empty state when no subagents running
- Displays connection status indicator
- Live duration counter (HH:MM:SS format)

**Mock API Response:**
```json
{
  "data": [
    {
      "id": "sub_abc123",
      "slug": "fix-dashboard-mobile",
      "model": "opencode/minimax-m2.1-free",
      "start_time": "2026-02-11T22:30:00Z",
      "status": "running",
      "parent_session": "agent:main:subagent:d5dba01c",
      "project": "openclaw-observability",
      "description": "Fix mobile responsive layout"
    }
  ],
  "timestamp": "2026-02-11T22:56:00Z"
}
```

---

#### FR2: Execution History

**Priority:** P0 (Critical)

**Description:** Show historical record of all subagent executions

**Fields Required:**
- Subagent ID
- Subagent slug/name
- Project/context
- Status (completed, failed, terminated)
- Start time
- End time
- Duration
- Output summary (success/error count)
- Model used

**Pagination:**
- 20 records per page
- Page navigation controls
- Jump to page input

**Mock API Response:**
```json
{
  "data": [
    {
      "id": "sub_xyz789",
      "slug": "create-api-endpoint",
      "model": "opencode/kimi-k2.5-free",
      "project": "backend-api",
      "status": "completed",
      "start_time": "2026-02-11T20:15:00Z",
      "end_time": "2026-02-11T20:45:00Z",
      "duration_seconds": 1800,
      "output_summary": "Created 3 endpoints, 2 tests passed"
    }
  ],
  "total": 156,
  "page": 1,
  "per_page": 20
}
```

---

#### FR3: Filtering System

**Priority:** P1 (High)

**Description:** Allow users to filter subagents by various criteria

**Filter Options:**
- Status (running, completed, failed, terminated, all)
- Model (dropdown with available models)
- Project (dropdown with available projects)
- Date range (start date, end date)
- Search by slug/ID

**UI Components:**
- Filter bar above list
- Multi-select support
- Clear filters button
- Active filter indicators

---

#### FR4: Sorting System

**Priority:** P1 (High)

**Description:** Allow users to sort subagent lists

**Sort Options:**
- Recent activity (default) - start_time DESC
- Duration (asc/desc)
- Name (asc/desc)
- Status (alphabetical)
- Model (alphabetical)

---

#### FR5: Subagent Details Panel

**Priority:** P0 (Critical)

**Description:** Show detailed information when clicking a subagent

**Details to Display:**
- Full metadata (all fields from list views)
- Execution timeline (start, end, events)
- Output logs (last 100 lines with expand)
- Resource usage (if available)
- Error messages (if failed)
- Child subagents (if any)
- Parent session reference

**Actions Available:**
- Copy subagent ID
- Copy logs
- Export details (JSON)
- Create similar subagent (pre-fill slug)

**UI Pattern:**
- Slide-over panel (right side)
- Or modal dialog
- Close with X button or ESC key

---

#### FR6: Real-Time Updates

**Priority:** P1 (High)

**Description:** Keep dashboard data fresh without manual refresh

**Implementation Options:**
1. WebSocket connection for live updates
2. Polling every 5 seconds (fallback)
3. Manual refresh button

**Behavior:**
- Running subagents update live
- New subagents appear automatically
- Completed subagents move to history
- Connection status indicator visible

---

### Technical Requirements

#### TR1: Backend API Verification

**Task:** Verify and document existing endpoints

**Required:**
- [ ] Confirm `/api/subagents/running` returns expected format
- [ ] Confirm `/api/subagents/history` returns expected format
- [ ] Check pagination support on history endpoint
- [ ] Verify filtering/ordering support on backend
- [ ] Document any missing fields or issues

**Expected Response Format:**
```typescript
interface RunningSubagent {
  id: string;
  slug: string;
  model: string;
  start_time: string;
  status: 'running' | 'idle' | 'processing';
  parent_session?: string;
  project?: string;
  description?: string;
}

interface SubagentHistory {
  id: string;
  slug: string;
  model: string;
  project?: string;
  status: 'completed' | 'failed' | 'terminated';
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  output_summary?: string;
}
```

---

#### TR2: Frontend Integration

**Task:** Connect SubagentsTab component to backend

**Required:**
- [ ] API client for subagent endpoints
- [ ] React Query or SWR for data fetching
- [ ] Loading states (skeleton loaders)
- [ ] Error states with retry button
- [ ] Empty states with helpful message
- [ ] Success/error handling

---

#### TR3: Session Tracking

**Task:** Ensure all subagent sessions are tracked

**Required:**
- [ ] Subagent creation logs to database
- [ ] Subagent completion updates status
- [ ] Subagent failures captured with error details
- [ ] Background jobs for session cleanup
- [ ] Retention policy (30 days default)

---

#### TR4: Performance Requirements

**Priority:** P2 (Medium)

**Requirements:**
- List loads in < 500ms
- Filter operations < 200ms
- Pagination < 100ms
- WebSocket latency < 2s
- Support 1000+ history records

---

### Non-Functional Requirements

#### NFR1: Accessibility

- Keyboard navigation support
- ARIA labels on all interactive elements
- Screen reader compatible
- Color-blind friendly status indicators

#### NFR2: Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### NFR3: Mobile Support

- Responsive layout
- Touch-friendly interactions
- Readable on mobile screens

---

### Out of Scope

- Real-time subagent control (pause, resume, stop) - Phase 2
- Subagent analytics and charts - Phase 2
- Alerting on subagent failures - Phase 2
- Subagent templates and presets - Phase 2
