#!/bin/bash

# Auto-restart script para frontend OpenClaw Observability
# Verifica se o frontend está rodando e reinicia se necessário

FRONTEND_DIR="/root/.openclaw/workspace/projects/openclaw-observability/frontend"

# Verificar se o processo vite está rodando
if pgrep -f "vite preview --port 5173" > /dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Frontend está rodando. Nenhuma ação necessária."
    exit 0
fi

# Frontend não está rodando - reiniciar
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Frontend não está rodando! Reiniciando..."

cd "$FRONTEND_DIR"

# Matar processos antigos se existirem
pkill -f "vite preview --port 5173" 2>/dev/null
sleep 1

# Iniciar frontend
nohup npm run preview -- --port 5173 --host 0.0.0.0 > /tmp/frontend.log 2>&1 &

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Frontend reiniciado (PID: $!)"
