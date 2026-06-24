#!/usr/bin/env bash
# Docker fallback: start the API (http://localhost:8010) and web app
# (http://localhost:9010) in containers. Use this when the native start
# (./start-api.sh / ./start-web.sh) won't build on your machine.
# Requires Docker Desktop. Ctrl-C to stop; extra args pass through to compose.
cd "$(dirname "${BASH_SOURCE[0]}")"
exec docker compose up "$@"
