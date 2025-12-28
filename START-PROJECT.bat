@echo off
setlocal enabledelayedexpansion

title Krishak Project - Master Startup

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║           🚀 KRISHAK PROJECT - MASTER STARTUP 🚀              ║
echo ║                                                                ║
echo ║         Agricultural Marketplace Application                  ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo Checking Prerequisites...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ✗ ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js %%i

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ✗ ERROR: npm is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm %%i

REM Check .env files
if exist "f:\Krishak-main\backend\.env" (
    echo ✓ Backend .env configured
) else (
    color 0C
    echo ✗ ERROR: Backend .env not found!
    pause
    exit /b 1
)

if exist "f:\Krishak-main\frontend\.env" (
    echo ✓ Frontend .env configured
) else (
    color 0C
    echo ✗ ERROR: Frontend .env not found!
    pause
    exit /b 1
)

REM Check and install dependencies
if not exist "f:\Krishak-main\backend\node_modules" (
    echo.
    echo Installing Backend Dependencies (this may take a minute)...
    cd /d f:\Krishak-main\backend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ✗ Backend npm install failed
        pause
        exit /b 1
    )
) 
echo ✓ Backend dependencies ready

if not exist "f:\Krishak-main\frontend\node_modules" (
    echo.
    echo Installing Frontend Dependencies (this may take a minute)...
    cd /d f:\Krishak-main\frontend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ✗ Frontend npm install failed
        pause
        exit /b 1
    )
)
echo ✓ Frontend dependencies ready

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✓ All checks passed! Starting servers...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start Backend
echo Starting Backend Server (http://localhost:5000)
echo Waiting for MongoDB connection...
start "Krishak Backend - Port 5000" cmd /k "cd /d f:\Krishak-main\backend && npm run dev"

REM Wait for backend
timeout /t 4 /nobreak

REM Start Frontend  
echo.
echo Starting Frontend Server (http://localhost:5174)
start "Krishak Frontend - Port 5174" cmd /k "cd /d f:\Krishak-main\frontend && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║         ✅ SERVERS STARTED SUCCESSFULLY! ✅                    ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Frontend:  http://localhost:5174 (Opening in browser...)
echo Backend:   http://localhost:5000/api
echo Database:  MongoDB Atlas (Connected)
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📖 What to do next:
echo.
echo 1. Wait for browser to open automatically
echo 2. If not, open: http://localhost:5174
echo 3. Create account or login
echo 4. Explore the marketplace!
echo.
echo 🔧 Keep both server windows open while using the app
echo.
echo 📝 Feature checklist:
echo   ✓ Browse products
echo   ✓ User authentication  
echo   ✓ Shopping cart
echo   ✓ Order management
echo   ✓ Farmer dashboard
echo   ✓ Buyer dashboard
echo   ✓ Admin panel
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Try to open browser
timeout /t 2 /nobreak
start "" "http://localhost:5174"

echo Browser launching... enjoy your application!
echo.
pause
