@echo off
echo 🚂 Railway Deployment Helper
echo ============================
echo.

echo 📦 Installing dependencies...
npm install

echo.
echo 🧪 Testing server locally...
echo Starting server on port 5000...
start /B npm start

echo.
echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 🔍 Testing endpoints...
echo Health check: http://localhost:5000/health
echo API test: http://localhost:5000/api/test

echo.
echo 📝 Next steps for Railway deployment:
echo 1. Push your code to GitHub
echo 2. Go to railway.app and create new project
echo 3. Connect your GitHub repository
echo 4. Set environment variables in Railway dashboard
echo 5. Deploy!
echo.
echo 📚 See RAILWAY_DEPLOYMENT.md for detailed instructions
echo.
pause
