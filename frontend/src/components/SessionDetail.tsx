import React, { useEffect } from 'react';
import type { SessionDetailResponse, Message } from '../types';

interface SessionDetailProps {
  session: SessionDetailResponse;
  onClose: () => void;
}

export function SessionDetail({ session, onClose }: SessionDetailProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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

  const getMessageContent = (message: Message): string => {
    const textParts = message.parts
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text);
    if (textParts.length > 0) {
      return textParts.join('\n\n');
    }
    if (message.summary?.title) {
      return message.summary.title;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-100 truncate">
              {session.title}
            </h2>
            <p className="text-sm text-gray-400">
              {session.messageCount} mensagens •{' '}
              {formatDate(session.time.updated)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(session.messages || [])
            .filter((m) => {
              const hasTextParts = m.parts?.some((p) => p.type === 'text' && p.text);
              const hasSummary = m.summary?.title;
              return hasTextParts || hasSummary;
            })
            .map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-green-600'
                }`}
              >
                {message.role === 'user' ? (
                  <span className="text-xs font-medium">U</span>
                ) : (
                  <span className="text-xs font-medium">A</span>
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-900/50'
                    : 'bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.role === 'user' ? 'Usuário' : 'Agente'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(message.time.created)}
                  </span>
                </div>
                <div className="text-sm text-gray-200 whitespace-pre-wrap">
                  {getMessageContent(message) || (
                    <span className="text-gray-500 italic">
                      [Conteúdo não disponível]
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
