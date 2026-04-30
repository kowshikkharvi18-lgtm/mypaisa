@echo off
title BudgetFlow Launcher
color 0A

echo.
echo  ============================================
echo    BudgetFlow - Premium Budget Planner
echo  ============================================
echo.

set ROOT=%~dp0

:: ── Install server deps if needed ──────────────────────────────────────────
if not exist "%ROOT%server\node_modules" (
    echo  [1/2] Installing server packages... (first time only)
    echo.
    pushd "%ROOT%server"
    call npm install
    popd
    echo.
)

:: ── Install client deps if needed ──────────────────────────────────────────
if not exist "%ROOT%client\node_modules" (
    echo  [2/2] Installing client packages... (first time only)
    echo.
    pushd "%ROOT%client"
    call npm install
    popd
    echo.
)

echo  Starting backend  ^>  http://localhost:5000
echo  Starting frontend ^>  http://localhost:5173
echo.
echo  Two windows will open. Keep both running.
echo  Press any key to launch...
pause >nul

:: ── Start backend ──────────────────────────────────────────────────────────
start "BudgetFlow - Backend (keep open)" cmd /k "title BudgetFlow Backend && color 0B && echo. && echo  Backend running at http://localhost:5000 && echo  Press Ctrl+C to stop && echo. && cd /d %ROOT%server && npm run dev"

:: ── Wait 3s then start frontend ────────────────────────────────────────────
timeout /t 3 /nobreak >nul

start "BudgetFlow - Frontend (keep open)" cmd /k "title BudgetFlow Frontend && color 0E && echo. && echo  Frontend running at http://localhost:5173 && echo  Press Ctrl+C to stop && echo. && cd /d %ROOT%client && npm run dev"

:: ── Wait for Vite to start then open browser ───────────────────────────────
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo  App is running! Browser should open automatically.
echo  Close this window anytime - the two server windows keep it alive.
echo.
pause
