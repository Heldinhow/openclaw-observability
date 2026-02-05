# Feature Specification: Session Details View

**Feature Branch**: `001-session-details-view`  
**Created**: 2026-02-05  
**Status**: Draft  
**Input**: User description: "Funcionalidades: - Scan automático de cada dir em projects/ (backend/frontend se tiverem opencode sessions) - Para cada projeto: opencode session list → parse output (ID, Updated, Messages) - Tabela com colunas: Projeto, Session ID, Updated, Messages count, Status (active/inactive) - Filtro por projeto ou status - Refresh button - Clique em session → detalhes (history via opencode session load or logs) - Backend Node/Express + SQLite pra cache sessões (update a cada 30s) - Frontend React/Vite + Tailwind, dark theme - Deploy: backend 3000, frontend 5173, external IP 76.13.101.17 - Integra com observability existente (logs/tasks) quero poder ver o titulo da session, e ao clicar, ver o detalhe com toda interação entre agent e user."

## User Scenarios & Testing

### User Story 1 - View Session List with Titles (Priority: P1)

As a developer or project manager, I want to see a list of all opencode sessions across my projects with their titles, so that I can quickly identify which sessions are active and what they are about.

**Why this priority**: This is the foundational feature that enables all other observability capabilities. Without seeing session titles, users cannot effectively navigate or filter sessions.

**Independent Test**: Can be fully tested by accessing the dashboard and verifying the session table displays with Project, Session ID, Title, Updated, Messages, and Status columns visible.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded, **When** the page renders, **Then** a table displaying all sessions should appear with columns for Project name, Session ID, Session title, Last updated timestamp, Message count, and Status indicator
2. **Given** multiple projects exist in projects/ directories, **When** the dashboard scans, **Then** sessions from all projects should appear in the unified table
3. **Given** a session is active, **When** it receives new messages, **Then** the Updated timestamp and Message count should reflect the changes
4. **Given** no sessions exist, **When** the dashboard loads, **Then** an empty state message should display with guidance on how to create sessions

---

### User Story 2 - Filter and Search Sessions (Priority: P1)

As a user with many sessions across multiple projects, I want to filter sessions by project name or status, so that I can quickly find the specific sessions I need to review.

**Why this priority**: Essential for usability when the number of sessions grows beyond a handful. Without filtering, the session list becomes unusable at scale.

**Independent Test**: Can be tested by creating multiple sessions across different projects, then using filter controls to verify only matching sessions display.

**Acceptance Scenarios**:

1. **Given** multiple sessions across different projects exist, **When** I type a project name in the project filter, **Then** only sessions from matching projects should display
2. **Given** sessions have different statuses, **When** I select a status filter (active/inactive), **Then** only sessions with that status should display
3. **Given** both filters are applied, **When** I set project filter and status filter, **Then** sessions matching both criteria should display
4. **Given** no sessions match the filters, **When** I apply restrictive filters, **Then** an empty state message should indicate no sessions match

---

### User Story 3 - View Session Interaction History (Priority: P1)

As a user who needs to review session conversations, I want to click on any session and see the complete interaction history between the agent and user, so that I can understand the full context and decisions made in each session.

**Why this priority**: Core value proposition - the ability to view the complete agent-user conversation history is the primary reason for the dashboard's existence.

**Independent Test**: Can be tested by clicking on any session row and verifying a detail panel opens displaying all messages in chronological order with clear agent/user attribution.

**Acceptance Scenarios**:

1. **Given** the session list is displayed, **When** I click on any session row, **Then** a detail panel should open showing the complete conversation history
2. **Given** the detail panel is open, **When** the conversation loads, **Then** each message should display with clear attribution showing whether it came from the agent or the user
3. **Given** a session has many messages, **When** the conversation is long, **Then** messages should be displayed in chronological order with the newest at the bottom
4. **Given** I want to see session metadata, **When** the detail panel opens, **Then** session title, status, project name, and timestamps should be visible alongside the conversation
5. **Given** I finish reviewing, **When** I close the detail panel, **Then** the session list should remain visible and accessible

---

### User Story 4 - Real-time Session Updates (Priority: P2)

As a user monitoring active sessions, I want to refresh the session list and see updated information, so that I can track session activity without manual intervention.

**Why this priority**: Important for monitoring workflows where users need to see current session state without navigating away.

**Independent Test**: Can be tested by clicking the refresh button and verifying the session list updates with current data including new sessions, updated timestamps, and status changes.

**Acceptance Scenarios**:

