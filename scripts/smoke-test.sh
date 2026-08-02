#!/usr/bin/env bash
# Production smoke test — run against a live API (default: http://localhost:3000)
set -euo pipefail

BASE="${API_BASE:-http://localhost:3000}"
API="$BASE/api/v1"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "✓ $name"
    PASS=$((PASS + 1))
  else
    echo "✗ $name (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

get_token() {
  echo "$1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))"
}

echo "Smoke testing $BASE ..."
echo ""

check "Liveness /health" "200" "$(curl -sf -o /dev/null -w '%{http_code}' "$BASE/health")"
check "Readiness /api/v1/health" "200" "$(curl -sf -o /dev/null -w '%{http_code}' "$API/health")"

DB_STATUS=$(curl -sf "$API/health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('database',''))")
check "Database connected" "connected" "$DB_STATUS"

check "Public medicines" "200" "$(curl -sf -o /dev/null -w '%{http_code}' "$API/medicines")"
check "Public listings search" "200" "$(curl -sf -o /dev/null -w '%{http_code}' "$API/listings/search?page=1&limit=5")"

LOGIN=$(curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"buyer@pharmex.bd","password":"password123"}')
TOKEN=$(get_token "$LOGIN")
[ -n "$TOKEN" ] && check "Buyer login" "ok" "ok" || { check "Buyer login" "ok" "fail"; }

if [ -n "$TOKEN" ]; then
  AUTH="Authorization: Bearer $TOKEN"
  check "Auth profile" "200" "$(curl -sf -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/auth/me")"
  check "Cart" "200" "$(curl -sf -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/cart")"
fi

ADMIN_TOKEN=$(get_token "$(curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@pharmex.bd","password":"password123"}')")
if [ -n "$ADMIN_TOKEN" ]; then
  check "Admin dashboard" "200" "$(curl -sf -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ADMIN_TOKEN" "$API/admin/dashboard")"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
