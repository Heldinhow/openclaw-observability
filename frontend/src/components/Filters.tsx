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
    { value: 'all' as const, label: 'Todos', shortLabel: 'Todos', icon: 'ph ph-circles-three-plus' },
    { value: 'active' as const, label: 'Ativo', shortLabel: 'Ativo', icon: 'ph ph-lightning' },
    { value: 'inactive' as const, label: 'Inativo', shortLabel: 'Inat.', icon: 'ph ph-moon' },
  ];

  return (
    <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
      {/* Main filter bar - Mobile optimized */}
      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-3">
        {/* Row 1: Search + Project (mobile) or Search + Project + Status (desktop) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`
              w-10 h-10 min-h-[44px] rounded-xl flex items-center justify-center 
              transition-all duration-300 touch-manipulation active:scale-95 md:active:scale-100
              ${searchOpen
                ? 'bg-neon-cyan/10 text-neon-cyan'
                : 'glass text-slate-400 hover:text-slate-200'
              }
            `}
            aria-label="Toggle search"
          >
            <i className="ph ph-magnifying-glass text-lg"></i>
          </button>

          {/* Project filter */}
          <div className="flex items-center gap-2 flex-1 md:flex-auto">
            <div className="w-8 h-8 min-w-[32px] rounded-lg bg-neon-purple/10 flex items-center justify-center hidden sm:flex">
              <i className="ph ph-folder-notch text-sm text-neon-purple"></i>
            </div>
            <select
              value={filters.project || ''}
              onChange={handleProjectChange}
              className="
                input-glow rounded-xl px-3 py-2.5 text-sm text-slate-100 font-mono 
                min-w-0 flex-1 md:min-w-[160px] min-h-[44px]
                touch-manipulation
              "
            >
              <option value="">Todos os projetos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name} ({project.sessionCount || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Separator - Desktop only */}
        <div className="w-px h-8 bg-white/5 hidden md:block"></div>

        {/* Status pills - Horizontal scroll on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`
                px-3 md:px-3.5 py-2 md:py-1.5 rounded-xl text-xs md:text-xs font-medium 
                transition-all duration-300 flex items-center gap-1.5
                whitespace-nowrap min-h-[40px] md:min-h-[36px]
                touch-manipulation active:scale-95 md:active:scale-100
                ${filters.status === opt.value
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                  : 'glass text-slate-500 hover:text-slate-300 border border-transparent'
                }
              `}
            >
              <i className={opt.icon}></i>
              <span className="hidden sm:inline">{opt.label}</span>
              <span className="sm:hidden">{opt.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Spacer - Desktop only */}
        <div className="flex-1 hidden md:block"></div>

        {/* Refresh button - Full width on mobile */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`
            w-full md:w-auto px-4 md:px-5 py-3 md:py-2.5 rounded-xl 
            text-sm font-semibold flex items-center justify-center md:justify-start gap-2 
            transition-all duration-300 min-h-[44px]
            touch-manipulation active:scale-95 md:active:scale-100
            ${isRefreshing
              ? 'glass text-slate-500 cursor-not-allowed'
              : 'btn-neon text-slate-950 hover:shadow-lg hover:shadow-neon-cyan/20 md:hover:scale-[1.02]'
            }
          `}
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-neon-cyan border-t-transparent"></div>
              <span className="md:hidden">Atualizando...</span>
            </>
          ) : (
            <>
              <i className="ph ph-arrow-counter-clockwise text-lg md:text-base"></i>
              <span className="md:hidden">Atualizar</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable search bar */}
      {searchOpen && (
        <div className="glass-card rounded-xl p-3 md:p-3 fade-in">
          <div className="relative">
            <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              type="text"
              placeholder="Buscar sessoes por titulo, ID ou projeto..."
              className="
                input-glow rounded-xl pl-11 pr-4 py-3.5 md:py-3 text-sm text-slate-100 w-full 
                placeholder:text-slate-600 min-h-[48px]
                touch-manipulation
              "
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}
