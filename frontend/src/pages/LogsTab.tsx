import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLogStream } from '../hooks/useLogStream';
import type { LogEntry } from '../types/log.types';

// Format timestamp as HH:MM:SS
function fmtTime(ts: string): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

// Map internal levels to the display levels from the spec
function fmtLevel(level: string): string {
  const map: Record<string, string> = {
    trace: 'DEBUG',
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    fatal: 'ERROR',
    agent: 'AGENT',
    tool: 'TOOL',
  };
  return map[level.toLowerCase()] || level.toUpperCase();
}

// CSS class for ANSI-like coloring by level
function levelClass(level: string): string {
  const display = fmtLevel(level);
  switch (display) {
    case 'ERROR':
      return 'term-error';
    case 'WARN':
      return 'term-warn';
    case 'AGENT':
      return 'term-agent';
    case 'TOOL':
      return 'term-tool';
    case 'DEBUG':
      return 'term-debug';
    default:
      return '';
  }
}

// Derive a short session ID from metadata or service field
function sessionId(entry: LogEntry): string {
  if (entry.metadata?.sessionId) {
    return String(entry.metadata.sessionId).slice(0, 8);
  }
  if (entry.correlationId) {
    return entry.correlationId.slice(0, 8);
  }
  if (entry.subsystem && entry.subsystem !== 'unknown') {
    return entry.subsystem.split('/').pop()?.slice(0, 12) || '--------';
  }
  return '--------';
}

// Format a single log line: [HH:MM:SS] [LEVEL] [SESSION] message
function formatLine(entry: LogEntry): { prefix: string; level: string; message: string; sessionTag: string } {
  return {
    prefix: `[${fmtTime(entry.timestamp)}]`,
    level: `[${fmtLevel(entry.level).padEnd(5)}]`,
    sessionTag: `[${sessionId(entry)}]`,
    message: entry.message,
  };
}

// Render multiline messages with 2-space indent continuation
function renderMessage(msg: string): string[] {
  const lines = msg.split('\n');
  if (lines.length <= 1) return [msg];
  return [lines[0], ...lines.slice(1).map((l) => `  ${l}`)];
}

type FilterLevel = 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AGENT' | 'TOOL';

