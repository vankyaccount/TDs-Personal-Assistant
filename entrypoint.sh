#!/bin/sh
set -e

echo "=== Tanya's PA Starting ==="

# Sync database schema (idempotent — works with existing or empty databases)
echo "[1/2] Syncing database schema..."
cd /app/server
npx prisma db push --skip-generate 2>/dev/null || true

# Start Node.js server (serves both API and React static files)
echo "[2/2] Starting server..."
exec node dist/index.js
