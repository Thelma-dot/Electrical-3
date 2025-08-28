@echo off
echo 🚂 Railway Deployment Script
echo ================================
echo.

echo 📋 Checking current status...
git status

echo.
echo 🔧 Committing Railway fixes...
git add .
git commit -m "Fix Railway deployment with PostgreSQL support - Updated server and database setup"

echo.
echo 🚀 Pushing to Railway...
git push origin main

echo.
echo ✅ Deployment initiated!
echo.
echo 📍 Your Railway app will be available at:
echo    https://electrical-3-production.up.railway.app
echo.
echo 🔍 Check deployment status:
echo    railway logs
echo.
echo 🗄️ After deployment, run database setup:
echo    npm run setup-railway
echo.
echo 🎯 Monitor the deployment in Railway dashboard
echo.
pause
