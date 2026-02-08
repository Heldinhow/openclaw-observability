import { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from '../components/Header';
import { SessionTable } from '../components/SessionTable';
import { SessionDetail } from '../components/SessionDetail';
import { Filters } from '../components/Filters';
import { useSessions, useRefresh, useHealth, useSessionDetail } from '../hooks/useSessions';
import { LogsTab } from './LogsTab';
import { CronjobsTab } from './CronjobsTab';
import { UsageTab } from './UsageTab';
import { useSwipe } from '../hooks/useSwipe';
import type { Session, SessionFilters } from '../types';

type Tab = 'sessions' | 'logs' | 'cronjobs' | 'usage';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [filters, setFilters] = useState<SessionFilters>({
    project: undefined,
    status: 'all',
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData, isLoading, error } = useSessions(filters);
  const refreshMutation = useRefresh();
  const { data: health } = useHealth();
  const { data: selectedSession } = useSessionDetail(selectedSessionId);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Swipe navigation between tabs
  const tabsArray: Tab[] = ['sessions', 'logs', 'cronjobs', 'usage'];
  
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = tabsArray.indexOf(activeTab);
    if (currentIndex < tabsArray.length - 1) {
      setActiveTab(tabsArray[currentIndex + 1]);
    }
  }, [activeTab]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = tabsArray.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabsArray[currentIndex - 1]);
    }
  }, [activeTab]);

  const swipeRef = useSwipe<HTMLDivElement>({
    threshold: 60,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current && isMobile) {
      const activeButton = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab, isMobile]);

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
    { id: 'sessions' as Tab, label: 'Sessoes', shortLabel: 'Sessoes', icon: 'ph ph-squares-four', count: sessions.length },
    { id: 'logs' as Tab, label: 'Logs em Tempo Real', shortLabel: 'Logs', icon: 'ph ph-terminal', count: undefined },
    { id: 'cronjobs' as Tab, label: 'Cronjobs & Queue', shortLabel: 'Cron', icon: 'ph ph-clock', count: undefined },
    { id: 'usage' as Tab, label: 'Zen Usage', shortLabel: 'Usage', icon: 'ph ph-coin', count: undefined },
  ];

  return (
    <div 
      ref={swipeRef}
      className="min-h-screen bg-slate-950 relative z-10 touch-pan-y overflow-x-hidden"
    >
      <Header health={health} sessions={sessions} />

      {/* Mobile Tab Indicator */}
      {isMobile && (
        <div className="md:hidden bg-slate-950/50 px-4 pt-2 pb-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Deslize para navegar</span>
            <div className="flex gap-1">
              {tabsArray.map((tab) => (
                <div 
                  key={tab}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    activeTab === tab ? 'bg-neon-cyan' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <nav 
            ref={tabsRef}
            className="flex space-x-0.5 md:space-x-1 overflow-x-auto scrollbar-hide -mb-px pb-px"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative py-3 md:py-3.5 px-3 md:px-5 text-xs md:text-sm font-medium 
                  transition-all duration-300 rounded-t-lg whitespace-nowrap
                  flex-shrink-0 min-h-[44px] touch-manipulation
                  active:scale-95 md:active:scale-100
                  ${activeTab === tab.id
                    ? 'text-neon-cyan bg-white/[0.03]'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                  }
                `}
              >
                <span className="flex items-center gap-1.5 md:gap-2.5">
                  <i className={`${tab.icon} text-sm md:text-base`}></i>
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                  {tab.count !== undefined && (
                    <span className={`
                      text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-full
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
                  <div className="absolute bottom-0 left-1 md:left-2 right-1 md:right-2 h-[2px] bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content with Swipe Support */}
      <div className="transition-transform duration-300">
        {activeTab === 'sessions' ? (
          <main className="px-3 sm:px-4 md:px-6 py-3 md:py-6 max-w-7xl mx-auto">
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
          </main>
        ) : activeTab === 'logs' ? (
          <main className="px-2 md:px-4 py-2 md:py-3 h-[calc(100vh-120px)] md:h-[calc(100vh-110px)]">
            <LogsTab />
          </main>
        ) : activeTab === 'usage' ? (
          <main className="px-3 sm:px-4 md:px-6 py-3 md:py-6 max-w-7xl mx-auto">
            <UsageTab />
          </main>
        ) : (
          <main className="px-3 sm:px-4 md:px-6 py-3 md:py-6 max-w-7xl mx-auto">
            <CronjobsTab />
          </main>
        )}
      </div>
    </div>
  );
}
