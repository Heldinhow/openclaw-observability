import React from 'react';
import type { LogFilterOptions } from '../types/log.types';

interface LogFilterProps {
  filter?: LogFilterOptions;
  onFilterChange?: (filter: LogFilterOptions) => void;
  entryCount?: number;
}

const LogFilter: React.FC<LogFilterProps> = ({ filter, onFilterChange, entryCount }) => {
  return (
    <div className="flex gap-3 items-center">
      <div className="relative flex-1">
        <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
        <input 
          type="text" 
          placeholder="Buscar logs..."
          value={filter?.search || ''}
          onChange={(e) => onFilterChange?.({ ...filter, search: e.target.value })}
          className="input-glow w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-slate-500"
        />
      </div>
      <select
        value={filter?.levels?.[0] || ''}
        onChange={(e) => onFilterChange?.({ 
          ...filter, 
          levels: e.target.value ? [e.target.value] : undefined 
        })}
        className="input-glow rounded-xl px-3 py-2 text-sm text-slate-100 font-mono"
      >
        <option value="">Todos os niveis</option>
        <option value="info">Info</option>
        <option value="warn">Warn</option>
        <option value="error">Error</option>
        <option value="debug">Debug</option>
      </select>
      {entryCount !== undefined && (
        <span className="text-slate-500 text-xs font-mono">
          {entryCount} logs
        </span>
      )}
    </div>
  );
};

export default LogFilter;
