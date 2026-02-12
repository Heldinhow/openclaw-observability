import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubagentDetailModal } from './SubagentDetailModal';
import { useSubagentDetail } from '../hooks/useSubagents';
import type { SubagentDetail, LogEntry } from '../types';

// Mock the useSubagentDetail hook
vi.mock('../hooks/useSubagents');

// Mock data
const mockSubagentDetail: SubagentDetail = {
  id: 'subagent-123',
  name: 'Test Subagent',
  status: 'running',
  startTime: '2024-01-15T10:00:00Z',
  endTime: null,
  duration: 3600,
  taskId: 'task-456',
  sessionId: 'session-789',
  logSummary: 'Test log summary',
  logs: [
    {
      timestamp: '2024-01-15T10:00:01Z',
      level: 'info',
      message: 'Subagent started',
      metadata: { test: 'metadata' }
    },
    {
      timestamp: '2024-01-15T10:05:00Z',
      level: 'debug',
      message: 'Processing task...'
    },
    {
      timestamp: '2024-01-15T10:10:00Z',
      level: 'warn',
      message: 'Warning message',
      metadata: { warning: 'details' }
    }
  ] as LogEntry[],
  parameters: { param1: 'value1', param2: 123 },
  results: null,
  errorMessage: null,
  errorStack: null,
  resourceUsage: {
    cpuPercent: 45.5,
    memoryMB: 256
  },
  model: 'kimi-k2.5-free',
  summary: 'Task completed successfully with all objectives met.',
  annotations: 'This is a test annotation for the subagent.',
  projectPath: '/root/.openclaw/workspace/projects/test-project'
};

describe('SubagentDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state when data is loading', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Carregando detalhes...')).toBeTruthy();
  });

  it('should render error state when there is an error', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch')
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Erro ao carregar detalhes')).toBeTruthy();
  });

  it('should render subagent details when data is loaded', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Test Subagent')).toBeTruthy();
    expect(screen.getByText('Em Execução')).toBeTruthy();
    expect(screen.getByText('subagent-123')).toBeTruthy();
    expect(screen.getByText('task-456')).toBeTruthy();
    expect(screen.getByText('session-789')).toBeTruthy();
  });

  it('should render resource usage when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Uso de Recursos')).toBeTruthy();
    expect(screen.getByText('CPU')).toBeTruthy();
    expect(screen.getByText('Memória')).toBeTruthy();
  });

  it('should render logs when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Logs Detalhados')).toBeTruthy();
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={onClose}
      />
    );

    // Get the first button (which is the close button in the header)
    const closeButton = screen.getAllByRole('button')[0];
    await userEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render parameters when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Parâmetros')).toBeTruthy();
  });

  it('should render log summary when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Resumo de Logs')).toBeTruthy();
    expect(screen.getByText('Test log summary')).toBeTruthy();
  });

  it('should render model when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Modelo')).toBeTruthy();
    expect(screen.getByText('kimi-k2.5-free')).toBeTruthy();
  });

  it('should render summary/report when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Resumo / Relatório')).toBeTruthy();
    expect(screen.getByText('Task completed successfully with all objectives met.')).toBeTruthy();
  });

  it('should render annotations when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Anotações / Notas')).toBeTruthy();
    expect(screen.getByText('This is a test annotation for the subagent.')).toBeTruthy();
  });

  it('should render project path when available', () => {
    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: mockSubagentDetail },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Caminho do Projeto')).toBeTruthy();
    expect(screen.getByText('/root/.openclaw/workspace/projects/test-project')).toBeTruthy();
  });

  it('should render error stack trace when available', () => {
    const subagentWithError = {
      ...mockSubagentDetail,
      status: 'failed' as const,
      errorMessage: 'Task failed',
      errorStack: 'Error: Task failed\n    at process.nextTick (/app/index.js:42:15)\n    at emitEvents (stream.js:123:9)'
    };

    (useSubagentDetail as vi.Mock).mockReturnValue({
      data: { data: subagentWithError },
      isLoading: false,
      error: null
    });

    render(
      <SubagentDetailModal
        subagentId="subagent-123"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Stack Trace do Erro')).toBeTruthy();
    // Use a function matcher to find the error text that might be broken up
    expect(screen.getByText((content) => content.includes('Error: Task failed'))).toBeTruthy();
  });
});
