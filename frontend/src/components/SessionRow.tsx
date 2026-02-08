import type { Session } from '../types';

interface SessionRowProps {
  session: Session;
  onClick: (session: Session) => void;
  index: number;
}

export function SessionRow({ session, onClick, index }: SessionRowProps) {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const projectName = session.directory.split('/').pop() || session.projectID;
  const isActive = session.status === 'active';

  // Determine accent color based on index for visual variety
  const accents = [
    { border: 'border-neon-cyan/20 hover:border-neon-cyan/40', glow: 'hover:shadow-neon-cyan/5' },
    { border: 'border-neon-purple/20 hover:border-neon-purple/40', glow: 'hover:shadow-neon-purple/5' },
    { border: 'border-neon-blue/20 hover:border-neon-blue/40', glow: 'hover:shadow-neon-blue/5' },
    { border: 'border-neon-green/20 hover:border-neon-green/40', glow: 'hover:shadow-neon-green/5' },
  ];
  const accent = accents[index % accents.length];

  return (
    <div
      onClick={() => onClick(session)}
      className={`
        glass-card rounded-xl md:rounded-2xl p-4 md:p-5 cursor-pointer
        border ${accent.border}
        transition-all duration-300
        hover:scale-[1.01] md:hover:scale-[1.02] hover:shadow-xl ${accent.glow}
        hover:bg-white/[0.04]
        group
        touch-manipulation
        active:scale-[0.98] md:active:scale-100
        min-h-[120px] md:min-h-0
      `}
    >
      {/* Top row: project badge + status + time */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
          <span className="text-[9px] md:text-[10px] font-mono px-2 md:px-2.5 py-1 rounded-lg bg-neon-purple/10 text-neon-purple/80 uppercase tracking-wider truncate max-w-[50%]">
            {projectName}
          </span>
          {isActive && (
            <span className="flex items-center gap-1 text-[9px] md:text-[10px] px-1.5 md:px-2 py-1 rounded-lg bg-neon-green/10 text-neon-green whitespace-nowrap">
              <span className="status-dot status-active !w-1.5 !h-1.5"></span>
              <span className="hidden sm:inline">Ativo</span>
            </span>
          )}
        </div>
        <span className="text-[10px] md:text-[11px] text-slate-600 font-mono whitespace-nowrap ml-2">
          {formatDate(session.time.updated)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm md:text-sm font-medium text-slate-200 mb-2 md:mb-3 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
        {session.title || session.slug}
      </h3>

      {/* Bottom row: slug + stats */}
      <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-white/5">
        <span className="text-[10px] md:text-[11px] font-mono text-slate-600 truncate max-w-[50%] md:max-w-[60%]">
          {session.slug}
        </span>
        <div className="flex items-center gap-2 md:gap-3">
          {session.summary && session.summary.files > 0 && (
            <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-slate-500">
              <i className="ph ph-file-code text-xs"></i>
              <span className="hidden sm:inline">{session.summary.files}</span>
            </span>
          )}
          <span className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-[11px] font-mono px-2 md:px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 group-hover:bg-neon-cyan/10 group-hover:text-neon-cyan transition-all">
            <i className="ph ph-chat-circle-dots text-xs"></i>
            {session.messageCount}
          </span>
        </div>
      </div>
    </div>
  );
}
