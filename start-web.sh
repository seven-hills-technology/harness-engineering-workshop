#!/usr/bin/env bash
#
# Start the React web app (http://localhost:9010).
# Self-contained launcher: runs from the repo root, verifies Node >= 22,
# and installs deps if missing. Start the API too (./start-api.sh) — the
# web app calls it at http://localhost:8010.
#
# Usage:  ./start-web.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node not found. Install Node >= 22 and try again." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "✗ Node >= 22 required (found $(node -v)). Switch your Node version and retry." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "▸ Installing dependencies (first run)…"
  npm install
fi

echo "▸ Starting web UI on http://localhost:9010  (Ctrl-C to stop)"
echo "  (make sure the API is running too: ./start-api.sh)"
exec npm run dev --workspace @workshop/web
