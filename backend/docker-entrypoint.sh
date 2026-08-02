#!/bin/sh
# =============================================================================
# MedLink B2B – Backend entrypoint
# Waits for PostgreSQL, runs migrations (optional), starts the API server
# =============================================================================
set -e

SCHEMA_PATH="backend/prisma/schema.prisma"

echo "[entrypoint] Waiting for database..."

# Simple wait loop – replace with wait-for-it or dockerize in production if needed
RETRIES=30
until node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => { prisma.\$disconnect(); process.exit(0); })
  .catch(() => process.exit(1));
" 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    echo "[entrypoint] ERROR: Database not reachable after 30 attempts"
    exit 1
  fi
  echo "[entrypoint] Database not ready – retrying in 2s..."
  sleep 2
done

echo "[entrypoint] Database is ready"

# Run Prisma migrations when enabled (default: true in production)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running Prisma migrations..."
  npx prisma migrate deploy --schema="$SCHEMA_PATH"
  echo "[entrypoint] Migrations complete"
fi

# Optional seed (development only)
if [ "${RUN_SEED:-false}" = "true" ] && [ "${NODE_ENV}" != "production" ]; then
  echo "[entrypoint] Seeding database..."
  node backend/prisma/seed.js 2>/dev/null || echo "[entrypoint] Seed skipped (run manually in dev)"
fi

echo "[entrypoint] Starting MedLink B2B API server..."
exec node backend/dist/server.js
