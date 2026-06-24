@echo off
REM Docker fallback: start API (http://localhost:8010) + web (http://localhost:9010)
REM in containers. Use when the native start won't build on your machine.
REM Requires Docker Desktop. Ctrl-C to stop; extra args pass through to compose.
cd /d "%~dp0"
docker compose up %*
