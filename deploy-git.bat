@echo off
echo ========================================
echo    Git Deployment Commands
echo ========================================
echo.

echo Adding modified files...
git add Backend/app.js
git add render.yaml
git add Frontend/config.js

echo.
echo Committing changes...
git commit -m "Fix CORS configuration for Netlify frontend - Update backend URLs and CORS origins"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo    Deployment Complete!
echo ========================================
echo.
echo Render will automatically redeploy with the new CORS configuration.
echo Check your Render dashboard for deployment status.
echo.
pause
