#!/usr/bin/env bash
# =============================================================================
# Pharma-Exchange — start PostgreSQL, provision role/db, push schema, seed.
# Idempotent: safe to run on every boot. Seeds only when the DB is empty.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DB_USER="medlink"
DB_PASS="medlink"
DB_NAME="medlink_b2b"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"

echo "==> [db] Ensuring PostgreSQL cluster is running"
# Clear any stale pid from a previous snapshot boot, then (re)start the cluster.
sudo pg_ctlcluster 16 main start 2>/dev/null || true

echo "==> [db] Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
pg_isready -h localhost -p 5432

echo "==> [db] Ensuring role '${DB_USER}' and database '${DB_NAME}'"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}' SUPERUSER;"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"

echo "==> [db] Pushing Prisma schema"
( cd backend && DATABASE_URL="${DB_URL}" npx prisma db push --schema=prisma/schema.prisma --skip-generate )

echo "==> [db] Seeding (only if empty)"
USER_COUNT="$(PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -tAc 'SELECT COUNT(*) FROM "User";' 2>/dev/null || echo 0)"
if [ "${USER_COUNT:-0}" = "0" ]; then
  ( cd backend && NODE_ENV=development DATABASE_URL="${DB_URL}" npx tsx prisma/seed.ts )
else
  echo "    ${USER_COUNT} users present; skipping seed."
fi

echo "==> [db] Ready."
