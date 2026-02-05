# OpenClaw Observability Dashboard

Dashboard para visualização e monitoramento de sessões do OpenCode CLI.

## Funcionalidades

- **Lista de Sessões**: Visualize todas as sessões do OpenCode em uma tabela unificada
- **Filtros**: Filtre por projeto e status (ativo/inativo)
- **Detalhes da Sessão**: Clique em qualquer sessão para ver o histórico completo de conversas
- **Cache Redis**: Sessões são cacheadas no Redis com TTL de 5 minutos
- **Dark Theme**: Interface escura para melhor experiência visual
- **Observability**: Integração com sistema de logs existente

## Arquitetura

```
~/.local/share/opencode/storage/
├── session/           # Arquivos de metadados das sessões
├── message/           # Arquivos de metadados das mensagens
└── part/              # Conteúdo das mensagens (texto, reasoning, etc.)

Backend (Porta 3000)
├── Express.js         # API REST
├── ioredis           # Cache Redis
└── Pino              # Logging estruturado

Frontend (Porta 5173)
├── React 18           # UI
├── Tailwind CSS     # Estilização
└── TanStack Query   # Gerenciamento de estado
```

## Configuração

### Backend

```bash
cd backend
npm install

# Criar .env baseado em .env.example
cp .env.example .env

# Iniciar servidor Redis (se necessário)
redis-server --port 6379

# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm install

# Desenvolvimento
npm run dev

# Produção
npm run build
```

### Variáveis de Ambiente

**Backend** (`backend/.env`):
```
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
STORAGE_PATH=/root/.local/share/opencode/storage
CACHE_TTL_SECONDS=300
OBSERVABILITY_URL=http://localhost:8080/logs
TASK_TRACKING_URL=http://localhost:8080/tasks
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3000
```

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/sessions` | Lista todas as sessões (suporta `?project=` e `?status=`) |
| GET | `/api/sessions/:id` | Detalhes de uma sessão com mensagens |
| GET | `/api/projects` | Lista todos os projetos |
| POST | `/api/refresh` | Invalida cache e recarrega sessões |
| GET | `/api/health` | Status de saúde do sistema |
| POST | `/api/errors` | Reporta erros do frontend |

## Desenvolvimento

### Instalação de Dependências

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Executar Testes

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run test
```

### Verificar Estilo de Código

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

## Deploy

### Docker

```bash
# Backend
cd backend
docker build -t openclaw-observability-backend .
docker run -p 3000:3000 openclaw-observability-backend

# Frontend
cd frontend
docker build -t openclaw-observability-frontend .
docker run -p 5173:80 openclaw-observability-frontend
```

### Variáveis de Produção

```bash
# backend/.env.production
PORT=3000
NODE_ENV=production
REDIS_HOST=redis.internal.company.com
REDIS_PORT=6379
STORAGE_PATH=/root/.local/share/opencode/storage
CACHE_TTL_SECONDS=300
OBSERVABILITY_URL=https://logs.company.com/api
TASK_TRACKING_URL=https://tasks.company.com/api

# frontend/.env.production
VITE_API_URL=http://76.13.101.17:3000
```

## Licença

MIT
