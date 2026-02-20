@echo off
title Competitor Intel Dashboard
echo Starting Competitor Intel Dashboard...
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Check if database exists
if not exist "db\intel.db" (
    echo Setting up database...
    npm run seed
)

echo.
echo Dashboard starting at http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

:: Start the dev server and open browser
start http://localhost:3000
npm run dev
