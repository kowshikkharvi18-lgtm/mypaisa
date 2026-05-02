@echo off
title MyPaisa Launcher
color 0A

echo.
echo  ============================================
echo    MyPaisa - Budget Planner
echo  ============================================
echo.

set ROOT=%~dp0

:: ── Kill any process already using port 5000 ───────────────────────────────
echo  Checking port 5000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    echo  Killing old process on port 5000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

:: ── Kill any process already using port 5173 ───────────────────────────────
echo  Checking port 5173...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo  Killing old process on port 5173 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

:: ── Install server deps if needed ──────────────────────────────────────────
if not exist "%ROOT%server\node_modules" (
    echo  Installing server packages... (first time only)
    pushd "%ROOT%server"
    call npm install
    popd
    echo.
)

:: ── Install client deps if needed ──────────────────────────────────────────
if not exist "%ROOT%client\node_modules" (
    echo  Installing client packages... (first time only)
    pushd "%ROOT%client"
    call npm install
    popd
    echo.
)

echo.
echo  Starting backend  ^>  http://localhost:5000
echo  Starting frontend ^>  http://localhost:5173
echo.
echo  Press any key to launch...
pause >nul

:: ── Start backend ──────────────────────────────────────────────────────────
start "MyPaisa Backend" cmd /k "title MyPaisa Backend && color 0B && cd /d %ROOT%server && npm run dev"

:: ── Wait 3s then start frontend ────────────────────────────────────────────
timeout /t 3 /nobreak >nul

start "MyPaisa Frontend" cmd /k "title MyPaisa Frontend && color 0E && cd /d %ROOT%client && npm run dev"

:: ── Wait for Vite to start then open browser ───────────────────────────────
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo  App is running! Browser opened automatically.
echo  Close this window anytime.
echo.
pause
