import { useMemo } from 'react';
import { useZenUsage, useZenModels, useZenStatus } from '../hooks/useZenUsage';

// Format number with commas
function fmtNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function UsageTab() {
  const { data: usage, isLoading: loadingUsage, error: usageError } = useZenUsage();
  const { data: models, isLoading: loadingModels } = useZenModels();
  const { data: status, isLoading: loadingStatus } = useZenStatus();

  const isConfigured = status?.configured && status.hasApiKey;
  const isLoading = loadingUsage || loadingModels || loadingStatus;
  const error = usageError;

  // Calculate free vs paid usage
  const usageStats = useMemo(() => {
    if (!usage) return null;

    const freeModels = usage.models.filter(m => m.isFree);
    const paidModels = usage.models.filter(m => !m.isFree);

    const freeRequests = freeModels.reduce((sum, m) => sum + m.requests, 0);
    const paidRequests = paidModels.reduce((sum, m) => sum + m.requests, 0);

    return {
      freeRequests,
      paidRequests,
      freePercentage: usage.totalRequests > 0 ? Math.round((freeRequests / usage.totalRequests) * 100) : 0,
      paidPercentage: usage.totalRequests > 0 ? Math.round((paidRequests / usage.totalRequests) * 100) : 0,
    };
  }, [usage]);

  if (!isConfigured) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="glass-strong rounded-xl p-6 border border-neon-cyan/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 flex items-center justify-center">
              <i className="ph ph-coin text-2xl text-neon-cyan"></i>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Model Usage</h2>
              <p className="text-slate-400 text-sm">OpenCode Zen API integration</p>
            </div>
          </div>
        </div>

        {/* Not configured */}
        <div className="glass-strong rounded-xl p-8 border border-amber-500/30 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="ph ph-warning text-3xl text-amber-500"></i>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Zen API Key Not Configured</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-4">
            To view your usage statistics, you need to configure the ZEN_API_KEY
            environment variable in the backend.
          </p>
          <div className="bg-slate-900/50 rounded-lg p-4 text-left max-w-md mx-auto">
            <code className="text-sm text-neon-cyan">
              ZEN_API_KEY=sk-your-api-key-here
            </code>
          </div>
        </div>

        {/* Available Free Models */}
        <div className="glass-strong rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <i className="ph ph-star text-neon-cyan"></i>
            Available Free Models
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['minimax-m2.1-free', 'kimi-k2.5-free', 'glm-4.7-free', 'gpt-5-nano'].map((model) => (
              <div
                key={model}
                className="bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/50"
              >
                <span className="text-sm text-slate-300 font-mono">{model}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="glass-strong rounded-xl p-4 sm:p-6 border border-neon-cyan/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 flex items-center justify-center">
              <i className="ph ph-coin text-xl sm:text-2xl text-neon-cyan"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">Model Usage</h2>
              <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Connected to Zen
              </p>
            </div>
          </div>
          <button
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan rounded-lg text-xs sm:text-sm font-medium transition-colors"
            onClick={() => window.location.reload()}
          >
            <i className="ph ph-arrows-clockwise mr-1 sm:mr-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {isLoading && !usage ? (
        <div className="glass-strong rounded-xl p-12 text-center border border-slate-700/50">
          <div className="animate-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading usage data...</p>
        </div>
      ) : error ? (
        <div className="glass-strong rounded-xl p-8 border border-red-500/30 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="ph ph-x-circle text-3xl text-red-500"></i>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Usage</h3>
          <p className="text-slate-400">{error.message}</p>
        </div>
      ) : usage && usageStats ? (
        <>
          {/* Free vs Paid Usage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Free Usage */}
            <div className="glass-strong rounded-xl p-4 sm:p-5 border border-green-500/20">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-slate-400 text-xs sm:text-sm">Free Models</span>
                <i className="ph ph-star text-green-400"></i>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2 font-mono">
                {fmtNumber(usageStats.freeRequests)}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${usageStats.freePercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-slate-400">{usageStats.freePercentage}%</span>
              </div>
            </div>

            {/* Paid Usage */}
            <div className="glass-strong rounded-xl p-4 sm:p-5 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-slate-400 text-xs sm:text-sm">Paid Models</span>
                <i className="ph ph-currency-dollar text-amber-400"></i>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2 font-mono">
                {fmtNumber(usageStats.paidRequests)}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${usageStats.paidPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-slate-400">{usageStats.paidPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Request Stats */}
          <div className="glass-strong rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
              <i className="ph ph-chart-bar text-neon-cyan"></i>
              Request Statistics
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-bolt text-neon-cyan text-sm sm:text-xl"></i>
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-white font-mono truncate">
                    {fmtNumber(usage.requestsToday)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 truncate">Requests Today</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-neon-blue/10 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-calendar text-neon-blue text-sm sm:text-xl"></i>
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-white font-mono truncate">
                    {fmtNumber(usage.requestsThisMonth)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 truncate">This Month</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-chart-line text-purple-400 text-sm sm:text-xl"></i>
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-bold text-white font-mono truncate">
                    {fmtNumber(usage.totalRequests)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 truncate">Total Requests</div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Usage Breakdown */}
          {usage.models.length > 0 && (
            <div className="glass-strong rounded-xl p-4 sm:p-6 border border-slate-700/50 overflow-hidden">
              <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
                <i className="ph ph-chart-pie text-neon-cyan"></i>
                Model Usage Breakdown
              </h3>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs sm:text-sm text-slate-400 border-b border-slate-700/50">
                        <th className="pb-2 sm:pb-3 font-medium pr-4">Model</th>
                        <th className="pb-2 sm:pb-3 font-medium text-center pr-4">Type</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right pr-4">Requests</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.models.map((model) => (
                        <tr key={model.modelId} className="border-b border-slate-800/50 last:border-0">
                          <td className="py-2 sm:py-3 pr-4 min-w-[140px]">
                            <span className="text-white font-mono text-xs sm:text-sm break-all">{model.modelId}</span>
                          </td>
                          <td className="py-2 sm:py-3 text-center pr-4">
                            {model.isFree ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs">
                                <i className="ph ph-star text-[10px]"></i>
                                Free
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                                <i className="ph ph-currency-dollar text-[10px]"></i>
                                Paid
                              </span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 text-right text-slate-300 pr-4 font-mono text-xs sm:text-sm">
                            {fmtNumber(model.requests)}
                          </td>
                          <td className="py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 sm:w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                                <div
                                  className={`h-full rounded-full ${
                                    model.isFree ? 'bg-green-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${model.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs sm:text-sm text-slate-400 w-8 sm:w-10 text-right flex-shrink-0">
                                {model.percentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Free Models Reference */}
          <div className="glass-strong rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
              <i className="ph ph-star text-amber-400"></i>
              Free Models Available
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {models?.freeModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-slate-800/50 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-700/50 hover:border-neon-cyan/30 transition-colors"
                >
                  <span className="text-xs sm:text-sm text-slate-300 font-mono break-all">{model.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-slate-500">
            Last updated: {new Date(usage.lastUpdated).toLocaleString()}
          </div>
        </>
      ) : null}
    </div>
  );
}
