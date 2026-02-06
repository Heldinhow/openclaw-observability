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
          sessionCount: sessions.filter((ss) => ss.projectID === s.projectID).length,
        },
      ])
    ).values()
  );

  const tabs = [
    { id: 'sessions' as Tab, label: 'Sessoes', icon: 'ph ph-squares-four', count: sessions.length },
    { id: 'logs' as Tab, label: 'Logs em Tempo Real', icon: 'ph ph-terminal', count: undefined },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative z-10">
      <Header health={health} sessions={sessions} />

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="-mb-px flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative py-3.5 px-5 text-sm font-medium transition-all duration-300 rounded-t-lg
                  ${activeTab === tab.id
                    ? 'text-neon-cyan bg-white/[0.03]'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                  }
                `}
              >
                <span className="flex items-center gap-2.5">
                  <i className={tab.icon}></i>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`
                      text-[10px] font-mono px-2 py-0.5 rounded-full
                      ${activeTab === tab.id
                        ? 'bg-neon-cyan/15 text-neon-cyan'
                        : 'bg-white/5 text-slate-600'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'sessions' ? (
          <div className="fade-in">
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
          </div>
        ) : (
          <div className="fade-in">
            <LogsTab />
          </div>
        )}
      </main>
    </div>
  );
}
