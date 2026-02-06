import { LogEntry, LogLevel } from '../types/log.types';

const LEVEL_COLORS: Record<LogLevel, { bg: string; text: string; border: string }> = {
  trace: { bg: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400' },
  debug: { bg: 'bg-blue-400', text: 'text-blue-400', border: 'border-blue-400' },
  info: { bg: 'bg-green-400', text: 'text-green-400', border: 'border-green-400' },
  warn: { bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400' },
  error: { bg: 'bg-red-400', text: 'text-red-400', border: 'border-red-400' },
  fatal: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-600' }
};

export function formatTimestamp(timestamp: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(timestamp);
  
  if (format === 'long') {
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }
  
  return date.toLocaleTimeString('pt-BR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

export function truncateMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + '...';
}

export function getLevelColor(level: LogLevel): { bg: string; text: string; border: string } {
  return LEVEL_COLORS[level];
}

export function formatLogLevel(level: LogLevel): string {
  return level.toUpperCase();
}

export function formatSubsystem(subsystem: string, maxLength: number = 30): string {
  if (subsystem.length <= maxLength) return subsystem;
  const parts = subsystem.split('/');
  if (parts.length > 1) {
    return '.../' + parts.slice(-2).join('/');
  }
  return '...' + subsystem.substring(subsystem.length - maxLength + 3);
}

export function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  
  if (diff < 1000) return 'agora';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s atrás`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
  return `${Math.floor(diff / 86400000)}d atrás`;
}

export function highlightSearchTerms(text: string, searchTerms: string[]): React.ReactNode {
  if (!searchTerms.length) return text;
  
  const regex = new RegExp(`(${searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) => {
        const isMatch = searchTerms.some(term => term.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <span key={index} className="bg-yellow-600 text-white px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </>
  );
}

export function formatEntryForDisplay(entry: LogEntry): {
  timestamp: string;
  level: string;
  levelColor: { bg: string; text: string; border: string };
  subsystem: string;
  message: string;
  relativeTime: string;
} {
  return {
    timestamp: formatTimestamp(entry.timestamp, 'short'),
    level: formatLogLevel(entry.level),
    levelColor: getLevelColor(entry.level),
    subsystem: formatSubsystem(entry.subsystem),
    message: truncateMessage(entry.message),
    relativeTime: formatRelativeTime(entry.timestamp)
  };
}
