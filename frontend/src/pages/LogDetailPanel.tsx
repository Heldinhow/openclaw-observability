import React from 'react';
import type { LogEntry } from '../types/log.types';

interface LogDetailPanelProps {
  log: LogEntry | null;
  onClose?: () => void;
}

const levelColors: Record<string, string> = {
  error: 'bg-red-400/10 text-red-400',
  warn: 'bg-yellow-400/10 text-yellow-400',
  debug: 'bg-neon-cyan/10 text-neon-cyan',
  info: 'bg-neon-green/10 text-neon-green',
  trace: 'bg-slate-400/10 text-slate-400',
  fatal: 'bg-red-600/10 text-red-600',
};

const LogDetailPanel: React.FC<LogDetailPanelProps> = ({ log, onClose }) => {
  if (!log) {
    return (
      <div className="w-96 glass-card rounded-2xl p-6 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Selecione um log para ver detalhes</p>
      </div>
    );
  }

  return (
    <div className="w-96 glass-card rounded-2xl overflow-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <i className="ph ph-info text-neon-cyan"></i>
          Detalhes do Log
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/50 transition-all"
          >
            <i className="ph ph-x text-sm"></i>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 font-mono text-xs">
        <div className="glass rounded-lg p-3 space-y-3">
          <div>
            <span className="text-slate-600 block mb-1">ID</span>
            <span className="text-slate-300 break-all">{log.id}</span>
          </div>
          <div>
            <span className="text-slate-600 block mb-1">Timestamp</span>
            <span className="text-slate-300">{new Date(log.timestamp).toISOString()}</span>
          </div>
          <div>
            <span className="text-slate-600 block mb-1">Level</span>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              levelColors[log.level] || 'bg-slate-400/10 text-slate-400'
            }`}>
              {log.level.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-slate-600 block mb-1">Service</span>
            <span className="text-neon-purple">{log.service}</span>
          </div>
          <div>
            <span className="text-slate-600 block mb-1">Message</span>
            <span className="text-slate-200 leading-relaxed">{log.message}</span>
          </div>
          {log.metadata && (
            <div>
              <span className="text-slate-600 block mb-1">Metadata</span>
              <pre className="text-slate-300 bg-slate-950/50 rounded-lg p-3 overflow-auto text-[11px] leading-relaxed">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogDetailPanel;
