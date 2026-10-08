# Start MEDINTEL AI FastAPI Backend Server
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting MEDINTEL AI Backend (FastAPI)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$env:KMP_DUPLICATE_LIB_OK = "TRUE"
$env:OMP_NUM_THREADS = "1"
$env:PYTHONPATH = (Resolve-Path "$PSScriptRoot\..").Path

$pythonPath = & py -3.12 -c "import sys; print(sys.executable)" 2>$null
if (-not $pythonPath) {
    Write-Error "Python 3.12 is required. Install it with the backend dependencies, then run this script again."
    exit 1
}

& $pythonPath -c "import torch" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "PyTorch could not be imported by Python 3.12. Check the Python environment and Windows application-control policy."
    exit 1
}

Write-Host "Python: $pythonPath" -ForegroundColor Gray
Write-Host "Server listening at http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Swagger Docs at http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to terminate.`n" -ForegroundColor Gray

& $pythonPath -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
