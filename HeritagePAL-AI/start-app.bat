@echo off
echo Starting HeritagePAL-AI application...

echo Starting backend server...
start cmd /k "cd backend && npm run dev"

echo Starting frontend server...
start cmd /k "cd frontend && npm run dev"

echo Both servers are now running!
echo Backend: http://localhost:3080
echo Frontend: http://localhost:3050
echo.
echo Press any key to stop both servers...
pause

echo Stopping servers...
taskkill /f /im node.exe

echo Application stopped. 