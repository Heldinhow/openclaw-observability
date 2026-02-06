import { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { SessionTable } from '../components/SessionTable';
import { SessionDetail } from '../components/SessionDetail';
import { Filters } from '../components/Filters';
import { useSessions, useRefresh, useHealth, useSessionDetail } from '../hooks/useSessions';
import { LogsTab } from './LogsTab';
import type { Session, SessionFilters } from '../types';

type Tab = 'sessions' | 'logs';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [filters, setFilters] = useState<SessionFilters>({
    project: undefined,
    status: 'all',
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data: sessionsData, isLoading, error } = useSessions(filters);
  const refreshMutation = useRefresh();
  const { data: health } = useHealth();
  const { data: selectedSession } = useSessionDetail(selectedSessionId);

  const handleSessionClick = useCallback((session: Session) => {
    setSelectedSessionId(session.id);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedSessionId(null);
  }, []);

  const handleFilterChange = useCallback((newFilters: SessionFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  const sessions = sessionsData?.sessions || [];
  const projects = Array.from(
    new Map(
      sessions.map((s) => [
        s.projectID,
        {
          id: s.projectID,
          name: s.directory.split('/').pop() || s.projectID,
          path: s.directory,
          lastScanned: new Date().toISOString(),
          sessionCount: 0,
        },
      ])
    ).values()
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <Header health={health} />

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <div className="container mx-auto px-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              Sessões
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'logs'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              Logs em Tempo Real
            </button>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-6 py-6">
        {activeTab === 'sessions' ? (
          <>
            <Filters
              projects={projects}
              filters={filters}
              onFilterChange={handleFilterChange}
              onRefresh={handleRefresh}
              isRefreshing={refreshMutation.isPending}
            />

            <SessionTable
              sessions={sessions}
              onSessionClick={handleSessionClick}
              isLoading={isLoading}
              error={error}
            />

            {selectedSession && (
              <SessionDetail
                session={selectedSession}
                onClose={handleCloseDetail}
              />
            )}
          </>
        ) : (
          <LogsTab />
        )}
      </main>
    </div>
  );
}
