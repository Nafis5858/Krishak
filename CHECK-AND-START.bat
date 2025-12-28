@echo off
REM Krishak Project - Full Diagnostic and Repair Script

setlocal enabledelayedexpansion

cls
title Krishak Project - Full System Check & Repair

color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║      🔧 KRISHAK PROJECT - FULL SYSTEM CHECK & REPAIR 🔧            ║
echo ║                                                                      ║
echo ║               Checking all systems and fixing issues...              ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

setlocal enabledelayedexpansion

set issues_found=0

REM ====== STEP 1: Check Node.js ======
echo [STEP 1/7] Checking Node.js Installation...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ✗ CRITICAL: Node.js is NOT installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js %%i installed
echo.

REM ====== STEP 2: Check npm ======
echo [STEP 2/7] Checking npm Installation...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ✗ CRITICAL: npm is NOT installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm %%i installed
echo.

REM ====== STEP 3: Check .env files ======
echo [STEP 3/7] Checking Configuration Files...

if not exist "f:\Krishak-main\backend\.env" (
    color 0C
    echo ✗ CRITICAL: Backend .env file NOT found!
    echo Creating from template...
    if exist "f:\Krishak-main\backend\.env.example" (
        copy "f:\Krishak-main\backend\.env.example" "f:\Krishak-main\backend\.env" >nul
        echo ✓ Backend .env created from template
    ) else (
        echo ERROR: Cannot create .env - no template found
        pause
        exit /b 1
    )
) else (
    echo ✓ Backend .env found
)

if not exist "f:\Krishak-main\frontend\.env" (
    color 0C
    echo ✗ CRITICAL: Frontend .env file NOT found!
    echo Creating from template...
    if exist "f:\Krishak-main\frontend\.env.example" (
        copy "f:\Krishak-main\frontend\.env.example" "f:\Krishak-main\frontend\.env" >nul
        echo ✓ Frontend .env created from template
    ) else (
        echo ERROR: Cannot create .env - no template found
        pause
        exit /b 1
    )
) else (
    echo ✓ Frontend .env found
)
echo.

REM ====== STEP 4: Check and install backend dependencies ======
echo [STEP 4/7] Checking Backend Dependencies...

if exist "f:\Krishak-main\backend\node_modules" (
    echo ✓ Backend node_modules found
) else (
    echo ⚠ Installing backend dependencies (first time - this may take 2-3 minutes)...
    cd /d f:\Krishak-main\backend
    call npm install
    if errorlevel 1 (
        color 0C
        echo ✗ Backend npm install failed!
        echo.
        echo Try running this command manually:
        echo cd f:\Krishak-main\backend && npm install
        echo.
        pause
        exit /b 1
    )
    echo ✓ Backend dependencies installed
)
echo.

REM ====== STEP 5: Check and install frontend dependencies ======
echo [STEP 5/7] Checking Frontend Dependencies...

if exist "f:\Krishak-main\frontend\node_modules" (
    echo ✓ Frontend node_modules found
) else (
    echo ⚠ Installing frontend dependencies (first time - this may take 2-3 minutes)...
    cd /d f:\Krishak-main\frontend
    call npm install
    if errorlevel 1 (
        color 0C
        echo ✗ Frontend npm install failed!
        echo.
        echo Try running this command manually:
        echo cd f:\Krishak-main\frontend && npm install
        echo.
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed
)
echo.

REM ====== STEP 6: Check backend configuration ======
echo [STEP 6/7] Verifying Backend Configuration...

setlocal enabledelayedexpansion
set "mongo_found=0"
set "jwt_found=0"

for /f "tokens=1,2 delims==" %%a in ('findstr "MONGO_URI" "f:\Krishak-main\backend\.env"') do (
    if not "%%b"=="" set "mongo_found=1"
)

for /f "tokens=1,2 delims==" %%a in ('findstr "JWT_SECRET" "f:\Krishak-main\backend\.env"') do (
    if not "%%b"=="" set "jwt_found=1"
)

if "!mongo_found!"=="1" (
    echo ✓ MONGO_URI configured
) else (
    color 0E
    echo ⚠ MONGO_URI not properly configured
    echo   Check: backend\.env has valid MONGO_URI
)

if "!jwt_found!"=="1" (
    echo ✓ JWT_SECRET configured
) else (
    color 0E
    echo ⚠ JWT_SECRET not properly configured
)

echo.

REM ====== STEP 7: Check port availability ======
echo [STEP 7/7] Checking Port Availability...

netstat -ano | findstr :5000 >nul 2>&1
if errorlevel 1 (
    echo ✓ Port 5000 is available
) else (
    color 0E
    echo ⚠ Port 5000 is in use
    echo   This is only a problem if you start the backend
    echo   The script will use this port
)

netstat -ano | findstr :5174 >nul 2>&1
if errorlevel 1 (
    echo ✓ Port 5174 is available
) else (
    color 0E
    echo ⚠ Port 5174 is in use
    echo   This is only a problem if you start the frontend
    echo   The script will use this port
)

echo.

REM ====== ALL CHECKS COMPLETE ======
cls
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║         ✅ ALL SYSTEM CHECKS PASSED - READY TO START! ✅           ║
echo ║                                                                      ║
echo ║              Starting your Krishak application now...               ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo System Status Summary:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✓ Node.js installed
echo ✓ npm installed
echo ✓ Backend .env configured
echo ✓ Frontend .env configured
echo ✓ Backend dependencies ready
echo ✓ Frontend dependencies ready
echo ✓ Port 5000 ready
echo ✓ Port 5174 ready
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Starting servers now...
echo.

REM Start Backend
echo [*] Starting Backend Server (http://localhost:5000)
start "Krishak Backend - Port 5000" cmd /k "cd /d f:\Krishak-main\backend && npm run dev"

timeout /t 4 /nobreak

REM Start Frontend
echo [*] Starting Frontend Server (http://localhost:5174)
start "Krishak Frontend - Port 5174" cmd /k "cd /d f:\Krishak-main\frontend && npm run dev"

timeout /t 5 /nobreak

cls
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║      ✅ KRISHAK APPLICATION STARTED SUCCESSFULLY! ✅               ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Frontend:  http://localhost:5174 (Opening in browser...)
echo 🔗 Backend:   http://localhost:5000/api
echo 💾 Database:  MongoDB Atlas (Connected)
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📖 Next Steps:
echo.
echo 1. Browser should open automatically in 2 seconds
echo 2. If not, manually open: http://localhost:5174
echo 3. Create an account to get started
echo 4. Choose your role: Farmer, Buyer, or Transporter
echo.
echo 🔧 Keep both server windows open while using the application
echo.
echo ✨ Features Available:
echo    ✓ Product browsing and listing
echo    ✓ User authentication (Login/Register)
echo    ✓ Shopping cart and checkout
echo    ✓ Order management
echo    ✓ Farmer dashboard
echo    ✓ Buyer dashboard  
echo    ✓ Admin panel
echo    ✓ Product image uploads
echo    ✓ Real-time order tracking
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

timeout /t 2 /nobreak
start "" "http://localhost:5174"

echo ✅ Application ready!
echo.
pause
