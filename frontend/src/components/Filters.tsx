import React from 'react';
import type { Project, SessionFilters as Filters } from '../types';

interface FiltersProps {
  projects: Project[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Filters({
  projects,
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing,
}: FiltersProps) {
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      project: e.target.value || undefined,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      status: (e.target.value as 'active' | 'inactive' | 'all') || 'all',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <label htmlFor="project-filter" className="text-sm text-gray-400">
          Projeto:
        </label>
        <select
          id="project-filter"
          value={filters.project || ''}
          onChange={handleProjectChange}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.name}>
              {project.name} ({project.sessionCount || 0})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm text-gray-400">
          Status:
        </label>
        <select
          id="status-filter"
          value={filters.status || 'all'}
          onChange={handleStatusChange}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      <div className="flex-1"></div>

      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
      >
        {isRefreshing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Atualizando...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Atualizar
          </>
        )}
      </button>
    </div>
  );
}
