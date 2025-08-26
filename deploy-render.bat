@echo off
echo ========================================
echo    Deploying to Render
echo ========================================
echo.

echo 1. Make sure you have Render CLI installed
echo    npm install -g @render/cli
echo.

echo 2. Login to Render
echo    render login
echo.

echo 3. Deploy your service
echo    render deploy
echo.

echo 4. Or deploy from Git (recommended)
echo    - Push your code to GitHub
echo    - Connect your repo to Render
echo    - Render will auto-deploy on push
echo.

echo ========================================
echo    Deployment Steps Complete!
echo ========================================
pause
