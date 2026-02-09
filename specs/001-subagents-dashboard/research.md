# Research: Subagents Dashboard Tab

**Feature**: Subagents Dashboard Tab  
**Date**: 2026-02-09  
**Phase**: Phase 0 - Outline & Research

## Unknowns Identified

### 1. Real-time Update Mechanism

**Question**: How should real-time updates be implemented for the running subagents list?

**Context**: The spec requires new subagents to appear within 5 seconds without page refresh (FR-004, SC-003).

**Research Findings**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Polling (selected)** | Simple to implement, works with existing HTTP infrastructure, easy to cache | Higher server load, not truly real-time | ✅ Selected - Best balance for this use case |
| WebSocket | Truly real-time, lower latency | Adds complexity, requires connection management, harder to cache | Rejected - Overkill for 5-second update requirement |
| Server-Sent Events | Good for one-way streaming, simpler than WebSocket | Still requires connection management, not universally supported | Rejected - Polling is simpler and sufficient |

**Decision**: Implement short-interval polling (5-second interval) with TanStack Query's `refetchInterval` option.

**Rationale**:
- 5-second refresh requirement is easily met with polling
- Aligns with existing stack (HTTP/REST)
- Leverages TanStack Query's built-in caching and deduplication
- Simpler to implement, test, and maintain
- No additional infrastructure (WebSocket server) needed

---

### 2. Subagent Data Storage Format

**Question**: Where and how is subagent execution data currently stored?

**Context**: The AGENTS.md mentions "File system (OpenClaw log files in JSON Lines format)" and Redis for caching.

**Research Findings**:

Based on the existing project context:
- **Primary Storage**: File system with JSON Lines format (`.jsonl` files)
- **Cache Layer**: Redis for session data and potentially filtered results
- **Log Structure**: Likely one file per session or date with subagent events as JSON lines

**Decision**: 
- Running subagents: Read from active log files or Redis (if cached by core system)
- Historical subagents: Read from archived JSON Lines log files
- Cache layer: Use Redis to cache filtered/paginated results

**Rationale**:
- Follows existing architecture established in the project
- File system is already the source of truth for logs
- Redis provides the performance layer for real-time queries
- JSON Lines format supports streaming reads for large files

---

### 3. Pagination Strategy for Large Datasets

**Question**: What pagination approach should be used for subagent history?

**Context**: SC-006 requires handling up to 1000+ records; edge case covers "thousands of records."

**Research Findings**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Offset-based (selected)** | Simple to implement, easy to understand, works with sorted data | Performance degrades with large offsets | ✅ Selected - Sufficient for expected scale |
| Cursor-based | Consistent performance at any scale, handles concurrent modifications | More complex, harder to implement filters | Rejected - Overly complex for this use case |
| Time-based bucketing | Natural for time-series data, efficient queries | Requires pre-computed buckets, complex UI | Rejected - Not needed for current scale |

**Decision**: Implement offset-based pagination with configurable `limit` (default 50, max 100).

**Rationale**:
- Expected dataset size (thousands, not millions) makes offset pagination acceptable
- Simpler to implement with file system reads
- Easier to support filtering and sorting
- Frontend can implement virtualized scrolling for smooth UX

---

### 4. Filter Implementation Strategy

**Question**: Should filtering be done in the backend (API) or frontend?

**Context**: Multiple filter criteria: date range, status, search text (name, task ID, session).

**Research Findings**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Backend filtering (selected)** | Works with pagination, reduces data transfer, leverages server resources | Requires more API complexity | ✅ Selected - Required for large datasets |
| Frontend filtering | Simpler API, instant feedback | Doesn't scale, requires loading all data | Rejected - Violates performance requirements |
| Hybrid | Fast for small sets, scalable for large | Complex implementation | Rejected - Unnecessary complexity |

**Decision**: Implement all filtering server-side with query parameters.

**API Design**:
```
GET /api/subagents/history?status=failed&from=2026-01-01&to=2026-02-09&search=task-123&limit=50&offset=0
```

**Rationale**:
- Backend filtering is essential for pagination to work correctly
- Reduces network transfer (critical for thousands of records)
- Leverages server resources for text search
- Allows database/index optimizations in future

---

### 5. Cache Invalidation Strategy

**Question**: How should the Redis cache be invalidated for subagent data?

**Context**: Constitution Principle IV requires cache invalidation endpoint and strategy.

**Research Findings**:

**Running Subagents Cache**:
- TTL: 5-10 seconds (short, since data changes frequently)
- Key pattern: `subagents:running`
- Invalidation: Automatic TTL expiration (no manual invalidation needed)

**History Cache**:
- TTL: 60 seconds (longer, since historical data is mostly static)
- Key pattern: `subagents:history:{filter_hash}`
- Invalidation: `POST /api/refresh` clears all history cache keys

**Decision**: 
- Short TTL for real-time data (automatic refresh)
- Explicit cache clear endpoint for on-demand refresh
- Filter-specific cache keys to avoid over-invalidation

**Rationale**:
- Short TTL for running subagents aligns with 5-second update requirement
- Longer TTL for history improves performance without staleness concerns
- Filter-specific keys maximize cache hit rate
- `/api/refresh` provides escape hatch for immediate updates

---

## Technology Choices Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Real-time Updates | HTTP Polling (5s interval) | Simple, sufficient, leverages existing stack |
| Data Storage | File system (JSON Lines) + Redis | Follows existing architecture |
| Pagination | Offset-based | Appropriate for expected scale |
| Filtering | Backend (server-side) | Required for pagination and performance |
| State Management | TanStack Query | Caching, deduplication, background updates |
| API Documentation | OpenAPI 3.0 | Industry standard, generates client SDKs |

## No [NEEDS CLARIFICATION] Remaining

All technical unknowns have been resolved through research and documented decisions above. The design is ready to proceed to Phase 1.
