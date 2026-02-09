import { useCronjobs } from '../hooks/useCronjobs';

export function CronjobsTab() {
  const { cronjobs, queue, isLoading, lastUpdated, refresh } = useCronjobs();

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatSchedule = (schedule: string) => {
    // Convert cron format to readable
    const parts = schedule.split(' ');
    if (parts.length === 5) {
      const [min, hour, day, month, dow] = parts;
      return `${hour}:${min} ${day}/${month} (${dow})`;
    }
    return schedule;
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Cronjobs & Queue</h2>
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-1">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-neon-cyan/10 text-neon-cyan rounded-lg text-sm font-medium
                       hover:bg-neon-cyan/20 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <i className="ph ph-arrow-clockwise"></i>
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 px-3 sm:px-4 md:px-6">
        {/* Cronjobs Section */}
        <div className="bg-white/5 rounded-xl lg:rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <i className="ph ph-clock text-neon-purple"></i>
              Cronjobs Agendados
            </h3>
            <span className="text-xs text-slate-500">{cronjobs.length} jobs</span>
          </div>
          
          <div className="divide-y divide-white/5">
            {cronjobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <i className="ph ph-calendar-x text-3xl mb-2 block"></i>
                <p className="text-sm">Nenhum cronjob configurado</p>
              </div>
            ) : (
              cronjobs.map((job) => (
                <div key={job.id} className="p-3 lg:p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          job.status === 'ok' ? 'bg-neon-green' :
                          job.status === 'error' ? 'bg-red-500' :
                          job.status === 'disabled' ? 'bg-slate-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-sm font-medium text-white truncate">{job.name}</span>
                      </div>
                      {job.description && (
                        <p className="text-xs text-slate-500 truncate">{job.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <i className="ph ph-timer"></i>
                          {formatSchedule(job.schedule)}
                        </span>
                        {job.nextRun && (
                          <span>Proximo: {formatTime(job.nextRun)}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono flex-shrink-0 ${
                      job.enabled 
                        ? 'bg-neon-green/10 text-neon-green' 
                        : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {job.enabled ? 'ATIVO' : 'DESATIVADO'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue Section */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <i className="ph ph-list-checks text-neon-cyan"></i>
              Task Queue
            </h3>
            <span className="text-xs text-slate-500">
              {queue ? (queue.ready.length + queue.inProgress.length + queue.blocked.length) : 0} tarefas
            </span>
          </div>

          {queue ? (
            <div className="divide-y divide-white/5">
              {/* Ready */}
              {queue.ready.length > 0 && (
                <div className="p-3 lg:p-4">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ph ph-circle text-neon-green"></i>
                    Prontas ({queue.ready.length})
                  </h4>
                  <ul className="space-y-1.5 lg:space-y-2">
                    {queue.ready.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs lg:text-sm text-slate-300">
                        <i className="ph ph-caret-right mt-0.5 text-neon-green flex-shrink-0"></i>
                        <span className="break-all">{task.task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* In Progress */}
              {queue.inProgress.length > 0 && (
                <div className="p-3 lg:p-4 bg-neon-cyan/5">
                  <h4 className="text-xs font-medium text-neon-cyan uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ph ph-gear fa-spin"></i>
                    Em Andamento ({queue.inProgress.length})
                  </h4>
                  <ul className="space-y-1.5 lg:space-y-2">
                    {queue.inProgress.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs lg:text-sm text-white">
                        <i className="ph ph-spinner fa-spin mt-0.5 text-neon-cyan flex-shrink-0"></i>
                        <span className="break-all">{task.task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blocked */}
              {queue.blocked.length > 0 && (
                <div className="p-3 lg:p-4">
                  <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ph ph-warning-circle"></i>
                    Bloqueadas ({queue.blocked.length})
                  </h4>
                  <ul className="space-y-1.5 lg:space-y-2">
                    {queue.blocked.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs lg:text-sm text-slate-400">
                        <i className="ph ph-ban mt-0.5 text-red-400 flex-shrink-0"></i>
                        <span className="break-all">{task.task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Done */}
              {queue.done.length > 0 && (
                <div className="p-3 lg:p-4">
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ph ph-check-circle"></i>
                    Concluidas ({queue.done.length})
                  </h4>
                  <ul className="space-y-1">
                    {queue.done.slice(0, 5).map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs lg:text-sm text-slate-500 line-through">
                        <i className="ph ph-check mt-0.5 flex-shrink-0"></i>
                        <span className="break-all">{task.task}</span>
                      </li>
                    ))}
                    {queue.done.length > 5 && (
                      <li className="text-xs text-slate-600 italic pl-6">
                        +{queue.done.length - 5} tarefas...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Empty state */}
              {queue.ready.length === 0 && 
               queue.inProgress.length === 0 && 
               queue.blocked.length === 0 && (
                <div className="p-6 lg:p-8 text-center text-slate-500">
                  <i className="ph ph-list text-3xl mb-2 block"></i>
                  <p className="text-sm">Queue vazia</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <i className="ph ph-spinner ph-spin text-3xl mb-2 block"></i>
              <p className="text-sm">Carregando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
