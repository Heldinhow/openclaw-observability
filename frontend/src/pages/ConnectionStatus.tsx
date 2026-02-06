import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  status?: {
    isConnected?: boolean;
    isPaused?: boolean;
    entriesInMemory?: number;
  };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onPause?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  status,
  onConnect,
  onDisconnect,
  onPause
}) => {
  const connected = isConnected || status?.isConnected || false;
  const isPaused = status?.isPaused || false;

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-xs">
        <span className={`status-dot ${connected ? 'status-active' : 'status-error'}`} />
        <span className={connected ? 'text-neon-green' : 'text-red-400'}>
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </span>
      
      {isPaused && (
        <span className="text-yellow-400 text-xs flex items-center gap-1">
          <i className="ph ph-pause-circle"></i>
          Pausado
        </span>
      )}
      
      {status?.entriesInMemory !== undefined && (
        <span className="text-slate-500 text-xs font-mono">
          {status.entriesInMemory} logs
        </span>
      )}

      {connected && (
        <div className="flex gap-1.5">
          {onPause && (
            <button
              onClick={onPause}
              className="px-3 py-1.5 text-[11px] rounded-lg glass text-slate-300 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="px-3 py-1.5 text-[11px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
            >
              Desconectar
            </button>
          )}
        </div>
      )}

      {!connected && onConnect && (
        <button
          onClick={onConnect}
          className="px-3 py-1.5 text-[11px] rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 transition-all"
        >
          Reconectar
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
