import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogFilter } from '../../src/components/logs/LogFilter';

describe('LogFilter', () => {
  const defaultProps = {
    onFilterChange: jest.fn(),
    entryCount: 100
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders level filter buttons', () => {
    render(<LogFilter {...defaultProps} />);
    
    expect(screen.getByText('INFO')).toBeInTheDocument();
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.getByText('WARN')).toBeInTheDocument();
  });

  it('toggles level when clicked', () => {
    render(<LogFilter {...defaultProps} />);
    
    const errorButton = screen.getByText('ERROR');
    fireEvent.click(errorButton);
    
    expect(errorButton).toHaveClass('bg-red-600');
  });

  it('has search input field', () => {
    render(<LogFilter {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('has subsystem input field', () => {
    render(<LogFilter {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Subsistema...')).toBeInTheDocument();
  });

  it('displays entry count', () => {
    render(<LogFilter {...defaultProps} />);
    
    expect(screen.getByText('100 / 250 logs')).toBeInTheDocument();
  });

  it('shows clear filters button when filters are active', () => {
    render(<LogFilter {...defaultProps} />);
    
    const errorButton = screen.getByText('ERROR');
    fireEvent.click(errorButton);
    
    expect(screen.getByText('Limpar filtros')).toBeInTheDocument();
  });
});
