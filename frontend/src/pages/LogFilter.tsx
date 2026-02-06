import React from 'react';
import type { LogFilterOptions } from '../types/log.types';

interface LogFilterProps {
  filter?: LogFilterOptions;
  onFilterChange?: (filter: LogFilterOptions) => void;
  entryCount?: number;
}

const LogFilter: React.FC<LogFilterProps> = ({ filter, onFilterChange, entryCount }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input 
        type="text" 
        placeholder="Buscar logs..."
        value={filter?.search || ''}
        onChange={(e) => onFilterChange?.({ ...filter, search: e.target.value })}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #4b5563',
          background: '#1f2937',
          color: '#f3f4f6',
          flex: 1
        }}
      />
      <select
        value={filter?.levels?.[0] || ''}
        onChange={(e) => onFilterChange?.({ 
          ...filter, 
          levels: e.target.value ? [e.target.value] : undefined 
        })}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #4b5563',
          background: '#1f2937',
          color: '#f3f4f6'
        }}
      >
        <option value="">Todos os níveis</option>
        <option value="info">Info</option>
        <option value="warn">Warn</option>
        <option value="error">Error</option>
        <option value="debug">Debug</option>
      </select>
      {entryCount !== undefined && (
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
          {entryCount} logs
        </span>
      )}
    </div>
  );
};

export default LogFilter;
