# Heroku Deployment Script for Windows PowerShell
# Run this script to deploy your app to Heroku

Write-Host "🚀 Starting Heroku Deployment..." -ForegroundColor Green

# Check if Heroku CLI is installed
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI found: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found. Please install it from https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}

# Check if user is logged in
try {
    $whoami = heroku auth:whoami
    Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Heroku. Please run 'heroku login' first" -ForegroundColor Red
    exit 1
}

# Get app name from user
$appName = Read-Host "Enter your Heroku app name (or press Enter to create new)"

if ([string]::IsNullOrEmpty($appName)) {
    Write-Host "Creating new Heroku app..." -ForegroundColor Yellow
    $createResult = heroku create
    $appName = $createResult -split ' ' | Select-Object -Last 1
    Write-Host "✅ Created app: $appName" -ForegroundColor Green
} else {
    Write-Host "Using existing app: $appName" -ForegroundColor Yellow
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
heroku config:set NODE_ENV=production -a $appName
heroku config:set JWT_SECRET="$(Get-Random -Count 32 -InputObject (0..9 + 'A'..'Z' + 'a'..'z') | ForEach-Object {[char]$_})" -a $appName
heroku config:set FRONTEND_URL="https://$appName.herokuapp.com" -a $appName
heroku config:set CORS_ORIGIN="https://$appName.herokuapp.com" -a $appName

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Deploy to Heroku
Write-Host "Deploying to Heroku..." -ForegroundColor Yellow
git push heroku master

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your app is available at: https://$appName.herokuapp.com" -ForegroundColor Cyan
    
    # Open the app
    $open = Read-Host "Would you like to open the app in your browser? (y/n)"
    if ($open -eq "y" -or $open -eq "Y") {
        heroku open -a $appName
    }
} else {
    Write-Host "❌ Deployment failed. Check the logs above for errors." -ForegroundColor Red
    Write-Host "Run 'heroku logs --tail -a $appName' to see detailed logs." -ForegroundColor Yellow
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit https://$appName.herokuapp.com to test your app" -ForegroundColor White
Write-Host "2. Check logs with: heroku logs --tail -a $appName" -ForegroundColor White
Write-Host "3. Scale your app with: heroku ps:scale web=1 -a $appName" -ForegroundColor White
Write-Host "4. Add a database addon if needed: heroku addons:create heroku-postgresql:hobby-dev -a $appName" -ForegroundColor White
