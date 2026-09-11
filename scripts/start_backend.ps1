# Start MEDINTEL AI FastAPI Backend Server
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting MEDINTEL AI Backend (FastAPI)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$env:KMP_DUPLICATE_LIB_OK = "TRUE"
$env:OMP_NUM_THREADS = "1"
$env:PYTHONPATH = (Resolve-Path "$PSScriptRoot\..").Path

$pythonPath = "C:\Users\VAISHNAVI\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if (-not (Test-Path $pythonPath)) {
    $pythonPath = "python"
}

Write-Host "Python: $pythonPath" -ForegroundColor Gray
Write-Host "Server listening at http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Swagger Docs at http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to terminate.`n" -ForegroundColor Gray

& $pythonPath -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
