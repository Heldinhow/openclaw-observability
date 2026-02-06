import { useEffect, useRef } from 'react';
import type { SessionDetailResponse, Message } from '../types';

interface SessionDetailProps {
  session: SessionDetailResponse;
  onClose: () => void;
}

export function SessionDetail({ session, onClose }: SessionDetailProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const formatRelativeTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atras`;
    if (diffHours < 24) return `${diffHours}h atras`;
    return `${diffDays}d atras`;
  };

  const getMessageContent = (message: Message): string => {
    const textParts = message.parts
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text);
    if (textParts.length > 0) return textParts.join('\n\n');
    if (message.summary?.title) return message.summary.title;
    return '';
  };

  const visibleMessages = (session.messages || []).filter((m) => {
    const hasTextParts = m.parts?.some((p) => p.type === 'text' && p.text);
    const hasSummary = m.summary?.title;
    return hasTextParts || hasSummary;
  });

  const projectName = session.directory?.split('/').pop() || session.projectID;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - slides from right, fills full height */}
      <div className="relative ml-auto w-full max-w-3xl h-full flex flex-col bg-slate-950/95 border-l border-white/10 shadow-2xl shadow-black/60">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-neon-cyan via-neon-purple to-neon-blue"></div>

        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all duration-300 flex-shrink-0"
                >
                  <i className="ph ph-arrow-left text-lg"></i>
                </button>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-neon-purple/10 text-neon-purple uppercase tracking-wider">
                  {projectName}
                </span>
                <span className={`
                  text-[10px] px-2 py-1 rounded-lg font-medium
                  ${session.status === 'active'
                    ? 'bg-neon-green/10 text-neon-green'
                    : 'bg-slate-800 text-slate-500'
                  }
                `}>
                  {session.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white truncate pl-11">
                {session.title}
              </h2>
              <div className="flex items-center gap-4 mt-2 pl-11">
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <i className="ph ph-chat-circle-dots"></i>
                  {session.messageCount} mensagens
                </span>
                <span className="text-xs text-slate-600">|</span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <i className="ph ph-clock"></i>
                  {formatRelativeTime(session.time.updated)}
                </span>
                {session.summary && session.summary.files > 0 && (
                  <>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                      <i className="ph ph-file-code"></i>
                      {session.summary.files} arquivos
                      <span className="text-neon-green">+{session.summary.additions}</span>
                      <span className="text-red-400">-{session.summary.deletions}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages - fills remaining space */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {visibleMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <i className="ph ph-chat-circle text-xl text-slate-600"></i>
              </div>
              <p className="text-slate-500 text-sm">Nenhuma mensagem com conteudo</p>
            </div>
          ) : (
            visibleMessages.map((message, idx) => (
              <MessageBubble
                key={message.id}
                message={message}
                content={getMessageContent(message)}
                formatDate={formatDate}
                isFirst={idx === 0}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-600 font-mono">
            ID: {session.slug || session.id}
          </span>
          <span className="text-[11px] text-slate-600 font-mono">
            Criado: {formatDate(session.time.created)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  content,
  formatDate,
}: {
  message: Message;
  content: string;
  formatDate: (ts: number) => string;
  isFirst: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1
          ${isUser
            ? 'bg-gradient-to-br from-neon-blue to-neon-purple shadow-lg shadow-neon-blue/10'
            : 'bg-gradient-to-br from-neon-green to-neon-cyan shadow-lg shadow-neon-green/10'
          }
        `}
      >
        {isUser ? (
          <i className="ph ph-user text-sm text-white"></i>
        ) : (
          <i className="ph ph-robot text-sm text-white"></i>
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Name + time */}
        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className={`text-xs font-semibold ${
            isUser ? 'text-neon-blue' : 'text-neon-green'
          }`}>
            {isUser ? 'Usuario' : 'Agente'}
          </span>
          {message.model && (
            <span className="text-[10px] text-slate-600 font-mono px-1.5 py-0.5 rounded bg-white/5">
              {message.model.modelID}
            </span>
          )}
          <span className="text-[10px] text-slate-600 font-mono">
            {formatDate(message.time.created)}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-3 max-w-[90%]
            ${isUser
              ? 'bg-neon-blue/[0.08] border border-neon-blue/15 rounded-tr-sm'
              : 'bg-white/[0.03] border border-white/5 rounded-tl-sm'
            }
          `}
        >
          <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed break-words">
            {content || (
              <span className="text-slate-600 italic text-xs">
                [Conteudo nao disponivel]
              </span>
            )}
          </div>
        </div>

        {/* Summary badge */}
        {message.summary?.title && message.parts?.some((p) => p.type === 'text' && p.text) && (
          <div className={`mt-1.5 ${isUser ? 'text-right' : ''}`}>
            <span className="text-[10px] text-slate-600 font-mono px-2 py-1 rounded-lg bg-white/5 inline-flex items-center gap-1">
              <i className="ph ph-note text-xs"></i>
              {message.summary.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
