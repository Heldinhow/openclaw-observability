import React from 'react';
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
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Carregando sessões...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-red-400 mb-4">Erro ao carregar sessões</p>
        <p className="text-gray-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400 mb-2">Nenhuma sessão encontrada</p>
        <p className="text-gray-500 text-sm">
          As sessões do opencode aparecerão aqui quando você começar a usar o CLI.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-700 text-gray-300 text-sm uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Projeto</th>
            <th className="px-4 py-3 font-medium">Session ID</th>
            <th className="px-4 py-3 font-medium">Título</th>
            <th className="px-4 py-3 font-medium">Atualizado</th>
            <th className="px-4 py-3 font-medium text-center">Msgs</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onClick={onSessionClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
