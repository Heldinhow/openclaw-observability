import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionTable } from '../src/components/SessionTable';
import type { Session } from '../src/types';

const mockSessions: Session[] = [
  {
    id: 'ses_123',
    slug: 'test-session',
    version: '1.0.0',
    projectID: 'proj_1',
    directory: '/root/projects/proj_1',
    title: 'Test Session',
    time: { created: Date.now() - 3600000, updated: Date.now() },
    summary: { additions: 10, deletions: 5, files: 3 },
    status: 'active',
    messageCount: 15,
  },
  {
    id: 'ses_456',
    slug: 'another-session',
    version: '1.0.0',
    projectID: 'proj_2',
    directory: '/root/projects/proj_2',
    title: 'Another Session',
    time: { created: Date.now() - 7200000, updated: Date.now() - 3600000 },
    summary: { additions: 0, deletions: 0, files: 0 },
    status: 'inactive',
    messageCount: 0,
  },
];

describe('SessionTable', () => {
  it('should render loading state', () => {
    render(
      <SessionTable
        sessions={[]}
        onSessionClick={() => {}}
        isLoading={true}
        error={null}
      />
    );
    expect(screen.getByText('Carregando sessões...')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <SessionTable
        sessions={[]}
        onSessionClick={() => {}}
        isLoading={false}
        error={null}
      />
    );
    expect(screen.getByText('Nenhuma sessão encontrada')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(
      <SessionTable
        sessions={[]}
        onSessionClick={() => {}}
        isLoading={false}
        error={new Error('Failed to load')}
      />
    );
    expect(screen.getByText('Erro ao carregar sessões')).toBeInTheDocument();
  });

  it('should render sessions', () => {
    const handleClick = vi.fn();
    render(
      <SessionTable
        sessions={mockSessions}
        onSessionClick={handleClick}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText('Test Session')).toBeInTheDocument();
    expect(screen.getByText('Another Session')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('should call onSessionClick when row is clicked', () => {
    const handleClick = vi.fn();
    render(
      <SessionTable
        sessions={mockSessions}
        onSessionClick={handleClick}
        isLoading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByText('Test Session'));
    expect(handleClick).toHaveBeenCalledWith(mockSessions[0]);
  });
});
