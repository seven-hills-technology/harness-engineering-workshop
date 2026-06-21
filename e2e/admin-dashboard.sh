#!/usr/bin/env bash
# End-to-end flow: admin logs in -> opens the Admin Dashboard -> metrics render.
# Prereqs: API on :7800 (seeded order history), web on :7801, chromium installed.
set -euo pipefail

export PLAYWRIGHT_CLI_SESSION="workshop-e2e-admin"
PW="npx playwright-cli"
WEB="http://localhost:7801"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; $PW close >/dev/null 2>&1 || true; exit 1; }

echo "▸ e2e: admin -> dashboard"

# admin@test.com / password are pre-filled on the login form in dev.
$PW open "$WEB" >/dev/null
$PW click "getByRole('button', { name: 'Sign in' })" >/dev/null
sleep 1
$PW snapshot | grep -qi "Admin" || fail "Admin nav link not visible for admin user"
pass "admin nav link visible"

$PW click "getByRole('link', { name: 'Admin' })" >/dev/null
sleep 1
SNAP="$($PW snapshot)"
echo "$SNAP" | grep -qi "revenue"   || fail "revenue metric not rendered"
echo "$SNAP" | grep -qiE "low.?stock" || fail "low-stock section not rendered"
echo "$SNAP" | grep -qiE "top|status"  || fail "top-products/status section not rendered"
pass "dashboard rendered revenue + low-stock + breakdown"

$PW close >/dev/null 2>&1 || true
echo "✓ admin-dashboard e2e flow passed"
