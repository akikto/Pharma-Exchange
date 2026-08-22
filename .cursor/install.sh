#!/usr/bin/env bash
# =============================================================================
# Pharma-Exchange — Cloud Agent install (idempotent, runs after checkout)
# Prepares durable state: system packages, Node deps, dev env files, database.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> [install] PostgreSQL 16"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    postgresql postgresql-contrib
else
  echo "    PostgreSQL already installed; skipping apt."
fi

echo "==> [install] Node dependencies (npm ci, workspaces)"
npm ci

echo "==> [install] Prisma client"
npm run db:generate

echo "==> [install] Local dev env files"
bash .cursor/write-env.sh

echo "==> [install] Database (start, provision, migrate, seed)"
bash .cursor/db-setup.sh

echo "==> [install] Done."
