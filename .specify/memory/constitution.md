# OpenClaw Observability Constitution

## Core Principles

### I. Session Observability First
Every opencode session MUST be discoverable, trackable, and auditable. The system MUST automatically discover projects with active sessions via `opencode session list` in `projects/` directories. Session metadata (ID, timestamp, message count, status) MUST be captured and cached for rapid querying. Real-time awareness of session state takes precedence over feature complexity.

### II. API-First Backend Design
The Node/Express backend MUST expose RESTful endpoints for all session operations. Redis with ioredis MUST serve as the cache for session data with a 5-minute update TTL. Write operations MUST queue for consistency; read operations MUST favor cached data for performance. The backend operates on port 3000 and MUST log all discovery and cache operations.

### III. Frontend Experience Excellence
The React/Vite frontend MUST provide a dark-themed, responsive UI. Session listing MUST display in a sortable table with columns: Project, Session ID, Updated, Messages, Status. Filtering by project name or session status (active/inactive) MUST be instant. The refresh button MUST trigger immediate cache invalidation and rediscovery. Session details MUST load on-demand with full history via `opencode session load` integration.

### IV. Observability Integration
The dashboard MUST integrate with existing observability infrastructure (logs/tasks). All backend operations MUST emit structured logs to the central logging system. Frontend errors MUST report to the task tracking system. Performance metrics (cache hit rates, discovery latency) MUST be exposed and visible.

### V. Deployment Readiness
Production deployment MUST use ports 3000 (backend) and 5173 (frontend). The external IP 76.13.101.17 MUST be configured as the target host. All configuration MUST be environment-driven with no hardcoded production values. Health endpoints MUST expose cache freshness and discovery status.

## Technical Standards

All code MUST follow these non-negotiable standards:

- Backend: TypeScript with ESLint + Prettier formatting
- Frontend: TypeScript with Tailwind CSS for styling
- Tests: Jest for backend, Vitest for frontend
- Database: SQLite with migrations tracked in version control
- Documentation: Inline JSDoc for public APIs, README for deployment

## Development Workflow

Feature implementation MUST follow the Specify methodology:
1. Create feature branch from main
2. Write spec.md with user stories (prioritized P1, P2, P3)
3. Create plan.md with technical approach
4. Implement tasks.md breaking down work by user story
5. Write tests before implementation for each story
6. Ensure each user story is independently testable and deployable
7. Code review MUST verify constitution compliance

## Governance

This constitution supersedes all other development practices for this project. Amendments require:
- Documentation of the proposed change
- Impact analysis on existing features
- Migration plan if breaking changes
- Pull request review with constitution compliance check

**Version**: 1.0.0 | **Ratified**: 2026-02-05 | **Last Amended**: 2026-02-05
