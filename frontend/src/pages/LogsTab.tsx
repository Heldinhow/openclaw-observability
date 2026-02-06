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
    <div className="h-full flex flex-col bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Logs em Tempo Real</h2>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
        <LogFilter 
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 ${selectedEntry ? 'mr-96' : ''} transition-all duration-300`}>
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

      <div className="px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
        <span>{logs.length} logs em memória</span>
        <span>
          {isConnected ? (
            <span className="text-green-400">● Conectado</span>
          ) : (
            <span className="text-red-400">● Desconectado</span>
          )}
        </span>
      </div>
    </div>
  );
}
