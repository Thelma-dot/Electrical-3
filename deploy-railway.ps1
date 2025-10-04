# Railway Deployment Script for Windows PowerShell
# Run this script to deploy your app to Railway

Write-Host "🚀 Starting Railway Deployment..." -ForegroundColor Green

# Check if Railway CLI is installed
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Please install it from https://docs.railway.app/develop/cli" -ForegroundColor Red
    Write-Host "Run: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    $whoami = railway whoami
    Write-Host "✅ Logged in to Railway" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Railway. Please run 'railway login' first" -ForegroundColor Red
    exit 1
}

# Initialize Railway project
Write-Host "Initializing Railway project..." -ForegroundColor Yellow
railway init

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="$(Get-Random -Count 32 -InputObject (0..9 + 'A'..'Z' + 'a'..'z') | ForEach-Object {[char]$_})"
railway variables set FRONTEND_URL="https://your-app.railway.app"

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Deploy to Railway
Write-Host "Deploying to Railway..." -ForegroundColor Yellow
railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your app is available at the URL shown above" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed. Check the logs above for errors." -ForegroundColor Red
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check your Railway dashboard for the app URL" -ForegroundColor White
Write-Host "2. Add a database service if needed" -ForegroundColor White
Write-Host "3. Configure custom domain if desired" -ForegroundColor White
