<!--
SYNC IMPACT REPORT
==================
Version Change: N/A → 1.0.0 (initial ratification)
Modified Principles: All new (5 principles established)
Added Sections:
  - Core Principles (5 principles)
  - Technology Stack
  - Development Workflow
  - Governance
Removed Sections: N/A
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check gates align with principles
  ✅ spec-template.md - User scenarios and testing align with testing discipline
  ✅ tasks-template.md - Parallel execution and testing structure aligns
  ✅ checklist-template.md - Validation criteria align with principles
Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Original adoption date unknown - update when confirmed
-->

# OpenClaw Observability Constitution

## Core Principles

### I. API-First Architecture
Every feature MUST expose functionality via well-defined RESTful APIs. Backend and frontend communicate exclusively through documented endpoints.

**Non-negotiable rules:**
- All data access MUST flow through `/api/*` endpoints
- Request/response contracts MUST be documented and versioned
- Backend MUST remain stateless; session state belongs to client or cache
- Breaking API changes require MAJOR version increment

**Rationale:** Clear separation enables independent deployment, testing, and future client implementations. The backend serves as a platform, not just a frontend accessory.

### II. Observability by Design (NON-NEGOTIABLE)
As an observability platform, the system MUST be self-observable with comprehensive logging, monitoring, and debugging capabilities.

**Non-negotiable rules:**
- Structured logging (Pino) REQUIRED for all operations
- Health check endpoint (`/api/health`) MUST validate all dependencies
- Error tracking endpoint (`/api/errors`) MUST accept frontend error reports
- All external calls (Redis, file system) MUST log latency and outcomes
- Logs MUST include correlation IDs for request tracing

**Rationale:** We cannot build an observability dashboard without practicing observability ourselves. This principle ensures the platform is debuggable and maintainable.

### III. Testing Discipline
All code MUST be testable and tested. Tests are not optional; they are a requirement for code completeness.

**Non-negotiable rules:**
- Backend: `npm test` MUST pass before any merge
- Frontend: `npm run test` MUST pass before any merge
- New features MUST include corresponding test cases
- Integration tests REQUIRED for Redis cache and file system interactions
- Contract tests REQUIRED for all API endpoints

**Rationale:** Testing ensures reliability of the observability platform. Given this tool monitors critical development workflows, bugs have amplified impact on user productivity.

### IV. Performance Through Caching
The system MUST deliver sub-second response times through strategic caching and efficient data access patterns.

**Non-negotiable rules:**
- Redis cache REQUIRED for session data with configurable TTL
- Cache invalidation endpoint (`POST /api/refresh`) MUST be available
- File system reads MUST be minimized and batched where possible
- Response payloads MUST be paginated for large datasets
- Frontend MUST implement request deduplication and optimistic updates

**Rationale:** Users depend on this dashboard for real-time development insights. Slow responses degrade the development experience we aim to improve.

### V. Environment-Aware Configuration
The system MUST adapt behavior based on environment without code changes.

**Non-negotiable rules:**
- Configuration MUST be environment-driven via `.env` files
- No hardcoded URLs, credentials, or environment-specific values in source
- Docker support REQUIRED for consistent deployment
- Development and production configurations MUST be documented
- Feature flags MAY be used for gradual rollouts

**Rationale:** Clear configuration boundaries prevent deployment errors and enable the project to run across different environments (local, staging, production) without modification.

## Technology Stack

The following technologies are mandated for this project:

**Backend:**
- Node.js 20+ with Express 4.x
- TypeScript 5.x (strict mode enabled)
- ioredis 5.x for caching
- Pino for structured logging

**Frontend:**
- React 18.x with TypeScript 5.x
- Vite 5.x for build tooling
- Tailwind CSS 3.x for styling
- TanStack Query for state management

**Testing:**
- Backend: Jest or equivalent
- Frontend: Vitest or equivalent
- All tests run via `npm test`

**Code Quality:**
- ESLint for linting
- TypeScript compiler for type checking
- Both MUST pass in CI/CD

## Development Workflow

### Pre-commit Requirements
- Lint checks MUST pass (`npm run lint`)
- Type checks MUST pass (`npx tsc --noEmit`)
- Tests MUST pass (`npm test`)

### Code Review
- All changes REQUIRE review before merge
- Reviewers MUST verify compliance with constitution principles
- Breaking changes REQUIRE explicit approval and migration documentation

### Feature Implementation
1. User stories MUST be defined with acceptance criteria
2. Tests MUST be written before or alongside implementation
3. API contracts MUST be documented before implementation
4. Implementation MUST follow plan.md structure

## Governance

This constitution supersedes all other development practices. When in conflict, principles herein take precedence.

### Amendment Procedure
1. Proposed changes MUST be documented with rationale
2. Changes affecting principles REQUIRE explicit approval
3. Version number MUST increment according to semantic versioning:
   - MAJOR: Backward incompatible principle redefinitions or removals
   - MINOR: New principle/section added or materially expanded guidance
   - PATCH: Clarifications, wording fixes, non-semantic refinements
4. All amendments MUST update the Sync Impact Report at the top of this file

### Compliance Review
All pull requests MUST verify compliance with:
- Constitution principles (checklist in PR template)
- Technology stack constraints
- Testing requirements

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-02-06
