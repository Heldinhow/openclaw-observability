# Feature Specification: Real-time Logs Viewer

**Feature Branch**: `002-realtime-logs-tab`  
**Created**: 2026-02-06  
**Status**: Draft  
**Input**: User description: "quero uma aba de logs onde eu consiga ver todos os logs do openclaw em tempo real e ao clicar ver o detalhe"

## User Scenarios & Testing *(mandatory - per Constitution Principle III)*

### User Story 1 - View Real-time Logs Stream (Priority: P1)

As a user of the OpenClaw Observability Dashboard, I want to see a continuous stream of OpenClaw logs updating in real-time so that I can monitor system activity as it happens.

**Why this priority**: This is the core functionality requested. Without real-time log viewing, the feature provides no value.

**Independent Test**: Can be tested by opening the logs tab and verifying that new log entries appear automatically without manual refresh.

**Acceptance Scenarios**:

1. **Given** the user is on the logs tab, **When** OpenClaw generates a new log entry, **Then** the entry appears in the log stream within 2 seconds
2. **Given** the log stream is active, **When** the user scrolls down, **Then** older log entries remain visible and new entries append at the bottom
3. **Given** there are existing log files, **When** the user opens the logs tab, **Then** the most recent 100 log entries are displayed immediately

---

### User Story 2 - Click Log Entry for Details (Priority: P1)

As a user viewing logs, I want to click on any log entry to see its full details so that I can investigate specific events thoroughly.

**Why this priority**: Critical for debugging. Log summaries don't provide enough context for troubleshooting.

**Independent Test**: Can be tested by clicking a log entry and verifying a detail panel/modal opens showing complete log information.

**Acceptance Scenarios**:

1. **Given** the user is viewing the logs list, **When** they click on a log entry, **Then** a side panel slides from the right showing the complete log data including timestamp, level, subsystem, message, and any metadata
2. **Given** the detail panel is open, **When** the user clicks the close button or the logs list area, **Then** the panel closes and the user returns to the full-width logs list
3. **Given** the detail panel is open, **When** new logs arrive, **Then** the background log stream continues updating without closing the detail panel

---

### User Story 3 - Filter and Search Logs (Priority: P2)

As a user monitoring logs, I want to filter logs by level (info, warn, error) and search by text so that I can focus on relevant events.

**Why this priority**: Enhances usability significantly when dealing with high-volume logs, but not essential for MVP.

**Independent Test**: Can be tested by applying a filter and verifying only matching logs are displayed.

**Acceptance Scenarios**:

1. **Given** logs are displaying, **When** the user selects "Error" level filter, **Then** only error-level logs are shown
2. **Given** the user enters search text, **When** they submit the search, **Then** only logs containing that text in message or metadata are displayed
3. **Given** filters are applied, **When** the user clears filters, **Then** all logs are displayed again

---

### User Story 4 - Pause and Resume Log Stream (Priority: P2)

As a user analyzing logs, I want to pause the real-time stream so that I can examine specific entries without them scrolling away.

**Why this priority**: Important for usability when log volume is high, but users can work around by clicking entries quickly.

**Independent Test**: Can be tested by clicking pause, waiting for new logs to be generated, then verifying those logs don't appear until resume is clicked.

**Acceptance Scenarios**:

1. **Given** the log stream is active, **When** the user clicks the pause button, **Then** new log entries stop appearing in the stream
2. **Given** the stream is paused, **When** the user clicks the resume button, **Then** the stream resumes and any logs generated during pause are displayed
3. **Given** the stream is paused, **When** the user clicks on a log entry, **Then** the detail panel opens and the pause state is maintained

---

### Edge Cases

- **Large log files (GBs)**: System MUST implement pagination or virtual scrolling to handle large files without loading entire file into memory
- **OpenClaw gateway unreachable**: System MUST auto-retry connection every 5 seconds with loading indicator (no manual retry required). Display last known logs if available.
- **Long-running sessions (memory)**: System MUST limit displayed log entries to maximum 250 entries in memory. Provide "Load More" button to fetch older entries on demand.
- **Multi-line log entries**: System MUST preserve formatting and display multi-line messages correctly in both list and detail views
- **Log file rotation**: System MUST detect new log files and automatically switch to reading from the new file without user intervention

