import React from 'react';
import type { LogEntry } from '../types/log.types';

interface LogListProps {
  entries: LogEntry[];
  selectedEntryId: string | undefined;
  onSelectEntry: (entry: LogEntry | null) => void;
}

const LogList: React.FC<LogListProps> = ({ entries = [], selectedEntryId, onSelectEntry }) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {entries.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          Nenhum log encontrado
        </div>
      ) : (
        entries.map((log) => (
        <div
          key={log.id}
          onClick={() => onSelectEntry(log)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: '1px solid #374151',
            backgroundColor: selectedEntryId === log.id ? '#1f2937' : 'transparent',
          }}
        >
          <span className={`text-xs font-mono mr-2`}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span className={`text-xs font-bold uppercase mr-2 ${
            log.level === 'error' ? 'text-red-400' :
            log.level === 'warn' ? 'text-yellow-400' :
            log.level === 'debug' ? 'text-blue-400' :
            'text-green-400'
          }`}>
            {log.level}
          </span>
          <span className="text-gray-300">{log.message}</span>
        </div>
        ))
      )}
    </div>
  );
};

export default LogList;
