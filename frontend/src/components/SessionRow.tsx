import React from 'react';
import type { Session } from '../types';

interface SessionRowProps {
  session: Session;
  onClick: (session: Session) => void;
}

export function SessionRow({ session, onClick }: SessionRowProps) {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const projectName = session.directory.split('/').pop() || session.projectID;

  return (
    <tr
      onClick={() => onClick(session)}
      className="hover:bg-gray-700 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 text-sm">{projectName}</td>
      <td className="px-4 py-3 text-sm font-mono text-xs">{session.slug}</td>
      <td className="px-4 py-3 text-sm truncate max-w-xs" title={session.title}>
        {session.title}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {formatDate(session.time.updated)}
      </td>
      <td className="px-4 py-3 text-sm text-center">{session.messageCount}</td>
      <td className="px-4 py-3 text-sm">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            session.status === 'active'
              ? 'bg-green-900 text-green-300'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {session.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      </td>
    </tr>
  );
}
