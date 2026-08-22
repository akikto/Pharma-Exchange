#!/usr/bin/env bash
# =============================================================================
# Pharma-Exchange — Cloud Agent start (runs on every boot before terminals).
# Brings up PostgreSQL and reconciles the database. Dev servers run as
# terminals (see .cursor/environment.json).
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Ensure local dev env files exist (no-op if already present).
bash .cursor/write-env.sh

# Start PostgreSQL, provision, migrate, and seed-if-empty.
bash .cursor/db-setup.sh
