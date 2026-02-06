# OpenClaw Observability Dashboard

Dashboard para visualizacao e monitoramento de sessoes do OpenCode CLI, com logs em tempo real via SSE.

## Funcionalidades

- **Lista de Sessoes**: Grid de cards com todas as sessoes do OpenCode, com filtros por projeto e status
- **Detalhes da Sessao**: Painel lateral com historico completo de conversas (usuario/agente)
- **Logs em Tempo Real**: Stream de logs via SSE com filtros por nivel, busca textual e indicador de frequencia (logs/s)
- **Discovery Dual**: Escaneia sessoes JSONL (`projects/*/.opencode/sessions/*.jsonl`) e storage original do OpenCode
- **Redis Opcional**: Cache Redis com fallback automatico para cache em memoria
- **Tema NexusAI**: Interface glassmorphism escura com acentos neon (cyan/purple)

## Arquitetura

```
Backend (Express, porta 3000)
├── Discovery: escaneia JSONL + storage original, merge por ID
├── Cache: Redis (se disponivel) ou in-memory fallback
├── API REST: sessoes, logs, health
└── SSE: stream de logs em tempo real

Frontend (React + Vite, porta 5173)
├── Dashboard: stats cards, tabs (Sessoes / Logs)
├── SessionTable: grid de cards com neon borders
├── SessionDetail: slide panel lateral com chat view
├── LogsTab: lista de logs filtrados, ordenados desc, com rate indicator
└── Proxy: /api/* -> localhost:3000

Fontes de dados
├── projects/*/.opencode/sessions/*.jsonl   (JSONL: header + messages)
└── ~/.local/share/opencode/storage/        (JSON: session/ message/ part/)
```

## Deploy (Quick Start)

### Pre-requisitos

- Node.js 20+
- npm

### 1. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar backend

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env` conforme necessario (ver secao Variaveis de Ambiente abaixo).

### 3. Subir os servicos

**Modo desenvolvimento (com watch/HMR):**

```bash
# Terminal 1 - Backend (porta 3000)
cd backend
npx tsx watch src/index.ts

# Terminal 2 - Frontend (porta 5173)
cd frontend
npx vite
```

**Modo background (servidor remoto):**

```bash
# Backend
cd backend
nohup npx tsx watch src/index.ts > /tmp/backend.log 2>&1 &

# Frontend
cd frontend
nohup npx vite > /tmp/frontend.log 2>&1 &
```

**Verificar se estao rodando:**

```bash
# Checar portas
lsof -i :3000 -i :5173

# Health check do backend
curl http://localhost:3000/api/health

# Testar frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
```

### 4. Parar os servicos

```bash
# Encontrar PIDs
lsof -i :3000 -i :5173

# Matar processos
kill <PID_BACKEND> <PID_FRONTEND>
```

### 5. Reiniciar servicos

```bash
# Matar processos antigos e subir novos
kill $(lsof -t -i :3000) $(lsof -t -i :5173) 2>/dev/null

cd backend && nohup npx tsx watch src/index.ts > /tmp/backend.log 2>&1 &
cd ../frontend && nohup npx vite > /tmp/frontend.log 2>&1 &
```

## Variaveis de Ambiente

### Backend (`backend/.env`)

| Variavel | Default | Descricao |
|----------|---------|-----------|
| `PORT` | `3000` | Porta do servidor Express |
| `NODE_ENV` | `development` | Ambiente (development/production) |
| `REDIS_ENABLED` | `true` | `false` para desabilitar Redis e usar cache em memoria |
| `REDIS_HOST` | `localhost` | Host do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `STORAGE_PATH` | `/root/.local/share/opencode/storage` | Caminho do storage original do OpenCode |
| `PROJECTS_SCAN_PATH` | `../projects` | Caminho para escanear sessoes JSONL (`*/.opencode/sessions/*.jsonl`) |
| `CACHE_TTL_SECONDS` | `300` | TTL do cache em segundos |

**Configuracao minima sem Redis:**

```env
PORT=3000
NODE_ENV=development
REDIS_ENABLED=false
STORAGE_PATH=/root/.local/share/opencode/storage
PROJECTS_SCAN_PATH=/caminho/para/seus/projetos
CACHE_TTL_SECONDS=60
```

### Frontend

O frontend usa proxy do Vite para redirecionar `/api/*` para `http://localhost:3000`. Nao precisa de `.env` em desenvolvimento.

Para acessar de outra maquina, adicionar o hostname em `frontend/vite.config.ts`:

```ts
server: {
  allowedHosts: ['seu-hostname.exemplo.com'],
}
```

## Endpoints da API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/sessions` | Lista sessoes (suporta `?project=` e `?status=`) |
| GET | `/api/sessions/:id` | Detalhes de uma sessao com mensagens |
| GET | `/api/projects` | Lista projetos |
| POST | `/api/refresh` | Invalida cache e recarrega sessoes |
| GET | `/api/health` | Status do sistema (`healthy` ou `degraded`) |
| GET | `/api/logs` | Logs historicos (suporta `?limit=`) |
| GET | `/api/logs/stream` | Stream SSE de logs em tempo real |

## Formato JSONL de Sessoes

Cada arquivo `.jsonl` em `projects/<nome>/.opencode/sessions/` segue o formato:

```jsonl
{"type":"session","id":"session-001","title":"Setup Express API","version":"3","time":{"created":1770285600000,"updated":1770285735000}}
{"type":"message","id":"msg-001","sessionID":"session-001","role":"user","parts":[{"type":"text","text":"Configure o Express"}],"time":{"created":1770285601000}}
{"type":"message","id":"msg-002","sessionID":"session-001","role":"assistant","parts":[{"type":"text","text":"Pronto, Express configurado."}],"time":{"created":1770285650000}}
```

## Logs

Logs do backend ficam em `/tmp/backend.log` e do frontend em `/tmp/frontend.log` quando rodando em background.

```bash
# Acompanhar logs do backend em tempo real
tail -f /tmp/backend.log

# Acompanhar logs do frontend
tail -f /tmp/frontend.log
```

## Licenca

MIT
