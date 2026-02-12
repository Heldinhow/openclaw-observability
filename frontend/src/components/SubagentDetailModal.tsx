import { useEffect, useState } from 'react';
import { useSubagentDetail } from '../hooks/useSubagents';
import type { SubagentDetail, LogEntry } from '../types';

interface SubagentDetailModalProps {
  subagentId: string;
  onClose: () => void;
}

export function SubagentDetailModal({ subagentId, onClose }: SubagentDetailModalProps) {
  const { data: subagentData, isLoading, error } = useSubagentDetail(subagentId);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const subagent: SubagentDetail | undefined = subagentData?.data;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m ${secs}s`;
    }
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
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
        label: 'Em Execução',
      },
      completed: {
        bg: 'bg-neon-green/10',
        text: 'text-neon-green',
        border: 'border-neon-green/20',
        icon: 'ph ph-check',
        label: 'Concluído',
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
    return configs[status] || configs.idle;
  };

  const getLogLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      debug: 'text-slate-500',
      info: 'text-neon-cyan',
      warn: 'text-yellow-500',
      error: 'text-red-400',
    };
    return colors[level] || 'text-slate-400';
  };

  const getLogLevelBg = (level: string): string => {
    const colors: Record<string, string> = {
      debug: 'bg-slate-500/10',
      info: 'bg-neon-cyan/10',
      warn: 'bg-yellow-500/10',
      error: 'bg-red-500/10',
    };
    return colors[level] || 'bg-white/5';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500">Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (error || !subagent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="ph ph-warning text-3xl text-red-400"></i>
          </div>
          <p className="text-red-400 mb-2 font-semibold">Erro ao carregar detalhes</p>
          <p className="text-slate-500 text-sm font-mono mb-4">
            {error?.message || 'Subagente não encontrado'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neon-cyan/10 text-neon-cyan rounded-lg text-sm font-medium hover:bg-neon-cyan/20 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(subagent.status);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-4xl h-full flex flex-col bg-slate-950/95 border-l border-white/10 shadow-2xl shadow-black/60">
        <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-neon-purple via-neon-cyan to-neon-green"></div>

        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all duration-300 flex-shrink-0"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                  <i className={statusConfig.icon}></i>
                  {statusConfig.label}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-neon-purple/10 text-neon-purple uppercase tracking-wider">
                  Subagente
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white truncate pl-11">
                {subagent.name}
              </h2>
              <div className="flex items-center gap-4 mt-2 pl-11">
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <i className="ph ph-clock"></i>
                  Início: {formatRelativeTime(subagent.startTime)}
                </span>
                {subagent.endTime && (
                  <>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                      <i className="ph ph-flag"></i>
                      Fim: {formatRelativeTime(subagent.endTime)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Identificadores"
              icon="ph ph-identification-card"
              iconColor="text-neon-purple"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">ID do Subagente</label>
                  <p className="text-sm text-slate-300 font-mono break-all">{subagent.id}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Task ID</label>
                  <p className="text-sm text-slate-300 font-mono break-all">{subagent.taskId}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Session ID</label>
                  <p className="text-sm text-slate-300 font-mono break-all">{subagent.sessionId}</p>
                </div>
              </div>
            </InfoCard>

            <InfoCard
              title="Informações de Tempo"
              icon="ph ph-clock-counter-clockwise"
              iconColor="text-neon-cyan"
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Início</label>
                  <p className="text-sm text-slate-300">{formatDate(subagent.startTime)}</p>
                </div>
                {subagent.endTime && (
                  <div>
                    <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Fim</label>
                    <p className="text-sm text-slate-300">{formatDate(subagent.endTime)}</p>
                  </div>
                )}
                <div>
                  <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Duração Total</label>
                  <p className="text-sm text-slate-300 font-mono">{formatDuration(subagent.duration)}</p>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* New Fields Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model */}
            {subagent.model && (
              <InfoCard
                title="Modelo"
                icon="ph ph-brain"
                iconColor="text-neon-purple"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-neon-purple/10 text-neon-purple text-sm font-medium font-mono">
                    {subagent.model}
                  </span>
                </div>
              </InfoCard>
            )}

            {/* Project Path */}
            {subagent.projectPath && (
              <InfoCard
                title="Caminho do Projeto"
                icon="ph ph-folder"
                iconColor="text-neon-cyan"
              >
                <p className="text-sm text-slate-300 font-mono break-all">{subagent.projectPath}</p>
              </InfoCard>
            )}
          </div>

          {/* Summary/Report */}
          {subagent.summary && (
            <InfoCard
              title="Resumo / Relatório"
              icon="ph ph-article"
              iconColor="text-neon-green"
            >
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{subagent.summary}</p>
              </div>
            </InfoCard>
          )}

          {/* Annotations */}
          {subagent.annotations && (
            <InfoCard
              title="Anotações / Notas"
              icon="ph ph-notebook"
              iconColor="text-neon-blue"
            >
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{subagent.annotations}</p>
              </div>
            </InfoCard>
          )}

          {/* Error Stack Trace */}
          {subagent.errorStack && (
            <InfoCard
              title="Stack Trace do Erro"
              icon="ph ph-bug"
              iconColor="text-red-400"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <pre className="text-xs text-red-400 whitespace-pre-wrap break-all font-mono">
                  {subagent.errorStack}
                </pre>
              </div>
            </InfoCard>
          )}

          {/* Resource Usage */}
          {subagent.resourceUsage && (
            <InfoCard
              title="Uso de Recursos"
              icon="ph ph-chart-bar"
              iconColor="text-neon-green"
            >
              <div className="grid grid-cols-2 gap-4">
                {subagent.resourceUsage.cpuPercent !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">CPU</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neon-cyan rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(subagent.resourceUsage.cpuPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-300 font-mono">{subagent.resourceUsage.cpuPercent}%</span>
                    </div>
                  </div>
                )}
                {subagent.resourceUsage.memoryMB !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-600 uppercase tracking-wider font-mono">Memória</label>
                    <p className="text-sm text-slate-300 font-mono mt-1">
                      {subagent.resourceUsage.memoryMB} MB
                    </p>
                  </div>
                )}
              </div>
            </InfoCard>
          )}

          {/* Parameters & Results */}
          {(subagent.parameters || subagent.results) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subagent.parameters && (
                <InfoCard
                  title="Parâmetros"
                  icon="ph ph-gear"
                  iconColor="text-neon-blue"
                >
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap break-all font-mono bg-white/5 rounded-lg p-3">
                    {JSON.stringify(subagent.parameters, null, 2)}
                  </pre>
                </InfoCard>
              )}
              {subagent.results && (
                <InfoCard
                  title="Resultados"
                  icon="ph ph-check-circle"
                  iconColor="text-neon-green"
                >
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap break-all font-mono bg-white/5 rounded-lg p-3">
                    {JSON.stringify(subagent.results, null, 2)}
                  </pre>
                </InfoCard>
              )}
            </div>
          )}

          {/* Error Message */}
          {subagent.errorMessage && (
            <InfoCard
              title="Erro"
              icon="ph ph-warning-circle"
              iconColor="text-red-400"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400 whitespace-pre-wrap">{subagent.errorMessage}</p>
              </div>
            </InfoCard>
          )}

          {/* Log Summary */}
          {subagent.logSummary && (
            <InfoCard
              title="Resumo de Logs"
              icon="ph ph-list-dashes"
              iconColor="text-neon-cyan"
            >
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{subagent.logSummary}</p>
              </div>
            </InfoCard>
          )}

          {/* Detailed Logs */}
          {subagent.logs && subagent.logs.length > 0 && (
            <InfoCard
              title="Logs Detalhados"
              icon="ph ph-list-bullets"
              iconColor="text-neon-purple"
              collapsible
              defaultCollapsed={true}
            >
              <div className="space-y-2">
                {subagent.logs.map((log: LogEntry, index: number) => (
                  <LogItem
                    key={index}
                    log={log}
                    isExpanded={expandedLog === `${subagent.id}-${index}`}
                    onToggle={() => setExpandedLog(expandedLog === `${subagent.id}-${index}` ? null : `${subagent.id}-${index}`)}
                    formatDate={formatDate}
                    getLogLevelColor={getLogLevelColor}
                    getLogLevelBg={getLogLevelBg}
                  />
                ))}
              </div>
            </InfoCard>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-600 font-mono">
            ID: {subagent.id}
          </span>
          <span className="text-[11px] text-slate-600 font-mono">
            Criado: {formatDate(subagent.startTime)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Info Card Component
function InfoCard({
  title,
  icon,
  iconColor,
  children,
  collapsible,
  defaultCollapsed,
}: {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed || false);

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        className={`w-full px-4 py-3 flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-2">
          <i className={`${icon} ${iconColor}`}></i>
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        {collapsible && (
          <i className={`ph text-slate-500 transition-transform ${isCollapsed ? 'ph-caret-down' : 'ph-caret-up'}`}></i>
        )}
      </button>
      {!isCollapsed && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Log Item Component
function LogItem({
  log,
  isExpanded,
  onToggle,
  formatDate,
  getLogLevelColor,
  getLogLevelBg,
}: {
  log: LogEntry;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (dateStr: string) => string;
  getLogLevelColor: (level: string) => string;
  getLogLevelBg: (level: string) => string;
}) {
  const hasDetails = log.metadata || log.message.length > 100;

  return (
    <div className={`rounded-lg border border-white/5 overflow-hidden ${getLogLevelBg(log.level)}`}>
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center gap-3 text-left"
      >
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${getLogLevelColor(log.level)}`}>
          {log.level}
        </span>
        <span className="text-xs text-slate-500 font-mono flex-1">
          {formatDate(log.timestamp)}
        </span>
        <span className="text-xs text-slate-400 truncate flex-1">
          {log.message}
        </span>
        {hasDetails && (
          <i className={`ph text-slate-500 transition-transform ${isExpanded ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
        )}
      </button>

      {isExpanded && hasDetails && (
        <div className="px-3 pb-3">
          <div className="ml-0.5 border-l border-white/10 pl-3">
            <p className="text-xs text-slate-400 whitespace-pre-wrap mb-2">{log.message}</p>
            {log.metadata && (
              <pre className="text-[10px] text-slate-500 font-mono bg-white/5 rounded p-2 whitespace-pre-wrap">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
