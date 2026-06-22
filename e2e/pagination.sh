#!/usr/bin/env bash
# End-to-end flow: login -> catalog -> pager advances to the next page of products.
# Prereqs: API on :8010, web on :9010, chromium installed (see e2e/README.md).
set -euo pipefail

export PLAYWRIGHT_CLI_SESSION="workshop-e2e-pagination"
PW="npx playwright-cli"
WEB="http://localhost:9010"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; $PW close >/dev/null 2>&1 || true; exit 1; }
first_product() { grep -m1 -oE "^[[:space:]]*-?[[:space:]]*[A-Za-z].*" <<<"$1" || true; }

echo "▸ e2e: login -> pager advances to page 2"

$PW open "$WEB" >/dev/null
$PW click "getByRole('button', { name: 'Sign in' })" >/dev/null
sleep 1

PAGE1_SNAP="$($PW snapshot)"
grep -qi "Page 1 of" <<<"$PAGE1_SNAP" || fail "expected 'Page 1 of N' indicator on the catalog (need >24 products to paginate)"
grep -qiE "Showing 1.*of" <<<"$PAGE1_SNAP" || fail "expected result-count summary 'Showing 1–… of N'"
pass "page 1 rendered with pager and summary"

# Advance to the next page.
$PW click "getByTestId('pagination-next')" >/dev/null
sleep 1
PAGE2_SNAP="$($PW snapshot)"
grep -qi "Page 2 of" <<<"$PAGE2_SNAP" || fail "pager did not advance to 'Page 2 of N'"
grep -qiE "Showing 25.*of" <<<"$PAGE2_SNAP" || fail "summary did not advance to 'Showing 25–… of N'"
[ "$PAGE1_SNAP" != "$PAGE2_SNAP" ] || fail "product set did not change between page 1 and page 2"
pass "advanced to page 2 and the product set changed"

# Prev returns to page 1.
$PW click "getByTestId('pagination-prev')" >/dev/null
sleep 1
BACK_SNAP="$($PW snapshot)"
grep -qi "Page 1 of" <<<"$BACK_SNAP" || fail "Prev did not return to 'Page 1 of N'"
pass "Prev returned to page 1"

$PW close >/dev/null 2>&1 || true
echo "✓ pagination e2e flow passed"
