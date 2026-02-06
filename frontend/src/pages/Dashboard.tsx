import { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { SessionTable } from '../components/SessionTable';
import { SessionDetail } from '../components/SessionDetail';
import { Filters } from '../components/Filters';
import { useSessions, useRefresh, useHealth, useSessionDetail } from '../hooks/useSessions';
import type { Session, SessionFilters } from '../types';

export function Dashboard() {
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

      <main className="container mx-auto px-6 py-6">
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
      </main>
    </div>
  );
}
