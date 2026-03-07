@echo off
title African Interior Designer - Demarrage
color 0A

echo.
echo  =========================================
echo    African Interior Designer
echo    Demarrage de l'application...
echo  =========================================
echo.

echo [1/3] Liberation des ports 3000 et 5000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo     OK

echo [2/3] Demarrage du Backend (port 5000)...
start "Backend - African Interior" cmd /k "cd /d "e:\Africa Interior design\backend" && node server.js"
timeout /t 2 /nobreak >nul
echo     OK

echo [3/3] Demarrage du Frontend React (port 3000)...
start "Frontend - African Interior" cmd /k "cd /d "e:\Africa Interior design" && npm start"
echo     OK

echo.
echo  =========================================
echo    Application en cours de demarrage !
echo    Frontend : http://localhost:3000
echo    Backend  : http://localhost:5000
echo  =========================================
echo.
pause
