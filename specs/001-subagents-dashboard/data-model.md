# Data Model: Subagents Dashboard Tab

**Feature**: Subagents Dashboard Tab  
**Date**: 2026-02-09  
**Source**: [spec.md](./spec.md)

## Entities

### Subagent

A distinct execution unit spawned to handle specific tasks within the OpenClaw system.

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier for the subagent instance |
| `name` | string | Yes | Human-readable name/type of the subagent |
| `status` | enum | Yes | Current execution status: `idle`, `running`, `completed`, `failed`, `cancelled` |
| `startTime` | ISO 8601 datetime | Yes | When the subagent started execution |
| `endTime` | ISO 8601 datetime | No | When the subagent finished (null if running) |
| `duration` | integer (seconds) | No | Total execution time (calculated field) |
| `taskId` | string | Yes | Reference to the task this subagent is handling |
| `sessionId` | string | Yes | Reference to the parent session |
| `logs` | array of LogEntry | No | Execution log entries (truncated in list views) |
| `parameters` | object | No | Input parameters passed to the subagent |
| `results` | object | No | Output results from execution (if completed) |
| `errorMessage` | string | No | Error details (if status is `failed`) |

**State Transitions**:

```
         start
           ↓
   ┌────→ RUNNING ────→ COMPLETED
   │         │
   │         ├────────→ FAILED
   │         │
   │         └────────→ CANCELLED
   │              
   └────────────────── (restart/new instance)
```

**Validation Rules**:
- `endTime` must be >= `startTime` when present
- `duration` is calculated as `endTime - startTime` (seconds)
- `errorMessage` is required when `status` is `failed`
- `results` is only present when `status` is `completed`

---

### Subagent Execution Record

Historical snapshot of a completed subagent execution for auditing and analysis.

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier (same as subagent id) |
| `subagentId` | string | Yes | Reference to the original subagent |
| `name` | string | Yes | Subagent name at time of execution |
| `status` | enum | Yes | Final status: `completed`, `failed`, `cancelled` |
| `startTime` | ISO 8601 datetime | Yes | Execution start timestamp |
| `endTime` | ISO 8601 datetime | Yes | Execution end timestamp |
| `duration` | integer (seconds) | Yes | Total execution duration |
| `taskId` | string | Yes | Associated task identifier |
| `sessionId` | string | Yes | Associated session identifier |
| `logSummary` | string | No | Truncated log preview (first 500 chars) |
| `logFilePath` | string | Yes | Path to full log file |
| `resourceUsage` | object | No | CPU, memory statistics |
| `createdAt` | ISO 8601 datetime | Yes | When record was persisted |

**Validation Rules**:
- `status` cannot be `running` for execution records
- `logFilePath` must be accessible and valid
- `duration` must equal `endTime - startTime`

---

### Task Association

Relationship linking subagents to their parent tasks and sessions.

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | Yes | Unique task identifier |
| `sessionId` | string | Yes | Parent session identifier |
| `subagentIds` | array of string | Yes | List of subagent IDs handling this task |
| `taskType` | string | Yes | Type/category of task |
| `createdAt` | ISO 8601 datetime | Yes | When task was created |
| `priority` | enum | No | Task priority: `low`, `normal`, `high`, `critical` |

---

### Log Entry

Individual log line from subagent execution.

**Attributes**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | ISO 8601 datetime | Yes | When log was generated |
| `level` | enum | Yes | Log level: `debug`, `info`, `warn`, `error` |
| `message` | string | Yes | Log message content |
| `metadata` | object | No | Additional structured data |

---

## Relationships

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     Session     │◄──────┤  Task Association│──────►│      Task       │
└─────────────────┘       └──────────────────┘       └─────────────────┘
                                    │
                                    │ 1:N
                                    ▼
                          ┌──────────────────┐
                          │    Subagent      │
                          │  (real-time)     │
                          └──────────────────┘
                                    │
                                    │ transforms to
                                    ▼
                          ┌──────────────────┐
                          │ SubagentExecution│
                          │     Record       │
                          │  (historical)    │
                          └──────────────────┘
                                    │
                                    │ contains
                                    ▼
                          ┌──────────────────┐
                          │    Log Entry     │
                          │   (log lines)    │
                          └──────────────────┘
```

## Data Flow

### Real-time Subagents (Running)

1. Core system writes subagent events to active log file
2. Backend reads from tail of active log file or Redis
3. API returns current running subagents with 5-second cache TTL
4. Frontend polls every 5 seconds for updates

### Historical Subagents

1. Completed subagents are archived to historical log files
2. Backend reads from archived files based on date range
3. Results are cached in Redis with 60-second TTL
4. API supports filtering, pagination, and search
5. Frontend displays with virtualized scrolling

## Storage Mapping

| Entity | Primary Storage | Cache | Notes |
|--------|----------------|-------|-------|
| Subagent (running) | File system (active log) | Redis (5s TTL) | Frequently changing |
| Subagent (history) | File system (archived logs) | Redis (60s TTL) | Static after completion |
| Execution Record | File system (derived) | Redis (60s TTL) | Generated on demand |
| Log Entries | File system (log files) | None (streaming) | Read directly from files |

## Indexing Strategy

Since data is stored in JSON Lines files, the following index structures will be maintained in Redis:

- `index:subagents:running` - Set of currently running subagent IDs
- `index:subagents:history:{date}` - Sorted set of subagent IDs by end time
- `index:subagents:task:{taskId}` - Set of subagent IDs for quick lookup
- `index:subagents:session:{sessionId}` - Set of subagent IDs for quick lookup

These indexes enable efficient filtering without scanning entire files.
