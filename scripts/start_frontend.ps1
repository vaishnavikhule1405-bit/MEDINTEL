# Start MEDINTEL AI Vite Development Frontend
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting MEDINTEL AI Frontend (React + Vite)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$frontendDir = Join-Path (Resolve-Path "$PSScriptRoot\..").Path "frontend"
Set-Location $frontendDir

Write-Host "Vite dev server starting at http://localhost:5173" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to terminate.`n" -ForegroundColor Gray

cmd.exe /c npm run dev
