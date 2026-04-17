#!/bin/sh
set -e

echo "=== Tanya's PA Starting ==="

# Sync database schema (idempotent — works with existing or empty databases)
echo "[1/3] Syncing database schema..."
cd /app/server
npx prisma db push --skip-generate 2>/dev/null || true

# Start Node.js server in background
echo "[2/3] Starting API server on port 3001..."
node dist/index.js &

# Wait for server to be ready
echo "[3/3] Waiting for API server..."
for i in $(seq 1 30); do
    if wget -q -O /dev/null http://127.0.0.1:3001/api/health 2>/dev/null; then
        echo "API server is ready!"
        break
    fi
    sleep 1
done

# Start nginx in foreground (this keeps the container alive)
echo "Starting nginx on port 80..."
nginx -g 'daemon off;'