1. **Given** the dashboard is displaying sessions, **When** I click the Refresh button, **Then** the session list should immediately update with current data from all projects
2. **Given** a refresh is in progress, **When** I click refresh again, **Then** a loading indicator should display and prevent duplicate requests
3. **Given** new sessions were created, **When** I refresh, **Then** the new sessions should appear in the table
4. **Given** sessions have been updated, **When** I refresh, **Then** the Updated column should reflect the latest timestamps

---

### User Story 5 - Integration with Observability (Priority: P2)

As an operator monitoring system health, I want session observability to integrate with existing logging and task tracking, so that session activity is visible in the broader observability context.

**Why this priority**: Critical for operational awareness and correlating session activity with other system events and tasks.

**Independent Test**: Can be verified by checking that backend operations emit structured logs and frontend errors are reported to the task tracking system.

**Acceptance Scenarios**:

1. **Given** backend operations are running, **When** sessions are discovered or cached, **Then** structured logs should be emitted to the central logging system
2. **Given** frontend errors occur, **When** an error happens in the UI, **Then** the error should be reported to the task tracking system
3. **Given** I want to monitor performance, **When** the dashboard runs, **Then** cache hit rates and discovery latency metrics should be available

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST automatically scan all directories within projects/ for opencode sessions
- **FR-002**: System MUST parse output from `opencode session list` to extract session ID, last updated timestamp, and message count for each session
- **FR-003**: System MUST extract and display session titles alongside session IDs in the listing table
- **FR-004**: System MUST display sessions in a table with columns: Project name, Session ID, Session title, Last updated, Message count, Status indicator
- **FR-005**: System MUST filter sessions by project name (text matching)
- **FR-006**: System MUST filter sessions by status (active/inactive)
- **FR-007**: System MUST provide a refresh button that triggers immediate cache invalidation and rediscovery of all sessions
- **FR-008**: System MUST open a detail panel when any session row is clicked
- **FR-009**: System MUST display the complete interaction history between agent and user in the detail panel
- **FR-010**: System MUST clearly attribute each message to either the agent or the user in the conversation display
- **FR-011**: System MUST display messages in chronological order with newest messages at the bottom
- **FR-012**: System MUST show session metadata (title, status, project, timestamps) alongside the conversation history
- **FR-013**: System MUST allow closing the detail panel to return to the session list
- **FR-014**: Backend MUST expose RESTful API endpoints for session discovery and retrieval
- **FR-015**: Backend MUST use Redis as the cache store for session data with a maximum 5-minute TTL
- **FR-016**: Backend MUST update cached session data automatically when TTL expires
- **FR-017**: Backend MUST emit structured logs to the central logging system for all discovery and cache operations
- **FR-018**: Frontend MUST report errors to the task tracking system
- **FR-019**: Frontend MUST expose performance metrics (cache hit rates, discovery latency)

### Key Entities

- **Session**: Represents an opencode session with ID, title, project association, status, timestamps, and message count
- **Message**: Individual communication within a session with content, author attribution (agent/user), and timestamp
- **Project**: Directory containing opencode sessions, identified by path within projects/
- **SessionCache**: Redis cache storing session metadata with 5-minute TTL for rapid querying

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can view all sessions across projects in a single unified table within 5 seconds of page load
- **SC-002**: Users can filter sessions by project name or status and see results within 2 seconds of filter application
- **SC-003**: Users can click any session and view the complete agent-user interaction history within 3 seconds
- **SC-004**: Session list refresh completes and displays updated information within 10 seconds of button click
- **SC-005**: The dashboard maintains accurate session state with cache updates not exceeding 5 minutes behind actual session changes
- **SC-006**: All backend operations are logged to the central observability system within 5 seconds of occurrence
- **SC-007**: Frontend error reporting to task tracking achieves 95% success rate

## Assumptions

- Session metadata is stored in JSON files at ~/.local/share/opencode/storage/session/
- Message metadata is stored in JSON files at ~/.local/share/opencode/storage/message/{sessionID}/
- Message content is stored in JSON files at ~/.local/share/opencode/storage/part/{messageID}/
- Session titles are available in the session metadata file as the `title` field
- The `opencode session list` command is NOT needed - data is read directly from files
- Existing observability infrastructure (logs/tasks) is accessible via standard APIs or integration points
- Projects directory structure follows the pattern: ~/.local/share/opencode/storage/session/{projectID}/
- Session status (active/inactive) can be determined from session metadata using the `time.updated` timestamp
- Redis server is available at the configured host/port for session caching
