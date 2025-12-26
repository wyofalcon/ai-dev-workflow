@echo off
:: CVstomize - Toggle Start/Stop (Windows)
:: Double-click this to start or stop the dev environment

cd /d "%~dp0"

:: Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Docker not found!
    echo.
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

:: Check if containers are running
docker compose ps --status running 2>nul | findstr "cvstomize" >nul
if %errorlevel% == 0 (
    echo.
    echo Stopping CVstomize...
    docker compose down
    echo.
    echo Stopped!
) else (
    echo.
    echo Starting CVstomize...
    docker compose up -d
    echo.
    echo Started!
    echo.
    echo Frontend: http://localhost:3000
    echo Backend:  http://localhost:3001
)

echo.
pause
