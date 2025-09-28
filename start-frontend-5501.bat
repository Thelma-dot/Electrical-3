@echo off
echo Starting Electrical Management System Frontend on Port 5501...
echo.
echo This will start a local server for the frontend to avoid conflicts with other projects.
echo.
echo Frontend will be available at: http://localhost:5501
echo Backend should be running on: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

cd Frontend
python -m http.server 5501

pause
