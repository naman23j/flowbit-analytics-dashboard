# Flowbit Analytics Dashboard - PowerShell Setup Script
# This script sets up the entire application with Docker Compose

Write-Host "🚀 Flowbit Analytics Dashboard - Quick Setup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running or not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://docs.docker.com/get-docker/" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit the .env file and add your GROQ_API_KEY" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://console.groq.com" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter after you've added your GROQ_API_KEY to .env"
}

# Verify GROQ_API_KEY is set
$envContent = Get-Content .env -Raw
if ($envContent -match "GROQ_API_KEY=your_groq_api_key_here" -or $envContent -notmatch "GROQ_API_KEY=\w+") {
    Write-Host "❌ GROQ_API_KEY not set in .env file" -ForegroundColor Red
    Write-Host "Please edit .env and add your Groq API key" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🐳 Starting services with Docker Compose..." -ForegroundColor Cyan
Write-Host ""

# Build and start services
docker-compose up -d --build

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Write-Host "   This may take 30-60 seconds on first run..." -ForegroundColor Yellow
Write-Host ""

# Wait for database
Write-Host "   ⏳ Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Wait for backend
Write-Host "   ⏳ Waiting for backend API..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/stats" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}

# Wait for Vanna AI
Write-Host "   ⏳ Waiting for Vanna AI service..." -ForegroundColor Yellow
$vannaReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $vannaReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}

# Wait for frontend
Write-Host "   ⏳ Waiting for frontend..." -ForegroundColor Yellow
$frontendReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ Setup complete! All services are running." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "   Vanna AI:  http://localhost:8000" -ForegroundColor White
Write-Host "   Database:  localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "📖 Quick Commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose down" -ForegroundColor White
Write-Host "   Restart:       docker-compose restart" -ForegroundColor White
Write-Host "   Reset all:     docker-compose down -v" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy analyzing!" -ForegroundColor Green

# Open browser automatically
Start-Process "http://localhost:3000"
