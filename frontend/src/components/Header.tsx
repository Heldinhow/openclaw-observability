import { useState, useEffect } from 'react';
import type { HealthResponse, Session } from '../types';

interface HeaderProps {
  health?: HealthResponse;
  sessions?: Session[];
}

export function Header({ health, sessions = [] }: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <div className="glass-strong border-b border-white/5 px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-neon-cyan via-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-cyan/20">
              <i className="ph ph-eye text-lg md:text-xl text-white"></i>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight">
                Open<span className="gradient-text">Claw</span>
              </h1>
              <span className="text-[10px] md:text-[11px] text-slate-500 font-mono tracking-widest uppercase hidden sm:inline">
                Observability Dashboard
              </span>
            </div>
          </div>

          {health && (
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-2 glass rounded-lg md:rounded-xl px-2 md:px-4 py-1.5 md:py-2">
                <span
                  className={`status-dot ${
                    health.status === 'healthy'
                      ? 'status-active'
                      : health.redisConnected
                      ? 'status-warning'
                      : 'status-error'
                  }`}
                />
                <span className="text-[10px] md:text-xs text-slate-400 hidden sm:inline">
                  {health.status === 'healthy' ? 'Operacional' : 'Degradado'}
                </span>
              </div>
              <div className="text-[10px] md:text-xs text-slate-500 font-mono glass rounded-lg md:rounded-xl px-2 md:px-4 py-1.5 md:py-2 hidden sm:inline">
                <i className="ph ph-timer mr-1"></i>
                {health.discoveryLatency}ms
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards - Mobile: 2x2 grid, Desktop: 4 columns */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`
                glass-card rounded-xl md:rounded-2xl p-3 md:p-4 
                group hover:scale-[1.02] transition-all duration-300 cursor-default
                touch-manipulation active:scale-95 md:active:scale-100
                ${index >= 2 ? 'hidden md:block' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className={`w-7 h-7 md:w-9 md:h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-sm md:text-lg ${stat.textColor}`}></i>
                </div>
                <i className="ph ph-trend-up text-[10px] md:text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"></i>
              </div>
              <div className={`text-xl md:text-2xl font-bold ${stat.textColor} font-mono`}>
                {stat.value.toLocaleString('pt-BR')}
              </div>
              <div className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 md:mt-1 uppercase tracking-wider truncate">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile: Show all stats summary */}
        {isMobile && (
          <div className="md:hidden mt-2 glass-card rounded-xl p-2 flex justify-around">
            {stats.slice(2).map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-sm font-bold ${stat.textColor} font-mono`}>
                  {stat.value.toLocaleString('pt-BR')}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
