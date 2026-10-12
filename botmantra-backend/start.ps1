# BotMantra Backend - Setup & Start
# PowerShell version

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  BotMantra Backend - Setup & Start    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from template..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env with your Supabase credentials before continuing!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Run analyzer to generate RPC handlers
Write-Host "🔍 Running function analyzer..." -ForegroundColor Cyan
node api-functions-analyzer.js
Write-Host ""

# Check if routes directory exists
if (-not (Test-Path routes)) {
    Write-Host "📁 Creating routes directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path routes -Force | Out-Null
}

# Get port from environment or use default
$port = if ($env:PORT) { $env:PORT } else { "3000" }

# Start the server
Write-Host "🚀 Starting server..." -ForegroundColor Green
Write-Host "📍 Server will run on: http://localhost:$port" -ForegroundColor Cyan
Write-Host "📍 API v1 endpoint: http://localhost:$port/api/v1" -ForegroundColor Cyan
Write-Host "📍 Health check: http://localhost:$port/health" -ForegroundColor Cyan
Write-Host ""

npm start
