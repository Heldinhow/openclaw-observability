import React from 'react';
import type { LogEntry } from '../types/log.types';

interface LogDetailPanelProps {
  log: LogEntry | null;
  onClose?: () => void;
}

const LogDetailPanel: React.FC<LogDetailPanelProps> = ({ log, onClose }) => {
  if (!log) return <div style={{ flex: 1, padding: '10px' }}>Selecione um log para ver detalhes</div>;

  return (
    <div style={{ 
      flex: 1, 
      padding: '16px', 
      borderLeft: '1px solid #374151',
      background: '#111827',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#f3f4f6', margin: 0 }}>Detalhes do Log</h3>
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ×
          </button>
        )}
      </div>
      <div style={{ 
        background: '#1f2937', 
        padding: '12px', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#6b7280' }}>ID: </span>
          <span style={{ color: '#f3f4f6' }}>{log.id}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#6b7280' }}>Timestamp: </span>
          <span style={{ color: '#f3f4f6' }}>{new Date(log.timestamp).toISOString()}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#6b7280' }}>Level: </span>
          <span style={{ 
            color: log.level === 'error' ? '#f87171' : 
                   log.level === 'warn' ? '#fbbf24' : 
                   log.level === 'debug' ? '#60a5fa' : '#34d399'
          }}>
            {log.level.toUpperCase()}
          </span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#6b7280' }}>Service: </span>
          <span style={{ color: '#f3f4f6' }}>{log.service}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#6b7280' }}>Message: </span>
          <span style={{ color: '#f3f4f6' }}>{log.message}</span>
        </div>
        {log.metadata && (
          <div>
            <span style={{ color: '#6b7280' }}>Metadata: </span>
            <pre style={{ color: '#f3f4f6', margin: '8px 0 0 0', overflow: 'auto' }}>
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogDetailPanel;
