#!/usr/bin/env bash
# =============================================================================
# Pharma-Exchange — write local dev .env files (idempotent, never overwrites)
# These are gitignored; they hold non-secret local development defaults only.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f backend/.env ]; then
  cat > backend/.env <<'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://medlink:medlink@localhost:5432/medlink_b2b?schema=public
JWT_SECRET=dev-jwt-secret-min-32-characters-long-0123456789
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
EOF
  echo "    wrote backend/.env"
else
  echo "    backend/.env exists; leaving as-is"
fi

if [ ! -f frontend/.env ]; then
  cat > frontend/.env <<'EOF'
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=http://localhost:3000
EOF
  echo "    wrote frontend/.env"
else
  echo "    frontend/.env exists; leaving as-is"
fi
