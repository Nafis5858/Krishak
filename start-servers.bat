@echo off
cd /d f:\Krishak-main\backend
start "Backend Server" cmd /k npm run dev

timeout /t 3

cd /d f:\Krishak-main\frontend
start "Frontend Server" cmd /k npm run dev

echo Servers started in separate windows
