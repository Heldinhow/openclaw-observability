# CONSTITUTION.md

## OpenClaw Observability Dashboard - Subagent Visibility

### Core Principles

1. **Transparency First**
   - All running subagents must be immediately visible
   - Execution history must be traceable and searchable
   - No hidden or invisible subagent states

2. **Real-Time Awareness**
   - Dashboard reflects current subagent state within seconds
   - Status changes propagate instantly
   - Live activity indicators for running processes

3. **Actionable Intelligence**
   - Every subagent entry provides quick actions (view details, terminate, inspect)
   - Clear status indicators (running, completed, failed, pending)
   - Duration and resource metrics visible at a glance

4. **Historical Context**
   - Past executions preserved for debugging
   - Patterns in subagent behavior surfaced
   - Duration trends and success rates tracked

5. **User-Centric Filtering**
   - Filter by status, project, model, or timeframe
   - Sort by recency, duration, or name
   - Search across all subagent metadata

6. **Performance Optimized**
   - Dashboard loads quickly even with thousands of records
   - Pagination for large datasets
   - Lazy loading for subagent details

### Design Principles

- **Clarity Over cleverness**: Status and actions should be instantly understandable
- **Progressive Disclosure**: Summary first, details on demand
- **Consistent State**: Running, completed, and failed states treated equally with appropriate visual treatment
- **Responsive Updates**: WebSocket or polling for live updates

### Success Criteria

1. Users can see all running subagents in < 2 seconds
2. 30-day execution history accessible within dashboard
3. Filter/search operations complete in < 500ms
4. No data loss between backend and frontend
5. 100% visibility into subagent lifecycle
