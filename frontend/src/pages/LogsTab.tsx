import { useState, useCallback, useMemo } from 'react';
import { useLogStream } from '../hooks/useLogStream';
import LogList from './LogList';
import LogDetailPanel from './LogDetailPanel';
import ConnectionStatus from './ConnectionStatus';
import LogFilter from './LogFilter';
import type { LogEntry, LogFilterOptions } from '../types/log.types';

export function LogsTab() {
  const { logs, isConnected, logsPerSecond } = useLogStream();
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [filter, setFilter] = useState<LogFilterOptions>({});

  const handleSelectEntry = useCallback((entry: LogEntry | null) => {
    setSelectedEntry(entry);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by level
    if (filter.levels && filter.levels.length > 0) {
      result = result.filter((log) => filter.levels!.includes(log.level));
    }

    // Filter by search text
    if (filter.search && filter.search.trim()) {
      const search = filter.search.toLowerCase().trim();
      result = result.filter(
        (log) =>
          log.message.toLowerCase().includes(search) ||
          log.service?.toLowerCase().includes(search) ||
          log.subsystem?.toLowerCase().includes(search) ||
          log.id?.toLowerCase().includes(search)
      );
    }

    // Filter by services
    if (filter.services && filter.services.length > 0) {
      result = result.filter(
        (log) =>
          filter.services!.includes(log.service) ||
          filter.services!.includes(log.subsystem)
      );
    }

    // Sort by timestamp descending (newest first)
    result = [...result].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return result;
  }, [logs, filter]);

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
          entryCount={filteredLogs.length}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden gap-4">
        <div className={`flex-1 glass-card rounded-2xl overflow-hidden transition-all duration-300 ${selectedEntry ? 'mr-0' : ''}`}>
          <LogList
            entries={filteredLogs}
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
        <span>
          {filteredLogs.length === logs.length
            ? `${logs.length} logs em memoria`
            : `${filteredLogs.length} de ${logs.length} logs`
          }
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <i className="ph ph-activity text-xs"></i>
            <span className={logsPerSecond > 0 ? 'text-neon-cyan' : 'text-slate-600'}>
              {logsPerSecond} logs/s
            </span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-[10px] text-slate-600">SSE (tempo real)</span>
          <span className="text-slate-700">|</span>
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
    </div>
  );
}
