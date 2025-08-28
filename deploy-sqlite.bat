@echo off
echo 🚂 Railway SQLite Deployment Script
echo ====================================
echo.

echo 📋 Checking current status...
git status

echo.
echo 🔧 Committing SQLite restoration...
git add .
git commit -m "Restore working SQLite deployment - Remove PostgreSQL complexity"

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
echo 🎯 Monitor the deployment in Railway dashboard
echo.
pause
