# Quickstart: Session Details View

## Prerequisites

- Node.js 20+
- npm or yarn
- Redis server (for session caching)
- Access to ~/.local/share/opencode/storage/ for session files

## Development Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Environment

Create `.env` files based on examples:

```bash
# backend/.env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
STORAGE_PATH=/root/.local/share/opencode/storage
CACHE_TTL_SECONDS=300
OBSERVABILITY_URL=http://localhost:8080/logs
TASK_TRACKING_URL=http://localhost:8080/tasks

# frontend/.env
VITE_API_URL=http://localhost:3000
```

### 3. Start Redis

```bash
# Start Redis server (adjust port if needed)
redis-server --port 6379
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 5. Access Dashboard

Open http://localhost:5173 in your browser.

## Project Structure

```
backend/
├── src/
│   ├── api/           # Express routes and controllers
│   ├── services/      # Business logic (discovery, cache, messages)
│   ├── types/         # TypeScript types
│   └── index.ts       # Entry point
├── tests/
│   ├── unit/          # Unit tests
│   └── integration/   # API integration tests
├── package.json
└── .env

frontend/
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API client
│   ├── types/         # TypeScript types
│   └── App.tsx        # Root component
├── tests/
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Commands

```bash
# Backend
npm run dev          # Start development server
npm run test         # Run unit tests
npm run lint         # Check code style
npm run build        # Production build

# Frontend
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run tests
```

## Architecture Overview

1. **Discovery Service**: Reads session JSON files from ~/.local/share/opencode/storage/session/
2. **Cache Layer**: Redis stores session metadata with 5-minute TTL
3. **API Layer**: Express REST endpoints for sessions, projects, health
4. **Frontend**: React with TanStack Query for server state, Tailwind for styling

## Testing

### Backend Tests

```bash
cd backend
npm test              # Run all tests
npm test -- --watch  # Watch mode
```

### Frontend Tests

```bash
cd frontend
npm test             # Run all tests
npm test -- --ui     # UI mode
```

## Deployment

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Production Environment Variables

```bash
# backend/.env.production
PORT=3000
REDIS_HOST=redis.internal.company.com
REDIS_PORT=6379
STORAGE_PATH=/root/.local/share/opencode/storage
CACHE_TTL_SECONDS=300
OBSERVABILITY_URL=https://logs.company.com/api
TASK_TRACKING_URL=https://tasks.company.com/api
NODE_ENV=production

# frontend/.env.production
VITE_API_URL=http://76.13.101.17:3000
```

### Docker (Optional)

```dockerfile
# Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Troubleshooting

### Sessions Not Appearing

1. Verify ~/.local/share/opencode/storage/session/ exists and is readable
2. Check Redis connection: redis-cli ping
3. Review backend logs for discovery errors
4. Try manual refresh via API: POST /api/refresh

### Cache Stale

1. Cache TTL is 5 minutes by default
2. Force refresh: POST /api/refresh
3. Check health: GET /api/health

### Redis Connection Issues

1. Verify Redis is running: redis-cli ping
2. Check REDIS_HOST and REDIS_PORT in .env
3. Check firewall rules for Redis port

### Frontend Errors

1. Open browser console for errors
2. Verify VITE_API_URL points to correct backend
3. Check network tab for failed API requests
