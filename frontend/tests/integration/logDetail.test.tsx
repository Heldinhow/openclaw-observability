import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogDetailPanel } from '../../src/components/logs/LogDetailPanel';

describe('LogDetailPanel', () => {
  const mockEntry = {
    id: 'test-id',
    timestamp: '2026-02-06T14:30:00.123Z',
    level: 'info' as const,
    subsystem: 'gateway',
    message: 'Test message',
    parsedAt: '2026-02-06T14:30:00.500Z'
  };

  const defaultProps = {
    entry: mockEntry,
    onClose: jest.fn()
  };

  it('opens and displays entry details', () => {
    render(<LogDetailPanel {...defaultProps} />);
    
    expect(screen.getByText('Detalhes do Log')).toBeInTheDocument();
    expect(screen.getByText('test-id')).toBeInTheDocument();
  });

  it('closes when close button is clicked', () => {
    render(<LogDetailPanel {...defaultProps} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
