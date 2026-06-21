#!/usr/bin/env bash
# End-to-end flow: login -> catalog -> search narrows the result set.
# Prereqs: API on :7800, web on :7801, chromium installed (see e2e/README.md).
set -euo pipefail

export PLAYWRIGHT_CLI_SESSION="workshop-e2e-search"
PW="npx playwright-cli"
WEB="http://localhost:7801"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; $PW close >/dev/null 2>&1 || true; exit 1; }
count_products() { grep -ciE "In Stock|Low Stock|Out of Stock" <<<"$1" || true; }

echo "▸ e2e: login -> search narrows results"

$PW open "$WEB" >/dev/null
$PW click "getByRole('button', { name: 'Sign in' })" >/dev/null
sleep 1
BEFORE_SNAP="$($PW snapshot)"
BEFORE="$(count_products "$BEFORE_SNAP")"
[ "$BEFORE" -gt 1 ] || fail "catalog did not render multiple products (got $BEFORE)"
pass "catalog shows $BEFORE products"

# Search for a specific term.
$PW fill "getByTestId('search-input')" "mascara" >/dev/null
sleep 1
AFTER_SNAP="$($PW snapshot)"
AFTER="$(count_products "$AFTER_SNAP")"
grep -qi "mascara" <<<"$AFTER_SNAP" || fail "expected a mascara product in results"
[ "$AFTER" -lt "$BEFORE" ] || fail "search did not narrow results ($AFTER >= $BEFORE)"
pass "search narrowed $BEFORE -> $AFTER and matched 'mascara'"

$PW close >/dev/null 2>&1 || true
echo "✓ search-filter e2e flow passed"
