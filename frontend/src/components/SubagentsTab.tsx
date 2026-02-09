import { useState } from 'react';
import { useRunningSubagents, useSubagentHistory, useRefreshSubagentCache } from '../hooks/useSubagents';
import type { SubagentFilters, ViewMode, Subagent } from '../types';

export function SubagentsTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('running');
  const [filters, setFilters] = useState<SubagentFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: runningData, isLoading: isLoadingRunning, error: runningError } = 
    useRunningSubagents({ search: searchQuery || undefined });
  
  const { data: historyData, isLoading: isLoadingHistory, error: historyError } = 
    useSubagentHistory({ ...filters, search: searchQuery || undefined });
  
  const refreshCache = useRefreshSubagentCache();

  const handleRefresh = () => {
    refreshCache.mutate();
  };

  const runningSubagents = runningData?.data || [];
  const historySubagents = historyData?.data || [];
  const isLoading = viewMode === 'running' ? isLoadingRunning : isLoadingHistory;
  const error = viewMode === 'running' ? runningError : historyError;

  const getStatusStats = () => {
    const allSubagents = [...runningSubagents, ...historySubagents];
    return {
      running: allSubagents.filter(s => s.status === 'running').length,
      completed: allSubagents.filter(s => s.status === 'completed').length,
      failed: allSubagents.filter(s => s.status === 'failed').length,
      idle: allSubagents.filter(s => s.status === 'idle').length,
    };
  };

  const stats = getStatusStats();

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Subagentes</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gerencie e monitore os subagentes em execucao
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshCache.isPending}
            className="px-4 py-2 btn-neon text-slate-950 rounded-xl text-sm font-semibold
                       flex items-center gap-2 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       touch-manipulation active:scale-95 md:active:scale-100"
          >
            {refreshCache.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <i className="ph ph-arrow-counter-clockwise text-lg"></i>
                <span>Atualizar</span>
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4">
          <StatCard 
            label="Em Execucao" 
            value={stats.running} 
            icon="ph ph-play-circle" 
            color="neon-cyan" 
          />
          <StatCard 
            label="Concluidos" 
            value={stats.completed} 
            icon="ph ph-check-circle" 
            color="neon-green" 
          />
          <StatCard 
            label="Falhas" 
            value={stats.failed} 
            icon="ph ph-x-circle" 
            color="red-500" 
          />
          <StatCard 
            label="Ociosos" 
            value={stats.idle} 
            icon="ph ph-pause-circle" 
            color="slate-500" 
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-4 mb-6">
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <input
              type="text"
              placeholder="Buscar por nome, task ID ou session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glow rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 w-full 
                       placeholder:text-slate-600 min-h-[44px] touch-manipulation"
            />
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/5 hidden md:block"></div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <TabButton
              active={viewMode === 'running'}
              onClick={() => setViewMode('running')}
              icon="ph ph-play"
              label="Em Execucao"
              count={runningSubagents.length}
            />
            <TabButton
              active={viewMode === 'history'}
              onClick={() => setViewMode('history')}
              icon="ph ph-clock-counter-clockwise"
              label="Historico"
              count={historyData?.pagination?.total || 0}
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card rounded-2xl p-8 text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="ph ph-warning text-3xl text-red-400"></i>
          </div>
          <p className="text-red-400 mb-2 font-semibold">Erro ao carregar subagentes</p>
          <p className="text-slate-500 text-sm font-mono">{error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-neon-cyan/20 border-t-neon-cyan"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="ph ph-robot text-neon-cyan text-xl"></i>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Carregando subagentes...</p>
          <p className="text-slate-600 text-xs mt-1 font-mono">Escaneando sessoes</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {viewMode === 'running' ? (
            <RunningSubagentsList subagents={runningSubagents} />
          ) : (
            <SubagentHistoryList 
              subagents={historySubagents}
              pagination={historyData?.pagination}
              filters={filters}
              onFilterChange={setFilters}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: string; 
  color: string;
}) {
  const bgColor = color.startsWith('neon') ? `bg-${color}/10` : `bg-${color}/10`;
  const textColor = color.startsWith('neon') ? `text-${color}` : `text-${color}`;

  return (
    <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-4 group">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className={`w-7 h-7 md:w-9 md:h-9 rounded-lg ${bgColor} flex items-center justify-center`}>
          <i className={`${icon} text-sm md:text-lg ${textColor}`}></i>
        </div>
      </div>
      <div className={`text-xl md:text-2xl font-bold ${textColor} font-mono`}>
        {value.toLocaleString('pt-BR')}
      </div>
      <div className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 md:mt-1 uppercase tracking-wider truncate">
        {label}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 md:px-3.5 py-2 md:py-1.5 rounded-xl text-xs md:text-xs font-medium 
        transition-all duration-300 flex items-center gap-1.5
        whitespace-nowrap min-h-[40px] md:min-h-[36px]
        touch-manipulation active:scale-95 md:active:scale-100
        ${active
          ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
          : 'glass text-slate-500 hover:text-slate-300 border border-transparent'
        }
      `}
    >
      <i className={icon}></i>
      <span>{label}</span>
      <span className={`
        text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-full
        ${active ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-white/5 text-slate-600'}
      `}>
        {count}
      </span>
    </button>
  );
}

// Running Subagents List
function RunningSubagentsList({ subagents }: { subagents: Subagent[] }) {
  if (subagents.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 flex items-center justify-center mx-auto mb-5">
          <i className="ph ph-robot text-3xl text-neon-cyan"></i>
        </div>
        <p className="text-slate-200 mb-2 font-semibold">Nenhum subagente em execucao</p>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Os subagentes ativos aparecerao aqui automaticamente quando forem iniciados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {subagents.map((subagent, index) => (
        <SubagentCard key={subagent.id} subagent={subagent} index={index} />
      ))}
    </div>
  );
}

// History List
function SubagentHistoryList({ 
  subagents, 
  pagination,
  filters,
  onFilterChange 
}: { 
  subagents: Subagent[];
  pagination?: { total: number; hasMore: boolean };
  filters: SubagentFilters;
  onFilterChange: (filters: SubagentFilters) => void;
}) {
  if (subagents.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-5">
          <i className="ph ph-clock-counter-clockwise text-3xl text-slate-500"></i>
        </div>
        <p className="text-slate-200 mb-2 font-semibold">Nenhum historico encontrado</p>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          As execucoes concluidas dos subagentes aparecerao aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs text-slate-500 uppercase tracking-wider mr-2">Status:</span>
        {(['', 'completed', 'failed', 'cancelled'] as const).map((status) => (
          <button
            key={status || 'all'}
            onClick={() => onFilterChange({ ...filters, status: status || undefined })}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium 
              transition-all duration-300 whitespace-nowrap
              touch-manipulation active:scale-95
              ${filters.status === status || (!filters.status && !status)
                ? status === 'completed' ? 'bg-neon-green/15 text-neon-green border border-neon-green/20'
                  : status === 'failed' ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                  : status === 'cancelled' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                  : 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                : 'glass text-slate-500 hover:text-slate-300 border border-transparent'
              }
            `}
          >
            {status === '' && 'Todos'}
            {status === 'completed' && 'Concluidos'}
            {status === 'failed' && 'Falhas'}
            {status === 'cancelled' && 'Cancelados'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {subagents.map((subagent, index) => (
          <SubagentCard key={subagent.id} subagent={subagent} index={index} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex justify-between items-center mt-6 text-sm text-slate-400">
          <span>Mostrando {subagents.length} de {pagination.total} resultados</span>
          {pagination.hasMore && (
            <button className="text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1">
              Carregar mais <i className="ph ph-caret-down"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Subagent Card Component
function SubagentCard({ subagent, index }: { subagent: Subagent; index: number }) {
  const statusConfig = {
    idle: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/20',
      icon: 'ph ph-pause',
      label: 'Ocioso',
    },
    running: {
      bg: 'bg-neon-cyan/10',
      text: 'text-neon-cyan',
      border: 'border-neon-cyan/20',
      icon: 'ph ph-play',
      label: 'Em Execucao',
    },
    completed: {
      bg: 'bg-neon-green/10',
      text: 'text-neon-green',
      border: 'border-neon-green/20',
      icon: 'ph ph-check',
      label: 'Concluido',
    },
    failed: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
      icon: 'ph ph-x',
      label: 'Falha',
    },
    cancelled: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20',
      icon: 'ph ph-stop',
      label: 'Cancelado',
    },
  };

  const config = statusConfig[subagent.status];

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}h ${mins % 60}m`;
    }
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div 
      className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 
                 hover:scale-[1.02] transition-all duration-300 cursor-pointer
                 touch-manipulation active:scale-95 md:active:scale-100"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm md:text-base truncate">
            {subagent.name}
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
            {subagent.id.slice(-12)}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[10px] md:text-xs font-medium flex items-center gap-1 flex-shrink-0
                        ${config.bg} ${config.text} border ${config.border}`}>
          <i className={config.icon}></i>
          <span className="hidden sm:inline">{config.label}</span>
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <i className="ph ph-folder-notch text-neon-purple"></i>
            <span>Task</span>
          </div>
          <p className="text-slate-300 font-mono truncate">{subagent.taskId}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <i className="ph ph-chat-circle-dots text-neon-blue"></i>
            <span>Session</span>
          </div>
          <p className="text-slate-300 font-mono truncate">{subagent.sessionId.slice(-8)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <i className="ph ph-clock text-neon-cyan"></i>
            <span>Inicio</span>
          </div>
          <p className="text-slate-300">{formatTime(subagent.startTime)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <i className="ph ph-timer text-neon-green"></i>
            <span>Duracao</span>
          </div>
          <p className="text-slate-300">{formatDuration(subagent.duration)}</p>
        </div>
      </div>

      {/* Footer with icon */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <i className="ph ph-robot text-neon-purple"></i>
          <span>Subagente OpenClaw</span>
        </div>
        <i className="ph ph-caret-right text-slate-600"></i>
      </div>
    </div>
  );
}
