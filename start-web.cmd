@echo off
REM Start the React web app (http://localhost:9010). Windows shortcut.
REM Cross-platform logic lives in scripts/start.mjs (also: npm run start:web).
REM Start the API too (start-api.cmd); the web app calls it at http://localhost:8010.
cd /d "%~dp0"
call npm run start:web %*
