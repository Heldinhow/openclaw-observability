import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogList } from '../../src/components/logs/LogList';
import { LogEntry } from '../../src/types/log.types';

const mockEntries: LogEntry[] = [
  {
    id: '1',
    timestamp: '2026-02-06T14:30:00.123Z',
    level: 'info',
    subsystem: 'gateway',
    message: 'Test message 1',
    parsedAt: '2026-02-06T14:30:00.500Z'
  },
  {
    id: '2',
    timestamp: '2026-02-06T14:30:01.456Z',
    level: 'error',
    subsystem: 'gateway/channels',
    message: 'Test message 2 with error',
    correlationId: 'corr-123',
    parsedAt: '2026-02-06T14:30:01.800Z'
  },
  {
    id: '3',
    timestamp: '2026-02-06T14:30:02.789Z',
    level: 'warn',
    subsystem: 'channels/whatsapp',
    message: 'Warning message',
    parsedAt: '2026-02-06T14:30:02.900Z'
  }
];

describe('LogList', () => {
  const defaultProps = {
    entries: mockEntries,
    onSelectEntry: jest.fn()
  };

  it('renders log entries in table format', () => {
    render(<LogList {...defaultProps} />);
    
    expect(screen.getByText('14:30:00.123')).toBeInTheDocument();
    expect(screen.getByText('14:30:01.456')).toBeInTheDocument();
    expect(screen.getByText('14:30:02.789')).toBeInTheDocument();
  });

  it('displays level badges with correct colors', () => {
    render(<LogList {...defaultProps} />);
    
    expect(screen.getByText('INFO')).toBeInTheDocument();
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.getByText('WARN')).toBeInTheDocument();
  });

  it('shows truncated messages', () => {
    render(<LogList {...defaultProps} />);
    
    expect(screen.getByText('Test message 1')).toBeInTheDocument();
  });

  it('calls onSelectEntry when clicking a row', () => {
    render(<LogList {...defaultProps} />);
    
    const row = screen.getByText('Test message 1').closest('tr');
    fireEvent.click(row!);
    
    expect(defaultProps.onSelectEntry).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('highlights selected entry', () => {
    render(<LogList {...defaultProps} selectedEntryId="1" />);
    
    const row = screen.getByText('Test message 1').closest('tr');
    expect(row).toHaveClass('bg-gray-700');
  });

  it('shows empty state when no entries', () => {
    render(<LogList entries={[]} onSelectEntry={jest.fn()} />);
    
    expect(screen.getByText('Nenhum log disponível')).toBeInTheDocument();
  });

  it('displays subsystem column', () => {
    render(<LogList {...defaultProps} />);
    
    expect(screen.getByText('gateway')).toBeInTheDocument();
    expect(screen.getByText('gateway/channels')).toBeInTheDocument();
    expect(screen.getByText('channels/whatsapp')).toBeInTheDocument();
  });
});
