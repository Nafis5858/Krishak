# PowerShell script to start both servers

Write-Host "Starting Krishak servers..." -ForegroundColor Green

# Start Backend
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k cd f:\Krishak-main\backend && npm run dev" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server (Port 5174)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k cd f:\Krishak-main\frontend && npm run dev" -WindowStyle Normal

Write-Host "Both servers are starting in separate windows..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Cyan
