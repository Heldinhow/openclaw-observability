import React, { useState } from 'react';
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
  const [searchOpen, setSearchOpen] = useState(false);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      project: e.target.value || undefined,
    });
  };

  const handleStatusChange = (status: 'active' | 'inactive' | 'all') => {
    onFilterChange({ ...filters, status });
  };

  const statusOptions = [
    { value: 'all' as const, label: 'Todos', icon: 'ph ph-circles-three-plus' },
    { value: 'active' as const, label: 'Ativo', icon: 'ph ph-lightning' },
    { value: 'inactive' as const, label: 'Inativo', icon: 'ph ph-moon' },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Main filter bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {/* Search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            searchOpen
              ? 'bg-neon-cyan/10 text-neon-cyan'
              : 'glass text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="ph ph-magnifying-glass text-lg"></i>
        </button>

        {/* Project filter */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center">
            <i className="ph ph-folder-notch text-sm text-neon-purple"></i>
          </div>
          <select
            value={filters.project || ''}
            onChange={handleProjectChange}
            className="input-glow rounded-xl px-3 py-2 text-sm text-slate-100 font-mono min-w-[160px]"
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.name}>
                {project.name} ({project.sessionCount || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-white/5 hidden md:block"></div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-1.5
                ${filters.status === opt.value
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                  : 'glass text-slate-500 hover:text-slate-300 border border-transparent'
                }
              `}
            >
              <i className={opt.icon}></i>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`
            px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300
            ${isRefreshing
              ? 'glass text-slate-500 cursor-not-allowed'
              : 'btn-neon text-slate-950 hover:shadow-lg hover:shadow-neon-cyan/20 hover:scale-[1.02]'
            }
          `}
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-neon-cyan border-t-transparent"></div>
              Atualizando...
            </>
          ) : (
            <>
              <i className="ph ph-arrow-counter-clockwise"></i>
              Atualizar
            </>
          )}
        </button>
      </div>

      {/* Expandable search bar */}
      {searchOpen && (
        <div className="glass-card rounded-xl p-3 fade-in">
          <div className="relative">
            <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              type="text"
              placeholder="Buscar sessoes por titulo, ID ou projeto..."
              className="input-glow rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 w-full placeholder:text-slate-600"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}
