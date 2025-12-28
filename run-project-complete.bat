@echo off
REM Krishak Project - Complete Startup Script

echo.
echo ======================================
echo   KRISHAK PROJECT - STARTUP SCRIPT
echo ======================================
echo.

REM Check if node_modules exists in backend, if not install
if not exist "f:\Krishak-main\backend\node_modules" (
    echo [1/4] Installing Backend Dependencies...
    cd /d f:\Krishak-main\backend
    call npm install
    if errorlevel 1 (
        echo ERROR: Backend npm install failed
        pause
        exit /b 1
    )
    echo ✓ Backend dependencies installed
) else (
    echo [1/4] Backend dependencies already installed
)

REM Check if node_modules exists in frontend, if not install
if not exist "f:\Krishak-main\frontend\node_modules" (
    echo [2/4] Installing Frontend Dependencies...
    cd /d f:\Krishak-main\frontend
    call npm install
    if errorlevel 1 (
        echo ERROR: Frontend npm install failed
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed
) else (
    echo [2/4] Frontend dependencies already installed
)

echo.
echo [3/4] Verifying .env files...

REM Check backend .env
if not exist "f:\Krishak-main\backend\.env" (
    echo ERROR: Backend .env file not found
    pause
    exit /b 1
) else (
    echo ✓ Backend .env exists
)

REM Check frontend .env
if not exist "f:\Krishak-main\frontend\.env" (
    echo ERROR: Frontend .env file not found
    pause
    exit /b 1
) else (
    echo ✓ Frontend .env exists
)

echo.
echo [4/4] Starting Servers...
echo ======================================
echo.

REM Start Backend Server
echo Starting BACKEND SERVER (http://localhost:5000)...
start "Krishak Backend" cmd /k "cd /d f:\Krishak-main\backend && npm run dev"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak

REM Start Frontend Server
echo Starting FRONTEND SERVER (http://localhost:5174)...
start "Krishak Frontend" cmd /k "cd /d f:\Krishak-main\frontend && npm run dev"

echo.
echo ======================================
echo   SERVERS STARTED SUCCESSFULLY!
echo ======================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5174
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak

REM Open browser to frontend
start "" "http://localhost:5174"

echo.
echo Done! Both servers are running.
echo Press Ctrl+C in each window to stop the servers.
pause
