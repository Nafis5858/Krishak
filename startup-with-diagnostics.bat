@echo off
REM Krishak Project - Diagnostic and Setup Script

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   KRISHAK PROJECT - DIAGNOSTIC CHECK
echo ==========================================
echo.

REM Check Node.js installation
echo [CHECK 1] Verifying Node.js Installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js is NOT installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js %%i installed
)

echo.

REM Check npm installation
echo [CHECK 2] Verifying npm Installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm is NOT installed
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm %%i installed
)

echo.

REM Check backend .env
echo [CHECK 3] Checking Backend Configuration...
if not exist "f:\Krishak-main\backend\.env" (
    echo ✗ Backend .env file NOT found
    pause
    exit /b 1
) else (
    echo ✓ Backend .env exists
    for /f "tokens=1,2 delims==" %%a in ('findstr "MONGO_URI" "f:\Krishak-main\backend\.env"') do (
        if "%%b"=="" (
            echo ✗ MONGO_URI is empty
        ) else (
            echo ✓ MONGO_URI configured
        )
    )
    for /f "tokens=1,2 delims==" %%a in ('findstr "JWT_SECRET" "f:\Krishak-main\backend\.env"') do (
        if "%%b"=="" (
            echo ✗ JWT_SECRET is empty
        ) else (
            echo ✓ JWT_SECRET configured
        )
    )
)

echo.

REM Check frontend .env
echo [CHECK 4] Checking Frontend Configuration...
if not exist "f:\Krishak-main\frontend\.env" (
    echo ✗ Frontend .env file NOT found
    pause
    exit /b 1
) else (
    echo ✓ Frontend .env exists
    for /f "tokens=1,2 delims==" %%a in ('findstr "VITE_API_URL" "f:\Krishak-main\frontend\.env"') do (
        if "%%b"=="" (
            echo ✗ VITE_API_URL is empty
        ) else (
            echo ✓ VITE_API_URL configured
        )
    )
)

echo.

REM Check backend node_modules
echo [CHECK 5] Checking Backend Dependencies...
if not exist "f:\Krishak-main\backend\node_modules" (
    echo ✗ Backend node_modules NOT found - installing...
    cd /d f:\Krishak-main\backend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ✗ Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✓ Backend dependencies installed
) else (
    echo ✓ Backend dependencies present
)

echo.

REM Check frontend node_modules
echo [CHECK 6] Checking Frontend Dependencies...
if not exist "f:\Krishak-main\frontend\node_modules" (
    echo ✗ Frontend node_modules NOT found - installing...
    cd /d f:\Krishak-main\frontend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ✗ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed
) else (
    echo ✓ Frontend dependencies present
)

echo.
echo ==========================================
echo   ✓ ALL CHECKS PASSED - READY TO START!
echo ==========================================
echo.

echo Starting servers in 3 seconds...
timeout /t 3 /nobreak

REM Start servers
echo.
echo [STARTUP 1] Starting Backend Server...
start "Krishak Backend - Port 5000" cmd /k "cd /d f:\Krishak-main\backend && npm run dev"

timeout /t 3 /nobreak

echo [STARTUP 2] Starting Frontend Server...
start "Krishak Frontend - Port 5174" cmd /k "cd /d f:\Krishak-main\frontend && npm run dev"

timeout /t 5 /nobreak

echo.
echo ==========================================
echo   SERVERS STARTED!
echo ==========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5174
echo.
echo Opening application in browser...
timeout /t 2 /nobreak

start "" "http://localhost:5174"

echo.
echo ✓ Application is ready!
echo Keep both server windows open while using the application.
echo Close them to stop the servers.
echo.

pause
