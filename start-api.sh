#!/usr/bin/env bash
#
# Start the NestJS API (http://localhost:8010).
# Self-contained launcher that avoids cross-machine Node/arch pitfalls:
#   - runs from the repo root regardless of where you invoke it
#   - verifies Node >= 22
#   - installs deps if missing
#   - rebuilds the better-sqlite3 native binary if it doesn't match this Node
#     (the usual cause of "incompatible architecture" errors on mixed Node installs)
#
# Usage:  ./start-api.sh
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

# Ensure the better-sqlite3 native addon matches the Node currently on PATH.
if ! node -e "require('better-sqlite3')" >/dev/null 2>&1; then
  echo "▸ Rebuilding better-sqlite3 for this Node ($(node -v), $(node -p process.arch))…"
  npm rebuild better-sqlite3 >/dev/null 2>&1 || npm rebuild better-sqlite3 --build-from-source
fi

echo "▸ Starting API on http://localhost:8010  (Ctrl-C to stop)"
exec npm run dev --workspace @workshop/api
