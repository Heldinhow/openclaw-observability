import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogDetailPanel } from '../../src/components/logs/LogDetailPanel';
import { LogEntry } from '../../src/types/log.types';

const mockEntry: LogEntry = {
  id: 'test-id-123',
  timestamp: '2026-02-06T14:30:00.123Z',
  level: 'info',
  subsystem: 'gateway',
  message: 'Test message for detail panel',
  metadata: {
    webhookId: 'wh_123',
    chatId: '5511999999999@c.us'
  },
  correlationId: 'corr-abc-123',
  sourceFile: '/tmp/openclaw/openclaw.log',
  parsedAt: '2026-02-06T14:30:00.500Z'
};

describe('LogDetailPanel', () => {
  const defaultProps = {
    entry: mockEntry,
    onClose: jest.fn()
  };

  it('renders all log entry details', () => {
    render(<LogDetailPanel {...defaultProps} />);
    
    expect(screen.getByText('test-id-123')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();
    expect(screen.getByText('gateway')).toBeInTheDocument();
    expect(screen.getByText('Test message for detail panel')).toBeInTheDocument();
  });

  it('displays correlation ID when present', () => {
    render(<LogDetailPanel {...defaultProps} />);
    
    expect(screen.getByText('corr-abc-123')).toBeInTheDocument();
  });

  it('displays source file when present', () => {
    render(<LogDetailPanel {...defaultProps} />);
    
    expect(screen.getByText('/tmp/openclaw/openclaw.log')).toBeInTheDocument();
  });

  it('displays metadata as formatted JSON', () => {
    render(<LogDetailPanel {...defaultProps} />);
    
    expect(screen.getByText('webhookId')).toBeInTheDocument();
    expect(screen.getByText('wh_123')).toBeInTheDocument();
  });

  it('calls onClose when clicking close button', () => {
    render(<LogDetailPanel {...defaultProps} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not show correlation ID when absent', () => {
    const entryWithoutCorrelation = { ...mockEntry, correlationId: undefined };
    render(<LogDetailPanel entry={entryWithoutCorrelation} onClose={jest.fn()} />);
    
    expect(screen.queryByText('corr-abc-123')).not.toBeInTheDocument();
  });

  it('does not show source file when absent', () => {
    const entryWithoutSource = { ...mockEntry, sourceFile: undefined };
    render(<LogDetailPanel entry={entryWithoutSource} onClose={jest.fn()} />);
    
    expect(screen.queryByText('/tmp/openclaw/openclaw.log')).not.toBeInTheDocument();
  });

  it('displays empty metadata section when present but empty', () => {
    const entryWithEmptyMetadata = { ...mockEntry, metadata: {} };
    render(<LogDetailPanel entry={entryWithEmptyMetadata} onClose={jest.fn()} />);
    
    // Should not crash with empty metadata
    expect(screen.getByText('Test message for detail panel')).toBeInTheDocument();
  });

  it('handles multi-line messages correctly', () => {
    const multiLineEntry = {
      ...mockEntry,
      message: 'Line 1\nLine 2\nLine 3'
    };
    render(<LogDetailPanel entry={multiLineEntry} onClose={jest.fn()} />);
    
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
    expect(screen.getByText('Line 3')).toBeInTheDocument();
  });
});
