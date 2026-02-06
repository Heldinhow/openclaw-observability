import React, { useState, useCallback } from 'react';
import { useLogStream } from '../hooks/useLogStream';
import { LogList } from './LogList';
import { LogDetailPanel } from './LogDetailPanel';
import { ConnectionStatus } from './ConnectionStatus';
import { LogFilter } from './LogFilter';
import { LogEntry, LogFilter as LogFilterType } from '../types/log.types';

export function LogsTab() {
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [filter, setFilter] = useState<LogFilterType | undefined>();
  
  const {
    state: streamState,
    status: streamStatus,
    connect,
    disconnect,
    pause,
    resume,
    updateFilter,
    clearEntries
  } = useLogStream({
    initialFilter: filter,
    onError: useCallback((error) => {
      console.error('Stream error:', error);
    }, []),
    onReconnect: useCallback(() => {
      console.log('Stream reconnected');
    }, [])
  });

  const handleFilterChange = useCallback((newFilter: LogFilterType) => {
    setFilter(newFilter);
    updateFilter(newFilter);
  }, [updateFilter]);

  const handleSelectEntry = useCallback((entry: LogEntry | null) => {
    setSelectedEntry(entry);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Logs em Tempo Real</h2>
          <ConnectionStatus 
            status={streamStatus}
            onConnect={connect}
            onDisconnect={disconnect}
            onPause={streamStatus.isPaused ? resume : pause}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
        <LogFilter 
          filter={filter}
          onFilterChange={handleFilterChange}
          entryCount={streamStatus.entriesInMemory}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Log List */}
        <div className={`flex-1 ${selectedEntry ? 'mr-96' : ''} transition-all duration-300`}>
          <LogList
            entries={streamState.entries}
            selectedEntryId={selectedEntry?.id}
            onSelectEntry={handleSelectEntry}
          />
        </div>

        {/* Detail Panel */}
        {selectedEntry && (
          <LogDetailPanel
            entry={selectedEntry}
            onClose={handleCloseDetail}
          />
        )}
      </div>

      {/* Footer with stats */}
      <div className="px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
        <span>
          {streamStatus.entriesInMemory} logs em memória
          {streamStatus.isPaused && (
            <span className="ml-2 text-yellow-400">• Pausado</span>
          )}
        </span>
        <span>
          {streamStatus.isConnected ? (
            <span className="text-green-400">● Conectado</span>
          ) : (
            <span className="text-red-400">● Desconectado</span>
          )}
        </span>
      </div>
    </div>
  );
}
