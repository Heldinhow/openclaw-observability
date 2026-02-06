# Research: Real-time Logs Viewer

**Feature**: 002-realtime-logs-tab  
**Date**: 2026-02-06  
**Research Topics**: Streaming Protocol, File Watching, Syntax Highlighting, JSON Parsing

---

## Topic 1: Real-time Streaming Protocol

### Question
Should we use Server-Sent Events (SSE) or WebSocket for real-time log streaming?

### Research Findings

**Server-Sent Events (SSE)**:
- Built on HTTP, works through corporate firewalls
- Automatic reconnection with `EventSource`
- One-way communication (server → client) - perfect for logs
- Native browser support (97%)
- Simpler implementation (~10 lines vs 50+ for WebSocket)
- Works with HTTP/2 multiplexing

**WebSocket**:
- Bidirectional communication
- Lower latency in theory
- More complex connection management
- Requires manual reconnection logic
- Better for chat, gaming, collaborative editing

**Performance Benchmarks** (Timeplus, 2024):
- 100,000 events/second, 10-30 concurrent connections
- Max throughput: 3M events/sec (tie)
- CPU usage: SSE ~42%, WebSocket ~40%
- Latency (50ms target): SSE 48ms, WebSocket 45ms
- Implementation complexity: SSE 5x simpler

### Decision
**Use Server-Sent Events (SSE)**

### Rationale
- Logs are one-way stream (server to client only)
- SSE has built-in reconnection handling (matches FR-011 requirement)
- Simpler implementation reduces bugs and maintenance
- Works better with existing HTTP infrastructure
- No need for bidirectional communication

### Alternatives Considered
- WebSocket: Overkill for one-way streaming, more complex reconnection logic required
- Long-polling: Less efficient, higher latency
- WebTransport: Still experimental, not widely supported

---

## Topic 2: File Watching Strategy

### Question
Which Node.js library should we use for tailing log files?

### Research Findings

**Option 1: `tail` (npm package)**
- Zero dependencies
- ES6 module support
- Event-based API (`line`, `error` events)
- Supports log rotation via `follow` option
- 2.2M+ weekly downloads
- Simple configuration

**Option 2: `@logdna/tail-file`**
- Production-tested by LogDNA
- Stream-based (can pipe)
- Handles backpressure properly
- Graceful log rotation handling
- Zero dependencies
- More complex API

**Option 3: `tail-file` (aigan)**
- Uses `fs.watch` (no polling)
- Handles log rotation automatically
- Promise-based API
- Smaller user base (less battle-tested)

**Option 4: Native `fs.watch` + `fs.createReadStream`**
- No external dependencies
- Must implement tail logic manually
- Platform-specific quirks
- More code to maintain

### Decision
**Use `tail` npm package**

### Rationale
- Zero dependencies aligns with project simplicity goals
- Event-based API fits well with Express/SSE architecture
- Battle-tested (2.2M+ weekly downloads)
- Built-in log rotation support (`follow: true`)
- Simple to integrate and test
- Active maintenance

### Implementation Notes
```javascript
const Tail = require('tail').Tail;

const tail = new Tail(logFilePath, {
  separator: /[\r]?\n/,
  follow: true,        // Handle log rotation
  useWatchFile: true,  // More reliable across platforms
  flushAtEOF: true     // Handle incomplete lines
});

tail.on('line', (data) => {
  // Parse JSON and broadcast via SSE
});

tail.on('error', (error) => {
  // Log error and emit to SSE clients
});
```

### Alternatives Considered
- `@logdna/tail-file`: Better for high-throughput scenarios, but overkill for our use case
- Native fs.watch: Requires too much custom code, risk of platform bugs

---

## Topic 3: Syntax Highlighting

### Question
Which syntax highlighting library should we use for the detail view?

### Research Findings

**Option 1: `react-syntax-highlighter`**
- Most popular (3.7M+ downloads)
- Supports both Prism.js and highlight.js backends
- Large bundle size (~2.19 MB raw, includes all languages)
- Easy React integration
- Light build option available (register only needed languages)

**Option 2: `prism-react-renderer`**
- Smaller bundle (~18.4 kB)
- More customization options
- Requires manual theme and language setup
- Lower-level API (more control, more code)
- Growing community

**Option 3: Direct `prismjs` usage**
- Most lightweight option
- Manual React integration required
- Full control over rendering
- Risk of XSS if not implemented carefully

**Bundle Size Comparison** (compressed):
- react-syntax-highlighter (light): ~11.7 KiB
- prism-react-renderer: ~18.4 kB + themes
- highlight.js: ~15.6 KiB
- Shiki: ~279.8 KiB (too large, includes WASM)

### Decision
**Use `react-syntax-highlighter` with light build**

### Rationale
- Register only languages we need (JSON, log formats) for small bundle
- Easy React component integration
- Built-in theme support
- XSS protection built-in
- Good performance with light build