## Requirements *(mandatory - per Constitution Principle I: API-First)*

### Functional Requirements

- **FR-001**: System MUST display OpenClaw logs in a dedicated "Logs" tab in the dashboard
- **FR-002**: System MUST stream new log entries in real-time (within 2 seconds of generation)
- **FR-003**: System MUST allow users to click any log entry to view complete details
- **FR-004**: System MUST display log details including timestamp, level (info/warn/error/debug), subsystem, and full message
- **FR-005**: System MUST support filtering logs by log level (info, warn, error, debug)
- **FR-006**: System MUST support searching logs by text content
- **FR-007**: System MUST allow users to pause and resume the real-time stream
- **FR-008**: System MUST handle log file rotation gracefully without user intervention
- **FR-009**: System MUST display a visual indicator when the log stream is paused
- **FR-010**: System MUST show the last 100 log entries immediately upon opening the tab
- **FR-011**: System MUST auto-retry connection to log source every 5 seconds when unreachable, with visual loading indicator
- **FR-012**: System MUST limit in-memory log entries to 250 maximum, with "Load More" functionality to fetch older entries
- **FR-013**: System MUST display log details in a side panel (drawer) that slides from the right edge, allowing simultaneous view of logs list and details
- **FR-014**: System MUST apply syntax highlighting to JSON, code blocks, and stack traces in the detail view for improved readability

### Key Entities

- **LogEntry**: Represents a single log event with timestamp, level, subsystem, message, and metadata
- **LogStream**: The real-time connection/channel delivering log entries as they are generated
- **LogFilter**: User-selected criteria for limiting displayed logs (level, search text, time range)
- **LogDetailView**: Side panel (drawer) showing all fields of a selected log entry, slides from right edge

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view logs with less than 2 seconds latency from log generation to display
- **SC-002**: 95% of log entries display all detail fields correctly when clicked
- **SC-003**: Users can filter logs to show only specific levels in under 1 second
- **SC-004**: The interface remains responsive (scroll, click) even with 10,000 log entries loaded
- **SC-005**: Users can pause and resume the stream without data loss
- **SC-006**: Log file rotation does not cause visible interruption to the user experience
- **SC-007**: JSON and code blocks in log details display with proper syntax highlighting

## Clarifications

### Session 2026-02-06

- **Q**: Who should have access to view OpenClaw logs through this dashboard? → **A**: Anyone with dashboard access - all users who can access the observability dashboard can view all logs without additional restrictions. The dashboard itself provides the access control boundary.
- **Q**: When the OpenClaw gateway is unreachable (logs cannot be read), what should the user experience be? → **A**: Auto-retry with loading state - automatically attempt to reconnect every 5 seconds, showing a loading indicator during attempts. No manual intervention required.
- **Q**: What is the maximum number of log entries that should be kept in the browser memory before requiring user action to load more? → **A**: 250 entries - limit to 250 most recent entries in memory, with a "Load More" button to fetch older entries on demand
- **Q**: Should the log detail view open as a side panel (drawer) or modal dialog? → **A**: Side panel (drawer) - sliding panel from the right side allows seeing logs list and details simultaneously, making it easier to click through multiple entries
- **Q**: Should log messages with code snippets, JSON, or stack traces have syntax highlighting in the detail view? → **A**: Yes, full syntax highlighting - apply syntax highlighting to JSON, code blocks, and stack traces for better readability

## Assumptions

- OpenClaw logs are stored in JSON Lines format at the configured log file path
- Log files follow the naming pattern: `openclaw-YYYY-MM-DD.log`
- The backend has read access to the OpenClaw log directory
- Real-time updates will use Server-Sent Events (SSE) or WebSocket for efficiency
- Log levels follow standard conventions: trace, debug, info, warn, error, fatal
- Dashboard access control is handled at the infrastructure level (no additional auth layer needed for logs)
