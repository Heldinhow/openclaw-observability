import type { HealthResponse, Session } from '../types';

interface HeaderProps {
  health?: HealthResponse;
  sessions?: Session[];
}

export function Header({ health, sessions = [] }: HeaderProps) {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === 'active').length;
  const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0);
  const uniqueProjects = new Set(sessions.map((s) => s.projectID)).size;

  const stats = [
    {
      label: 'Total Sessoes',
      value: totalSessions,
      icon: 'ph ph-squares-four',
      color: 'neon-cyan',
      bgColor: 'bg-neon-cyan/10',
      textColor: 'text-neon-cyan',
    },
    {
      label: 'Ativas',
      value: activeSessions,
      icon: 'ph ph-lightning',
      color: 'neon-green',
      bgColor: 'bg-neon-green/10',
      textColor: 'text-neon-green',
    },
    {
      label: 'Mensagens',
      value: totalMessages,
      icon: 'ph ph-chat-circle-dots',
      color: 'neon-purple',
      bgColor: 'bg-neon-purple/10',
      textColor: 'text-neon-purple',
    },
    {
      label: 'Projetos',
      value: uniqueProjects,
      icon: 'ph ph-folder-notch',
      color: 'neon-blue',
      bgColor: 'bg-neon-blue/10',
      textColor: 'text-neon-blue',
    },
  ];

  return (
    <header className="relative z-40">
      {/* Top bar */}
      <div className="glass-strong border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-cyan via-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-cyan/20">
              <i className="ph ph-eye text-xl text-white"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Open<span className="gradient-text">Claw</span>
              </h1>
              <span className="text-[11px] text-slate-500 font-mono tracking-widest uppercase">
                Observability Dashboard
              </span>
            </div>
          </div>

          {health && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass rounded-xl px-4 py-2">
                <span
                  className={`status-dot ${
                    health.status === 'healthy'
                      ? 'status-active'
                      : health.redisConnected
                      ? 'status-warning'
                      : 'status-error'
                  }`}
                />
                <span className="text-xs text-slate-400">
                  {health.status === 'healthy' ? 'Operacional' : 'Degradado'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono glass rounded-xl px-4 py-2">
                <i className="ph ph-timer mr-1"></i>
                {health.discoveryLatency}ms
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-4 group hover:scale-[1.02] transition-all duration-300 cursor-default"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-lg ${stat.textColor}`}></i>
                </div>
                <i className="ph ph-trend-up text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
              <div className={`text-2xl font-bold ${stat.textColor} font-mono`}>
                {stat.value.toLocaleString('pt-BR')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
