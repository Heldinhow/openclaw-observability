import { useState, useCallback } from 'react';
import { useLogStream } from '../hooks/useLogStream';
import LogList from './LogList';
import LogDetailPanel from './LogDetailPanel';
import ConnectionStatus from './ConnectionStatus';
import LogFilter from './LogFilter';
import type { LogEntry, LogFilterOptions } from '../types/log.types';

export function LogsTab() {
  const { logs, isConnected } = useLogStream();
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [filter, setFilter] = useState<LogFilterOptions | undefined>();

  const handleSelectEntry = useCallback((entry: LogEntry | null) => {
    setSelectedEntry(entry);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ph ph-terminal text-neon-cyan"></i>
            Logs em Tempo Real
          </h2>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-3 mb-4">
        <LogFilter 
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden gap-4">
        <div className={`flex-1 glass-card rounded-2xl overflow-hidden transition-all duration-300 ${selectedEntry ? 'mr-0' : ''}`}>
          <LogList
            entries={logs}
            selectedEntryId={selectedEntry?.id}
            onSelectEntry={handleSelectEntry}
          />
        </div>

        {selectedEntry && (
          <LogDetailPanel
            log={selectedEntry}
            onClose={handleCloseDetail}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="glass rounded-xl px-4 py-2 mt-4 text-xs text-slate-500 flex justify-between items-center font-mono">
        <span>{logs.length} logs em memoria</span>
        <span className="flex items-center gap-2">
          <span className={`status-dot ${isConnected ? 'status-active' : 'status-error'}`}></span>
          {isConnected ? (
            <span className="text-neon-green">Conectado</span>
          ) : (
            <span className="text-red-400">Desconectado</span>
          )}
        </span>
      </div>
    </div>
  );
}
