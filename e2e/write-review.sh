#!/usr/bin/env bash
# End-to-end flow: login -> open product -> write a review -> see it listed.
# Prereqs: API on :7800, web on :7801, chromium installed (see e2e/README.md).
set -euo pipefail

export PLAYWRIGHT_CLI_SESSION="workshop-e2e-review"
PW="npx playwright-cli"
WEB="http://localhost:7801"
COMMENT="Workshop e2e review $(date +%s)"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; $PW close >/dev/null 2>&1 || true; exit 1; }

echo "▸ e2e: login -> product -> write review"

$PW open "$WEB" >/dev/null
$PW click "getByRole('button', { name: 'Sign in' })" >/dev/null
sleep 1
$PW click "getByRole('img').first()" >/dev/null
sleep 1
$PW snapshot | grep -qi "Write a review" || fail "review form not present"
pass "review form rendered"

$PW fill "getByTestId('review-comment')" "$COMMENT" >/dev/null
$PW click "getByTestId('review-submit')" >/dev/null
sleep 1
$PW snapshot | grep -qF "$COMMENT" || fail "new review did not appear in the list"
pass "review submitted and listed"

$PW close >/dev/null 2>&1 || true
echo "✓ write-review e2e flow passed"
