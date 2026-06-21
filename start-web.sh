#!/usr/bin/env bash
# Start the React web app (http://localhost:9010). macOS / Linux shortcut.
# Cross-platform logic lives in scripts/start.mjs (also: `npm run start:web`).
# Start the API too (./start-api.sh); the web app calls it at http://localhost:8010.
cd "$(dirname "${BASH_SOURCE[0]}")"
exec npm run start:web
