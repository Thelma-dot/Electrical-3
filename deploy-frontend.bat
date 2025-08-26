@echo off
echo 🚀 Preparing Frontend for Netlify Deployment...
echo.

echo 📁 Checking Frontend directory...
if not exist "Frontend" (
    echo ❌ Frontend directory not found!
    pause
    exit /b 1
)

echo ✅ Frontend directory found
echo.

echo 🔧 Creating deployment package...
if exist "Frontend-deploy" rmdir /s /q "Frontend-deploy"
mkdir "Frontend-deploy"

echo 📋 Copying files...
xcopy "Frontend\*" "Frontend-deploy\" /E /I /Y

echo ✅ Frontend deployment package created in 'Frontend-deploy' folder
echo.
echo 📋 Next steps:
echo 1. Go to https://app.netlify.com/
echo 2. Sign up/Login with GitHub
echo 3. Click "New site from Git"
echo 4. Choose your GitHub repository
echo 5. Set build command: echo "Frontend ready"
echo 6. Set publish directory: Frontend-deploy
echo 7. Deploy!
echo.
echo 🌐 Your Vercel backend is already working at:
echo    https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app
echo.
pause
