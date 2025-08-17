@echo off
echo Starting Electrical Management System...
echo.

echo Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd Backend && npm start"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server (Port 5500)...
start "Frontend Server" cmd /k "cd Frontend && python -m http.server 5500"

echo.
echo ========================================
echo Electrical Management System Started!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5500
echo.
echo Press any key to open the frontend in your browser...
pause > nul
start http://localhost:5500

