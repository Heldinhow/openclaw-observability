import React from 'react';
import type { LogEntry } from '../types/log.types';

interface LogListProps {
  entries: LogEntry[];
  selectedEntryId: string | undefined;
  onSelectEntry: (entry: LogEntry | null) => void;
}

const levelColors: Record<string, string> = {
  error: 'bg-red-400/10 text-red-400',
  warn: 'bg-yellow-400/10 text-yellow-400',
  debug: 'bg-neon-cyan/10 text-neon-cyan',
  info: 'bg-neon-green/10 text-neon-green',
  trace: 'bg-slate-400/10 text-slate-400',
  fatal: 'bg-red-600/10 text-red-600',
};

const LogList: React.FC<LogListProps> = ({ entries = [], selectedEntryId, onSelectEntry }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {entries.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center mx-auto mb-4">
            <i className="ph ph-list-dashes text-2xl text-neon-cyan"></i>
          </div>
          <p className="text-slate-500">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {entries.map((log) => (
            <div
              key={log.id}
              onClick={() => onSelectEntry(log)}
              className={`log-entry px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-all duration-200 ${
                selectedEntryId === log.id
                  ? 'bg-neon-cyan/5 border-l-neon-cyan'
                  : ''
              }`}
            >
              <span className="text-[10px] font-mono text-slate-600 min-w-[70px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                levelColors[log.level] || 'bg-slate-400/10 text-slate-400'
              }`}>
                {log.level}
              </span>
              <span className="text-sm text-slate-300 truncate">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogList;
