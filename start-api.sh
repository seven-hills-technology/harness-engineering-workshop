#!/usr/bin/env bash
# Start the NestJS API (http://localhost:8010). macOS / Linux shortcut.
# Cross-platform logic lives in scripts/start.mjs (also: `npm run start:api`).
cd "$(dirname "${BASH_SOURCE[0]}")"
exec npm run start:api