### Implementation Notes
```typescript
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json';
import { atomOneDark } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

// Usage in LogDetailPanel
<SyntaxHighlighter 
  language="json" 
  style={atomOneDark}
  wrapLines={true}
  showLineNumbers={true}
>
  {logEntry.message}
</SyntaxHighlighter>
```

### Alternatives Considered
- `prism-react-renderer`: Good option if we need more customization later
- Direct Prism.js: Too much manual implementation risk

---

## Topic 4: JSON Lines Parsing Strategy

### Question
How should we parse JSON Lines format efficiently?

### Research Findings

**Option 1: Line-by-line parsing with `JSON.parse`**
- Simple implementation
- Synchronous (blocking) per line
- Memory efficient (one line at a time)
- Error handling per line

**Option 2: Streaming parser (`JSONStream`, `stream-json`)**
- True streaming for nested JSON
- More complex API
- Overkill for flat log lines

**Option 3: Batch parsing**
- Parse multiple lines at once
- Higher memory usage
- Faster for large files
- More complex error recovery

### Decision
**Use line-by-line parsing with `JSON.parse`**

### Rationale
- OpenClaw logs are flat JSON objects (one per line)
- `tail` library already gives us lines one at a time
- Simpler error handling (one bad line doesn't break the stream)
- Sufficient performance for expected log volume (< 1000 lines/minute)

### Implementation Notes
```typescript
interface LogEntry {
  timestamp: string;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  subsystem: string;
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

function parseLogLine(line: string): LogEntry | null {
  try {
    const parsed = JSON.parse(line);
    // Validate required fields
    if (!parsed.timestamp || !parsed.level || !parsed.message) {
      return null;
    }
    return parsed as LogEntry;
  } catch (error) {
    // Return null for unparseable lines
    // Could optionally return raw line as fallback
    return null;
  }
}
```

### Error Handling Strategy
- Invalid JSON lines: Skip and log warning
- Missing required fields: Skip or display with defaults
- Large lines (>10KB): Truncate with indicator
- Encoding issues: Use UTF-8 with replacement character

---

## Topic 5: Memory Management for Long-Running Sessions

### Question
How do we handle memory for users who keep the tab open for hours?

### Research Findings

**Browser Memory Constraints**:
- Modern browsers: ~2-4GB per tab
- React + TanStack Query overhead: ~50-100MB
- Each log entry: ~1-5KB average
- 250 entries limit: ~250KB - 1.25MB
- Safe threshold: Keep under 100MB total

**Strategies**:
1. **Client-side limiting**: Keep only N entries in React state
2. **Virtual scrolling**: Render only visible entries
3. **Server-side buffering**: Redis cache of recent logs
4. **Periodic refresh**: Clear and reload periodically

### Decision
**Combine client-side limiting + virtual scrolling + server-side buffering**

### Rationale
- Client limit (250 entries) per spec requirement
- Virtual scrolling for smooth rendering of large lists
- Redis cache prevents re-reading file for "Load More"
- Periodic cleanup of old entries in Redis (LRU eviction)

### Implementation Notes
```typescript
// Frontend: Limit stored entries
const MAX_ENTRIES = 250;

const [logs, setLogs] = useState<LogEntry[]>([]);

// When new log arrives
setLogs(prev => {
  const newLogs = [...prev, newLog];
  // Keep only last 250
  return newLogs.slice(-MAX_ENTRIES);
});

// For "Load More", fetch from server with offset
const loadMore = async (beforeTimestamp: string) => {
  const olderLogs = await fetch(`/api/logs?before=${beforeTimestamp}&limit=100`);
  setLogs(prev => [...olderLogs, ...prev]);
};
```

---

## Summary

| Topic | Decision | Key Reason |
|-------|----------|------------|
| Streaming Protocol | Server-Sent Events (SSE) | One-way, auto-reconnect, simple |
| File Watching | `tail` npm package | Zero deps, proven, rotation support |
| Syntax Highlighting | `react-syntax-highlighter` (light) | Easy React integration, XSS safe |
| JSON Parsing | Line-by-line `JSON.parse` | Simple, sufficient for flat logs |
| Memory Management | Client limit + virtual scroll + Redis | Meets spec requirements, safe |

---

## Open Questions for Implementation Phase

1. **Log rotation timing**: How quickly must we detect and switch to new log file? (Spec says "gracefully")
2. **Filter implementation**: Client-side filtering of loaded logs, or server-side with API call?
3. **Search indexing**: For large historical searches, do we need full-text search or is simple text matching sufficient?

**Recommendation**: Address #1 in implementation (use `follow: true` in tail). Address #2 in design (likely client-side for loaded logs, server-side for "Load More"). Defer #3 to future enhancement unless performance issues arise.