export function LogsTab() {
  const { logs, isConnected, isPaused, logsPerSecond, pause, resume, clearEntries } = useLogStream();
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('ALL');
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter logs client-side
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Sort chronologically (oldest first) — tail -f style
    result.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (filterLevel !== 'ALL') {
      result = result.filter((l) => fmtLevel(l.level) === filterLevel);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.service?.toLowerCase().includes(q) ||
          l.subsystem?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, filterLevel, searchText]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [filteredLogs, autoScroll]);

  // Detect manual scroll to toggle auto-scroll
  const handleScroll = useCallback(() => {
    if (!terminalRef.current) return;
    const el = terminalRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  // Keyboard handler for terminal-like commands
  const handleCommand = useCallback(
    (cmd: string) => {
      const c = cmd.trim().toLowerCase();
      if (c === 'clear') {
        clearEntries();
      } else if (c === 'pause') {
        pause();
      } else if (c === 'resume') {
        resume();
      } else if (c.startsWith('filter ')) {
        const lvl = c.replace('filter ', '').toUpperCase() as FilterLevel;
        if (['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'AGENT', 'TOOL'].includes(lvl)) {
          setFilterLevel(lvl);
        }
      } else if (c.startsWith('grep ')) {
        setSearchText(c.replace('grep ', ''));
      } else if (c === 'grep' || c === 'nogrep') {
        setSearchText('');
      } else if (c === 'help') {
        // Help is rendered inline — no-op, the UI shows available commands
      }
    },
    [clearEntries, pause, resume]
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // '/' focuses the command input
      if (e.key === '/' && !showInput) {
        e.preventDefault();
        setShowInput(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      // Escape exits the input
      if (e.key === 'Escape' && showInput) {
        setShowInput(false);
      }
      // Ctrl+L to clear
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        clearEntries();
      }
      // Space to pause/resume
      if (e.key === ' ' && !showInput) {
        e.preventDefault();
        isPaused ? resume() : pause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showInput, isPaused, pause, resume, clearEntries]);

  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').split('.')[0];

  return (
    <div className="terminal-container">
      {/* Terminal chrome — title bar */}
      <div className="terminal-titlebar">
        <span className="terminal-titlebar-text">
          root@nexus:~# tail -f /var/log/nexus/sessions.log
        </span>
        <span className="terminal-titlebar-meta">
          {isConnected ? 'LIVE' : 'DISCONNECTED'} | {filteredLogs.length} lines | {logsPerSecond} logs/s
        </span>
      </div>

      {/* Log output area */}
      <div
        className="terminal-output"
        ref={terminalRef}
        onScroll={handleScroll}
      >
        {/* Initial terminal header */}
        <div className="term-system">
          {`Last login: ${dateStr} on pts/0`}
        </div>
        <div className="term-system">
          {`root@nexus:~# tail -f /var/log/nexus/sessions.log`}
        </div>
        <div className="term-system term-dim">
          {`--- OpenClaw Observability | Polling every 5s | ${isConnected ? 'connected' : 'disconnected'} | Press / for commands, SPACE to ${isPaused ? 'resume' : 'pause'} ---`}
        </div>
        <div className="term-system term-dim">&nbsp;</div>

        {/* Log entries */}
        {filteredLogs.length === 0 && (
          <div className="term-dim">
            {'Waiting for log entries...'}
          </div>
        )}

        {filteredLogs.map((entry) => {
          const { prefix, level, sessionTag, message } = formatLine(entry);
          const lines = renderMessage(message);
          const cls = levelClass(entry.level);

          return (
            <div key={entry.id} className={`term-line ${cls}`}>
              <span className="term-ts">{prefix}</span>{' '}
              <span className={`term-level ${cls}`}>{level}</span>{' '}
              <span className="term-session">{sessionTag}</span>{' '}
              <span className="term-msg">
                {lines.map((line, i) =>
                  i === 0 ? line : <div key={i} className="term-continuation">{line}</div>
                )}
              </span>
            </div>
          );
        })}

        {/* Pause indicator */}
        {isPaused && (
          <div className="term-warn term-blink">
            {'--- STREAM PAUSED (press SPACE to resume) ---'}
          </div>
        )}

        {/* Scroll-to-bottom anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Status bar / prompt area */}
      <div className="terminal-statusbar">
        <div className="terminal-statusbar-left">
          <span className={isConnected ? 'term-ok' : 'term-error'}>
            {isConnected ? '● CONNECTED' : '○ DISCONNECTED'}
          </span>
          <span className="term-dim">|</span>
          <span className="term-dim">
            {filterLevel !== 'ALL' ? `FILTER: ${filterLevel}` : 'ALL LEVELS'}
          </span>
          {searchText && (
            <>
              <span className="term-dim">|</span>
              <span className="term-warn">GREP: {searchText}</span>
            </>
          )}
        </div>
        <div className="terminal-statusbar-right">
          <span className="term-dim">
            {filteredLogs.length}/{logs.length} lines
          </span>
          <span className="term-dim">|</span>
          <span className={logsPerSecond > 0 ? 'term-ok' : 'term-dim'}>
            {logsPerSecond} logs/s
          </span>
          <span className="term-dim">|</span>
          <span className="term-dim">
            {autoScroll ? 'AUTO-SCROLL' : 'SCROLL LOCKED'}
          </span>
        </div>
      </div>

      {/* Command input line */}
      <div className="terminal-prompt">
        {showInput ? (
          <div className="terminal-input-wrapper">
            <span className="term-prompt-char">root@nexus:~#&nbsp;</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              placeholder="clear | pause | resume | filter <LEVEL> | grep <text> | help"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommand((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                  setShowInput(false);
                }
                if (e.key === 'Escape') {
                  setShowInput(false);
                }
              }}
            />
          </div>
        ) : (
          <div
            className="terminal-input-wrapper terminal-clickable"
            onClick={() => {
              setShowInput(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
          >
            <span className="term-prompt-char">root@nexus:~#</span>
            <span className="term-cursor">_</span>
            <span className="term-dim term-hint">&nbsp;&nbsp;Press / to type a command</span>
          </div>
        )}
      </div>

      {/* Quick filter bar (keyboard-only feel but still clickable) */}
      <div className="terminal-filterbar">
        {(['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'AGENT', 'TOOL'] as FilterLevel[]).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`terminal-filter-btn ${filterLevel === lvl ? 'terminal-filter-active' : ''} ${
              lvl === 'ERROR' ? 'term-error' : lvl === 'WARN' ? 'term-warn' : ''
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>
    </div>
  );
}
