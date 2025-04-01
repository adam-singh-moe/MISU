@echo off
echo HeritagePAL-AI Authentication Test Utility
echo =========================================
echo.
echo This script will:
echo 1. Start the backend server
echo 2. Start the frontend server
echo 3. Open the browser to the login page
echo.
echo Make sure you've done the database migration steps from DATABASE_MIGRATION.md!
echo.
pause

echo Starting backend server...
start cmd /k "cd backend && npm run dev"

echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start cmd /k "cd frontend && npm run dev"

echo Waiting for frontend to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

echo Opening admin login page in browser...
start http://localhost:3050

echo.
echo Test the authentication system by:
echo 1. Creating a new admin account (Registration tab)
echo 2. Logging in with your credentials (Login tab)
echo 3. Checking the backend console for detailed logs
echo.
echo Press any key to stop both servers...
pause

echo Stopping servers...
taskkill /f /im node.exe

echo Authentication test completed. 