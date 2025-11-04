@echo off
REM CVstomize Backend Deployment Script for Windows
REM Run this from Windows Command Prompt

echo ========================================
echo CVstomize Backend Deployment
echo ========================================
echo.

REM Set project
gcloud config set project cvstomize

REM Navigate to API directory via WSL path
echo Navigating to API directory...
cd /d \\wsl.localhost\Ubuntu\mnt\storage\shared_windows\Cvstomize\api
if errorlevel 1 (
    echo Failed to navigate to API directory via WSL path
    echo Trying alternative WSL path...
    cd /d \\wsl$\Ubuntu\mnt\storage\shared_windows\Cvstomize\api
    if errorlevel 1 (
        echo ERROR: Could not find project directory
        echo Please run this script from the Cvstomize directory
        pause
        exit /b 1
    )
)

echo Current directory: %CD%
echo.

REM Build Docker image
echo ========================================
echo Building Docker image...
echo ========================================
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deploying to Cloud Run...
echo ========================================
gcloud run deploy cvstomize-api --image gcr.io/cvstomize/cvstomize-api:latest --region us-central1 --platform managed --allow-unauthenticated --add-cloudsql-instances="cvstomize:us-central1:cvstomize-db" --set-secrets="DATABASE_URL=cvstomize-db-url:latest,GCP_PROJECT_ID=cvstomize-project-id:latest"
if errorlevel 1 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Fetching recent logs...
gcloud run services logs read cvstomize-api --limit=30

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Test the API: https://cvstomize-api-351889420459.us-central1.run.app/health
echo 2. Test auth: http://localhost:3010
echo 3. View logs: gcloud run services logs read cvstomize-api --limit=50
echo.
pause
