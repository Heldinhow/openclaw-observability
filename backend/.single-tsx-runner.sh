#!/bin/bash
# Ensure only one tsx watch process runs for the backend

PROJECT_DIR="/root/.openclaw/workspace/projects/openclaw-observability/backend"
LOG_FILE="/tmp/tsx-backend.log"

# Kill existing tsx watch processes
pkill -f "tsx watch src/index.ts" 2>/dev/null

# Wait a moment for processes to die
sleep 1

# Start fresh instance
cd "$PROJECT_DIR"
nohup ./node_modules/.bin/tsx watch src/index.ts > "$LOG_FILE" 2>&1 &

echo "tsx watch started at $(date)" | tee -a "$LOG_FILE"
