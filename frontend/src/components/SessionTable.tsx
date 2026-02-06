import { SessionRow } from './SessionRow';
import type { Session } from '../types';

interface SessionTableProps {
  sessions: Session[];
  onSessionClick: (session: Session) => void;
  isLoading: boolean;
  error: Error | null;
}

export function SessionTable({ sessions, onSessionClick, isLoading, error }: SessionTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-16 text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-neon-cyan/20 border-t-neon-cyan"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="ph ph-robot text-neon-cyan text-xl"></i>
          </div>
        </div>
        <p className="text-slate-400 text-sm">Carregando sessoes...</p>
        <p className="text-slate-600 text-xs mt-1 font-mono">Escaneando projetos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <i className="ph ph-warning text-3xl text-red-400"></i>
        </div>
        <p className="text-red-400 mb-2 font-semibold">Erro ao carregar sessoes</p>
        <p className="text-slate-500 text-sm font-mono max-w-md mx-auto">{error.message}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-neon-cyan/10 flex items-center justify-center mx-auto mb-5">
          <i className="ph ph-robot text-3xl text-neon-cyan"></i>
        </div>
        <p className="text-slate-200 mb-2 font-semibold">Nenhuma sessao encontrada</p>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          As sessoes do OpenClaw aparecerao aqui quando voce comecar a usar o CLI.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sessions.map((session, index) => (
        <SessionRow
          key={session.id}
          session={session}
          onClick={onSessionClick}
          index={index}
        />
      ))}
    </div>
  );
}
