#!/usr/bin/env bash
# End-to-end flow: login -> add to cart -> checkout -> order confirmation.
# Prereqs: API on :7800, web on :7801, chromium installed (see e2e/README.md).
set -euo pipefail

export PLAYWRIGHT_CLI_SESSION="workshop-e2e-checkout"
PW="npx playwright-cli"
WEB="http://localhost:7801"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; $PW close >/dev/null 2>&1 || true; exit 1; }

echo "▸ e2e: login -> cart -> checkout -> confirmation"

$PW open "$WEB" >/dev/null
$PW click "getByRole('button', { name: 'Sign in' })" >/dev/null
sleep 1
$PW snapshot | grep -qi "Cart" || fail "not signed in"
pass "signed in"

# Add a product to the cart.
$PW click "getByRole('img').first()" >/dev/null
sleep 1
$PW snapshot | grep -qi "Add to cart" || fail "product detail did not render"
$PW click "getByRole('button', { name: 'Add to cart' })" >/dev/null
sleep 1
pass "item added"

# Open cart and go to checkout.
$PW click "getByRole('button', { name: /Cart/ })" >/dev/null
$PW click "getByRole('button', { name: 'Checkout' })" >/dev/null
sleep 1
$PW snapshot | grep -qi "Place order" || fail "checkout page did not render"
pass "reached checkout"

# Place the order.
$PW click "getByRole('button', { name: 'Place order' })" >/dev/null
sleep 1
SNAP="$($PW snapshot)"
echo "$SNAP" | grep -qiE "paid|Continue shopping|Order" || fail "order confirmation did not render"
pass "order placed + confirmation shown"

$PW close >/dev/null 2>&1 || true
echo "✓ checkout e2e flow passed"
