import { useEffect, useState } from 'react';
import { useCronjobs } from '../hooks/useCronjobs';
import type { CronRun } from '../hooks/useCronjobs';

interface CronHistoryModalProps {
  jobId: string;
  jobName: string;
  onClose: () => void;
}

export function CronHistoryModal({ jobId, jobName, onClose }: CronHistoryModalProps) {
  const { fetchCronHistory } = useCronjobs();
  const [history, setHistory] = useState<CronRun[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const data = await fetchCronHistory(jobId, 50);
      if (data) {
        setHistory(data.runs);
        setTotalRuns(data.totalRuns);
      }
      setIsLoading(false);
    };
    loadHistory();
  }, [jobId, fetchCronHistory]);

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

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  const formatRelativeTime = (timestamp: number): string => {
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

  const successRate = totalRuns > 0
    ? ((history.filter(r => r.status === 'ok').length / Math.min(totalRuns, 50)) * 100).toFixed(0)
    : '0';

  return (
    <div
      className="fixed inset-0 z-50 flex"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative ml-auto w-full max-w-3xl h-full flex flex-col bg-slate-950/95 border-l border-white/10 shadow-2xl shadow-black/60">
        <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-neon-purple via-neon-cyan to-neon-green"></div>

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
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-neon-purple/10 text-neon-purple uppercase tracking-wider">
                  Cronjob
                </span>
                <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                  successRate === '100' ? 'bg-neon-green/10 text-neon-green' :
                  parseInt(successRate) > 50 ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {successRate}% sucesso
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white truncate pl-11">
                {jobName}
              </h2>
              <div className="flex items-center gap-4 mt-2 pl-11">
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <i className="ph ph-clock-counter-clockwise"></i>
                  {totalRuns} execuções
                </span>
                {totalRuns > 50 && (
                  <>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-500">
                      Mostrando últimas 50
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
                <span className="text-sm text-slate-500">Carregando histórico...</span>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <i className="ph ph-clock-counter-clockwise text-xl text-slate-600"></i>
              </div>
              <p className="text-slate-500 text-sm">Nenhuma execução registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((run) => (
                <RunItem
                  key={run.id}
                  run={run}
                  isExpanded={expandedRun === run.id}
                  onToggle={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  formatDate={formatDate}
                  formatDuration={formatDuration}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-600 font-mono">
            ID: {jobId}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RunItemProps {
  run: CronRun;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (ts: number) => string;
  formatDuration: (ms: number) => string;
  formatRelativeTime: (ts: number) => string;
}

function RunItem({
  run,
  isExpanded,
  onToggle,
  formatDate,
  formatDuration,
  formatRelativeTime,
}: RunItemProps) {
  return (
    <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden hover:bg-white/[0.04] transition-colors">
      <button
        onClick={onToggle}
        className="w-full px- flex items-center gap-44 py-3 text-left"
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          run.status === 'ok' ? 'bg-neon-green' : 'bg-red-500'
        }`}></div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-medium ${
              run.status === 'ok' ? 'text-neon-green' : 'text-red-400'
            }`}>
              {run.status === 'ok' ? 'Sucesso' : 'Erro'}
            </span>
            <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-white/5 font-mono">
              {formatDuration(run.durationMs)}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {run.summary || (run.error ? `Erro: ${run.error}` : 'Sem output')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[10px] text-slate-600 font-mono">
            {formatRelativeTime(run.timestamp)}
          </span>
          <i className={`ph text-slate-500 transition-transform ${
            isExpanded ? 'ph-caret-up' : 'ph-caret-down'
          }`}></i>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-7 pl-0.5 border-l border-white/10">
            <div className="mt-3 p-3 bg-slate-950/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                  Output Completo
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {formatDate(run.timestamp)}
                </span>
              </div>
              {run.error ? (
                <div className="space-y-2">
                  <div className="text-xs text-red-400 font-medium">Erro:</div>
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words font-mono">
                    {run.error}
                  </pre>
                </div>
              ) : run.summary ? (
                <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words font-mono">
                  {run.summary}
                </pre>
              ) : (
                <span className="text-xs text-slate-600 italic">
                  Sem output disponível
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
