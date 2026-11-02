# DreamsGuider Launch Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      DreamsGuider Course Platform      " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Starting DreamsGuider Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting DreamsGuider Frontend App (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`n✅ DreamsGuider is launching!" -ForegroundColor Cyan
Write-Host "👉 Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "👉 Frontend Web: http://localhost:5173" -ForegroundColor White
Write-Host "`nDemo Accounts available on the login screen:" -ForegroundColor Yellow
Write-Host " - Admin:   admin@dreamsguider.com / admin123" -ForegroundColor Gray
Write-Host " - Student: rahul@gmail.com / student123" -ForegroundColor Gray
