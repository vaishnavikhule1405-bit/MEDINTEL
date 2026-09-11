@echo off
title MEDINTEL AI - Unified Launcher
echo ==========================================================
echo  MEDINTEL AI: Multimodal Medical Decision Support System
echo ==========================================================
echo Starting Backend and Frontend services...

start "MEDINTEL Backend (FastAPI)" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0start_backend.ps1"
start "MEDINTEL Frontend (Vite)" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0start_frontend.ps1"

echo.
echo Both services are launching in separate windows:
echo - Backend API & Docs: http://127.0.0.1:8000/docs
echo - Frontend Dashboard: http://localhost:5173
echo.
pause
