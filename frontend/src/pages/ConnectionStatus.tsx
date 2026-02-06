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
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px'
    }}>
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center',
        gap: '6px',
        color: connected ? '#34d399' : '#f87171',
        fontSize: '13px'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: connected ? '#34d399' : '#f87171'
        }} />
        {connected ? 'Conectado' : 'Desconectado'}
      </span>
      
      {isPaused && (
        <span style={{ color: '#fbbf24', fontSize: '13px' }}>
          • Pausado
        </span>
      )}
      
      {status?.entriesInMemory !== undefined && (
        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
          {status.entriesInMemory} logs
        </span>
      )}

      {connected && (
        <div style={{ display: 'flex', gap: '4px' }}>
          {onPause && (
            <button
              onClick={onPause}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid #4b5563',
                background: '#374151',
                color: '#f3f4f6',
                cursor: 'pointer'
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid #dc2626',
                background: '#dc2626',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Desconectar
            </button>
          )}
        </div>
      )}

      {!connected && onConnect && (
        <button
          onClick={onConnect}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid #059669',
            background: '#059669',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Reconectar
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
