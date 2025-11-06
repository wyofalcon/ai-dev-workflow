@echo off
REM Grant Secret Manager permissions to cvstomize-deployer service account
REM Run this from Windows with YOUR user account (owner access)

echo ============================================
echo CVstomize - Grant Secret Manager Permissions
echo ============================================
echo.

REM Check current account
echo Checking current authentication...
gcloud config get-value account
echo.

echo This will grant the following permissions to:
echo   cvstomize-deployer@cvstomize.iam.gserviceaccount.com
echo.
echo Permissions:
echo   - roles/secretmanager.admin (create/manage secrets)
echo   - roles/secretmanager.secretAccessor (read secrets)
echo.
pause

echo.
echo [1/2] Granting Secret Manager Admin role...
gcloud projects add-iam-policy-binding cvstomize ^
  --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" ^
  --role="roles/secretmanager.admin"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to grant Secret Manager Admin role
    echo Make sure you are authenticated as a project owner
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Granting Secret Accessor role...
gcloud projects add-iam-policy-binding cvstomize ^
  --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" ^
  --role="roles/secretmanager.secretAccessor"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to grant Secret Accessor role
    pause
    exit /b 1
)

echo.
echo ============================================
echo SUCCESS! Permissions granted
echo ============================================
echo.
echo The service account can now:
echo   - Create secrets in Secret Manager
echo   - Read secrets for Cloud Run deployment
echo   - Manage secret versions
echo.
echo Next steps:
echo   1. Return to Linux/Claude Code session
echo   2. Run the secret creation commands
echo   3. Deploy the Gemini fix
echo.
pause
