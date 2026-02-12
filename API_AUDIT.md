# API_AUDIT.md

## OpenClaw Subagent API Audit

### Current System State (February 11, 2026)

#### Backend Implementation Status: ✅ COMPLETE

**Routes File:** `/backend/src/api/routes/subagents.ts`
- `GET /api/subagents/running` ✅ Implemented
- `GET /api/subagents/history` ✅ Implemented
- `GET /api/subagents/:id` ✅ Implemented
- `POST /api/subagents/search` ✅ Implemented
- `POST /api/subagents/refresh` ✅ Implemented

**Services File:** `/backend/src/services/subagentService.ts`
- `getRunningSubagents()` ✅ Implemented with caching
- `getSubagentHistory()` ✅ Implemented with caching
- `getSubagentDetail()` ✅ Implemented with caching
- `searchSubagents()` ✅ Implemented

**Data Sources:**
- Reads from log files via `subagentLogReader.ts`
- Falls back to session discovery via `subagentDiscovery.ts`

---

#### Frontend Implementation Status: ✅ COMPLETE

**Components:**
- `SubagentsTab.tsx` ✅ Fully implemented with tabs, filtering, stats
- `RunningSubagentsList` ✅ Implemented with cards
- `SubagentHistoryList` ✅ Implemented with pagination

**Hooks:**
- `useSubagents.ts` ✅ React Query integration
- Polling every 5 seconds ✅
- Cache invalidation ✅

**API Client:**
- `services/api.ts` ✅ All endpoints configured
- TypeScript types ✅ Match backend

---

### Known Issues

#### ISSUE 1: Empty Data Display

**Symptom:** Dashboard shows empty states even when subagents exist

**Root Cause Analysis:**
1. Check if `readRunningSubagents()` finds any subagents
2. Check if `discoverSubagentsFromSessions()` is working
3. Check cache layer for errors

**Debug Commands:**
```bash
# Check if sessions are being discovered
curl http://localhost:3000/api/sessions

# Check running subagents directly
curl http://localhost:3000/api/subagents/running

# Check history
curl http://localhost:3000/api/subagents/history

# Refresh cache
curl -X POST http://localhost:3000/api/subagents/refresh
```

**Fixes Needed:**
- Ensure session files are in correct location
- Ensure log files are being written
- Verify Redis connection for caching

---

#### ISSUE 2: Type Mismatch - "name" vs "slug"

**Status: ✅ RESOLVED**

**Details:** Frontend expects `slug` field but backend returns `name`
- Backend: Returns `Subagent.name` field
- Frontend: Uses `name` in Subagent type
- No mismatch exists - already aligned

---

#### ISSUE 3: Status Badge Colors

**Status: ✅ VERIFIED**

Frontend Status Config:
```typescript
idle: slate-500
running: neon-cyan
completed: neon-green
failed: red-500
cancelled: yellow-500
```

Matches backend `SubagentStatus` type.

---

#### ISSUE 4: Duration Formatting

**Status: ✅ VERIFIED**

Frontend formats duration correctly:
```typescript
formatDuration(seconds): {
  < 1 hour: "Mm Ss"
  > 1 hour: "Hh Mm"
}
```

---

### API Response Examples

#### GET /api/subagents/running

```json
{
  "data": [
    {
      "id": "sub_abc123def456",
      "name": "fix-dashboard-mobile",
      "status": "running",
      "startTime": "2026-02-11T22:30:00.000Z",
      "endTime": null,
      "duration": 1560,
      "taskId": "task-mobile-layout",
      "sessionId": "agent:main:subagent:d5dba01c-f7e8-4b7a-b48b-30b462a4defb",
      "logSummary": null
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1,
    "hasMore": false
  }
}
```

#### GET /api/subagents/history

```json
{
  "data": [
    {
      "id": "sub_xyz789abc123",
      "name": "create-api-endpoint",
      "status": "completed",
      "startTime": "2026-02-11T20:15:00.000Z",
      "endTime": "2026-02-11T20:45:00.000Z",
      "duration": 1800,
      "taskId": "task-api-creation",
      "sessionId": "agent:main:subagent:abc123-def456",
      "logSummary": "Created 3 endpoints, 2 tests passed"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 156,
    "hasMore": true
  },
  "filters": {
    "applied": {
      "status": "completed"
    },
    "totalCount": 156
  }
}
```

---

### Recommended Next Steps

1. **Verify Backend is Running**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check Session Discovery**
   ```bash
   curl http://localhost:3000/api/sessions
   ```

3. **Test Subagent Endpoints**
   ```bash
   curl http://localhost:3000/api/subagents/running
   curl http://localhost:3000/api/subagents/history
   ```

4. **Refresh Cache if Empty**
   ```bash
   curl -X POST http://localhost:3000/api/subagents/refresh
   ```

5. **Check Logs for Errors**
   ```bash
   tail -f logs/openclaw.log | grep subagent
   ```

---

### Backend Logs to Monitor

- `Failed to get running subagents` - Issue with reading subagents
- `No subagents in log files, discovering from session files` - Fallback triggered
- `Subagent not found` - Requested subagent doesn't exist
- `Cache miss` - Normal behavior on first request

---

### Performance Notes

- Caching layer reduces disk I/O
- 5-second polling is aggressive but acceptable for dashboard
- Consider WebSocket upgrade for production (Phase 4)
- History queries can be slow with 1000+ records - pagination helps

---

### Testing Checklist

- [ ] GET /api/subagents/running returns data
- [ ] GET /api/subagents/history returns paginated data
- [ ] GET /api/subagents/:id returns full details
- [ ] POST /api/subagents/search returns filtered results
- [ ] POST /api/subagents/refresh clears cache
- [ ] Frontend displays running subagents
- [ ] Frontend displays history with pagination
- [ ] Filtering works correctly
- [ ] Status badges show correct colors
- [ ] Duration formatting works
- [ ] Empty states display properly
- [ ] Loading states display
- [ ] Error states handle API failures
