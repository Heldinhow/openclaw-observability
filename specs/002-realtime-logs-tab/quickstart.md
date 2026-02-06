# Quick Start: Real-time Logs Viewer

**Feature**: 002-realtime-logs-tab  
**Prerequisites**: Node.js 20+, Redis 6+, OpenClaw gateway (for log source)

---

## Development Setup

### 1. Clone and Switch Branch

```bash
git checkout 002-realtime-logs-tab
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Configure Environment

**Backend** (`.env`):
```bash
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
STORAGE_PATH=/root/.local/share/opencode/storage
LOG_FILE_PATH=/tmp/openclaw/openclaw.log
LOG_STREAM_MAX_CONNECTIONS=100
LOG_CACHE_TTL=60
```

**Frontend** (`.env`):
```bash
VITE_API_URL=http://localhost:3000
```

### 4. Start Services

**Redis:**
```bash
redis-server --port 6379
```

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

- Dashboard: http://localhost:5173
- API: http://localhost:3000/api
- API Docs: http://localhost:3000/api-docs (if Swagger UI configured)

---

## Testing

### Run All Tests

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm run test
```

### Manual Testing Checklist

1. **Open logs tab** - Verify last 100 entries load immediately
2. **Generate test logs** - Use OpenClaw CLI to create activity
3. **Verify real-time updates** - New logs should appear within 2 seconds
4. **Test filtering** - Apply level filters, verify only matching logs show
5. **Test search** - Enter search text, verify filtering works
6. **Click log entry** - Verify side panel opens with details
7. **Test pause/resume** - Click pause, generate logs, click resume
8. **Test "Load More"** - Scroll to top, click load more, verify older logs load
9. **Disconnect log source** - Stop OpenClaw, verify auto-retry indicator
10. **Reconnect log source** - Start OpenClaw, verify stream resumes

---

## Log Source Setup (for testing)

If you don't have OpenClaw running, create a mock log file:

```bash
mkdir -p /tmp/openclaw

# Generate sample logs
cat > /tmp/openclaw/openclaw-2026-02-06.log << 'EOF'
{"timestamp":"2026-02-06T14:30:00.123Z","level":"info","subsystem":"gateway","message":"Gateway started","metadata":{"version":"1.0.0"}}
{"timestamp":"2026-02-06T14:30:01.456Z","level":"debug","subsystem":"gateway/channels","message":"Loading channels","metadata":{"count":3}}
{"timestamp":"2026-02-06T14:30:02.789Z","level":"info","subsystem":"gateway/channels/whatsapp","message":"WhatsApp channel ready"}
EOF

# Create symlink for today's logs
ln -sf /tmp/openclaw/openclaw-2026-02-06.log /tmp/openclaw/openclaw.log

# Append new logs in real-time for testing
while true; do
  echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'","level":"info","subsystem":"gateway","message":"Test log entry","metadata":{"test":true}}' >> /tmp/openclaw/openclaw.log
  sleep 5
done
```

---

## Project Structure Overview

```
backend/src/
├── routes/
│   └── logs.ts              # API endpoints
├── services/
│   ├── LogStreamer.ts       # File watching & SSE
│   └── LogParser.ts         # JSON parsing
├── models/
│   └── LogEntry.ts          # Type definitions
└── index.ts                 # Server entry

frontend/src/
├── components/
│   └── logs/
│       ├── LogList.tsx          # Real-time log list
│       ├── LogDetailPanel.tsx   # Side panel
│       ├── LogFilter.tsx        # Filter controls
│       └── LogStream.tsx        # Stream hook
├── hooks/
│   └── useLogStream.ts          # SSE management
├── pages/
│   └── LogsTab.tsx              # Main tab
└── main.tsx                     # App entry
```

---

## API Usage Examples

### Get Historical Logs

```bash
curl "http://localhost:3000/api/logs?limit=10&level=error"
```

### Stream Logs (SSE)

```javascript
const eventSource = new EventSource('http://localhost:3000/api/logs/stream?level=info');

eventSource.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log('New log:', log);
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
};
```

### Filter Logs

```bash
curl -X POST http://localhost:3000/api/logs/filter \
  -H "Content-Type: application/json" \
  -d '{
    "levels": ["error", "warn"],
    "searchText": "webhook",
    "subsystem": "gateway/*"
  }'
```

### Pause/Resume Stream

```bash
# Pause
curl -X POST http://localhost:3000/api/logs/pause

# Resume
curl -X POST http://localhost:3000/api/logs/resume
```

---

## Troubleshooting

### Logs not appearing in real-time

1. Check log file path in `.env` (`LOG_FILE_PATH`)
2. Verify file permissions (backend must have read access)
3. Check browser console for SSE connection errors
4. Verify Redis is running and accessible

### SSE connection keeps closing

1. Check `LOG_STREAM_MAX_CONNECTIONS` limit
2. Verify no proxy/firewall blocking SSE
3. Check backend logs for errors

### High memory usage

1. Verify 250 entry limit is enforced in frontend
2. Check Redis memory usage (`redis-cli INFO memory`)
3. Monitor browser DevTools Memory tab

### Filter/search not working

1. Verify query parameters match OpenAPI spec
2. Check backend logs for filter parsing errors
3. Test with simple filters first (single level)

---

## Next Steps

1. Implement backend endpoints (see `contracts/openapi.yaml`)
2. Create frontend components (see data-model.md)
3. Add integration tests
4. Run full test suite: `npm test && npm run lint`

---

## Architecture Decisions

See `research.md` for detailed technology decisions:

- **Streaming**: Server-Sent Events (SSE) - simpler than WebSocket for one-way
- **File Watching**: `tail` npm package - zero deps, proven reliability
- **Syntax Highlighting**: `react-syntax-highlighter` - easy React integration
- **Caching**: Redis - shared cache between backend instances

---

## Performance Targets

- Log latency: <2 seconds from generation to display
- Filter response: <1 second
- Interface responsiveness: 60fps with 10K entries
- Memory usage: <100MB client-side

See spec.md for complete success criteria.
