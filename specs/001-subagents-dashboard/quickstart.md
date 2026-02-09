# Quickstart Guide: Subagents Dashboard Tab

**Feature**: Subagents Dashboard Tab  
**Date**: 2026-02-09  

## Overview

This guide helps you get started with the Subagents Dashboard feature implementation.

## Prerequisites

- Node.js 20+
- Redis 7+
- Existing OpenClaw Observability dashboard running

## Architecture

This feature follows the web application architecture with:
- **Backend**: Express API with Redis caching and file system log reading
- **Frontend**: React components with TanStack Query for state management
- **Real-time Updates**: HTTP polling every 5 seconds
- **Data Storage**: File system (JSON Lines) + Redis cache

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subagents/running` | GET | List currently running subagents |
| `/api/subagents/history` | GET | List historical subagent executions |
| `/api/subagents/:id` | GET | Get detailed subagent information |
| `/api/subagents/search` | POST | Advanced search across all subagents |
| `/api/refresh` | POST | Invalidate cache and refresh data |

## File Structure

```
specs/001-subagents-dashboard/
├── spec.md                    # Feature specification
├── plan.md                    # Implementation plan (this file)
├── research.md                # Phase 0 research and decisions
├── data-model.md              # Entity definitions
├── quickstart.md              # This guide
└── contracts/
    └── openapi.yaml           # API contract specification
```

## Implementation Order

### Phase 1: Backend Foundation

1. **Create data models** (`backend/src/models/subagent.ts`)
   - Define TypeScript interfaces for Subagent, LogEntry, etc.
   
2. **Implement cache service** (`backend/src/services/cacheService.ts`)
   - Redis wrapper with TTL management
   - Key generation utilities
   
3. **Implement log reader service** (`backend/src/services/logReaderService.ts`)
   - File system reader for JSON Lines format
   - Tail reader for real-time updates
   - Archive reader for historical data
   
4. **Implement subagent service** (`backend/src/services/subagentService.ts`)
   - Business logic for filtering, searching
   - Pagination handling
   - Cache integration
   
5. **Create API routes** (`backend/src/api/routes/subagents.ts`)
   - Implement all 5 endpoints
   - Add validation middleware
   - Add error handling

6. **Add tests**
   - Unit tests for services
   - Integration tests for Redis and file system
   - Contract tests for API endpoints

### Phase 2: Frontend Implementation

1. **Create API client** (`frontend/src/services/subagentApi.ts`)
   - TypeScript client matching OpenAPI spec
   - Axios instance with base URL
   
2. **Create TanStack Query hooks** (`frontend/src/hooks/useSubagents.ts`)
   - `useRunningSubagents()` - with 5s polling
   - `useSubagentHistory()` - with pagination
   - `useSubagentDetails()` - for detail view
   - `useSearchSubagents()` - for search
   
3. **Build components**
   - `SubagentsTab.tsx` - Main tab container
   - `RunningSubagentsList.tsx` - Real-time list
   - `SubagentHistoryList.tsx` - Historical list with pagination
   - `SubagentFilters.tsx` - Filter controls
   - `SubagentSearch.tsx` - Search input
   - `SubagentDetail.tsx` - Detail view modal
   
4. **Add navigation**
   - Add "Subagents" tab to dashboard navigation
   - Wire up routing
   
5. **Add tests**
   - Component tests with React Testing Library
   - Hook tests

## Configuration

Add these environment variables to your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Subagent Feature Configuration
SUBAGENT_LOG_PATH=/var/log/openclaw/subagents
SUBAGENT_RETENTION_DAYS=30
SUBAGENT_CACHE_TTL_RUNNING=5
SUBAGENT_CACHE_TTL_HISTORY=60
SUBAGENT_POLLING_INTERVAL=5000
```

## Development Workflow

1. **Start Redis**
   ```bash
   redis-server
   ```

2. **Start backend** (in `backend/` directory)
   ```bash
   npm install
   npm run dev
   ```

3. **Start frontend** (in `frontend/` directory)
   ```bash
   npm install
   npm run dev
   ```

4. **Run tests**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd frontend && npm run test
   ```

5. **Lint and type check**
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

## Testing the Feature

### Manual Testing Checklist

- [ ] Open dashboard and click "Subagents" tab
- [ ] Verify running subagents appear (or empty state shows)
- [ ] Start a subagent and verify it appears within 5 seconds
- [ ] Switch to history view and verify historical records load
- [ ] Apply date range filter and verify results update
- [ ] Apply status filter and verify results update
- [ ] Use search box and verify filtering works
- [ ] Click on a subagent and verify detail view opens
- [ ] Verify logs are visible in detail view
- [ ] Navigate back and verify filters are preserved
- [ ] Click refresh button and verify cache is invalidated

### Key Test Scenarios

1. **No running subagents**: Should show friendly empty state
2. **Large history**: Should paginate smoothly (50 items per page)
3. **Real-time updates**: New subagents appear without refresh
4. **Concurrent users**: Both users see consistent data
5. **Cache refresh**: Manual refresh updates data immediately

## Common Issues

### Redis Connection Errors
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check `REDIS_URL` environment variable

### Log File Not Found
- Verify `SUBAGENT_LOG_PATH` points to correct directory
- Ensure OpenClaw core is writing subagent logs

### Real-time Updates Not Working
- Check browser console for polling errors
- Verify backend `/api/subagents/running` endpoint returns data
- Check Redis cache is being populated

## Next Steps

1. Review the [spec.md](./spec.md) for detailed requirements
2. Check [data-model.md](./data-model.md) for entity definitions
3. Review [contracts/openapi.yaml](./contracts/openapi.yaml) for API contracts
4. Start with backend service implementation
5. Move to frontend components once API is stable

## Support

For questions or issues:
- Check existing tests for usage examples
- Review the specification for clarification
- Consult the architecture decision records in [research.md](./research.md)
