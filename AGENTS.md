# openclaw-observability Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-09

## Active Technologies
- TypeScript 5.x, Node.js 20+ (002-realtime-logs-tab)
- File system (OpenClaw log files in JSON Lines format), Redis (cache layer) (002-realtime-logs-tab)
- TypeScript 5.x (strict mode), Node.js 20+ (001-subagents-dashboard)
- Redis (cache layer), File system (JSON Lines log files) (001-subagents-dashboard)

- TypeScript 5.x (backend + frontend) + Node.js 20+, Express 4.x, React 18.x, Vite 5.x, Tailwind CSS 3.x, ioredis 5.x (001-session-details-view)

## Authentication

The dashboard uses JWT authentication with a single user configured via environment variables:

### Environment Variables (`.env`)
```bash
AUTH_JWT_SECRET=your-32-char-minimum-secret-key
AUTH_USERNAME=admin
AUTH_PASSWORD=your-secure-password
```

### API Endpoints
- `POST /api/auth/login` - Login with username/password, returns JWT token
- `POST /api/auth/validate` - Validate JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)

### Protected Routes
All `/api/*` routes except `/api/auth/*` require JWT authentication via `Authorization: Bearer <token>` header.

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (backend + frontend): Follow standard conventions

## Recent Changes
- 001-subagents-dashboard: Added TypeScript 5.x (strict mode), Node.js 20+
- 002-realtime-logs-tab: Added TypeScript 5.x, Node.js 20+

- 001-session-details-view: Added TypeScript 5.x (backend + frontend) + Node.js 20+, Express 4.x, React 18.x, Vite 5.x, Tailwind CSS 3.x, ioredis 5.x

<!-- MANUAL ADDITIONS START -->
003-cronjobs-history: Implementado histórico de execuções de cronjobs com status (ok/error) e output completo via modal
004-authentication: Implementado sistema de autenticação JWT com single user configurável via .env
<!-- MANUAL ADDITIONS END -->
