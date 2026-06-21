@echo off
REM Start the NestJS API (http://localhost:8010). Windows shortcut.
REM Cross-platform logic lives in scripts/start.mjs (also: npm run start:api).
cd /d "%~dp0"
call npm run start:api %*
