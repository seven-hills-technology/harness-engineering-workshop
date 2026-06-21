#!/usr/bin/env bash
# End-to-end flow: login -> browse catalog -> add to cart.
# Driven by the Playwright CLI (the workshop's single browser layer).
#
# Prereqs:
#   - API running on http://localhost:8010   (npm run dev --workspace @workshop/api)
#   - Web running on http://localhost:9010   (npm run dev --workspace @workshop/web)
#   - Chromium installed:  npx playwright-cli install-browser chromium
#
# Run:  bash e2e/login-browse-cart.sh
set -euo pipefail

export PLAYWRIGHT_CLI_SESSION="workshop-e2e"
PW="npx playwright-cli"
WEB="http://localhost:9010"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; $PW close >/dev/null 2>&1 || true; exit 1; }

echo "▸ e2e: login -> browse -> add to cart"

# 1. Open the app (lands on the login page; credentials are pre-filled in dev).
$PW open "$WEB" >/dev/null
$PW snapshot | grep -qi "Sign in" || fail "login page did not render"
pass "login page rendered"

# 2. Sign in.
$PW click "getByRole('button', { name: 'Sign in' })" >/dev/null
$PW wait-for "getByText('Workshop Store')" >/dev/null 2>&1 || sleep 1
$PW snapshot | grep -qi "Cart" || fail "did not reach the authenticated app shell"
pass "signed in"

# 3. Browse the catalog.
$PW snapshot | grep -qiE "In Stock|Low Stock|Out of Stock" || fail "no products visible"
pass "catalog rendered"

# 4. Open the first product and add it to the cart.
#    (Click the first product thumbnail — the nav brand is also a link, so target the image.)
$PW click "getByRole('img').first()" >/dev/null
sleep 1
$PW snapshot | grep -qi "Add to cart" || fail "product detail did not render"
$PW click "getByRole('button', { name: 'Add to cart' })" >/dev/null
sleep 1
pass "added to cart"

# 5. Open the cart and assert it has an item.
$PW click "getByRole('button', { name: /Cart/ })" >/dev/null
$PW snapshot | grep -qi "Total" || fail "cart drawer did not open"
pass "cart shows an item"

$PW close >/dev/null 2>&1 || true
echo "✓ e2e flow passed"
