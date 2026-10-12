@echo off
REM KERNEL API Quick Setup Script (Windows)
REM Usage: kernel-setup.bat [dev|staging|prod]

setlocal enabledelayedexpansion

set ENV=%1
if "%ENV%"=="" set ENV=dev

echo.
echo 🚀 KERNEL API Setup for %ENV% Environment
echo ==========================================
echo.

REM Step 1: Check Node.js
echo Step 1: Checking Node.js...
where node >nul 2>nul
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✅ Node.js found: !NODE_VERSION!
) else (
    echo ❌ Node.js not found. Please install Node.js 16+
    exit /b 1
)

REM Step 2: Install dependencies
echo.
echo Step 2: Installing dependencies...
if exist "package.json" (
    call npm install
    echo ✅ Dependencies installed
) else (
    echo ❌ package.json not found
    exit /b 1
)

REM Step 3: Create .env file
echo.
echo Step 3: Setting up environment variables...
set ENV_FILE=.env.%ENV%

if exist "!ENV_FILE!" (
    echo ⚠️  !ENV_FILE! already exists. Skipping...
) else (
    (
        echo # Kernel API Configuration
        echo KERNEL_ENV=%ENV%
        echo KERNEL_PORT=5000
        echo.
        echo # Supabase
        echo SUPABASE_URL=https://your-project.supabase.co
        echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
        echo SUPABASE_ANON_KEY=your_anon_key
        echo JWT_SECRET=your_jwt_secret
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_REQUESTS_PER_SECOND=5
        echo RATE_LIMIT_BURST=10
        echo.
        echo # Logging
        echo LOG_LEVEL=debug
        echo ENABLE_METRICS=true
        echo.
        echo # Database
        echo DATABASE_POOL_SIZE=10
        echo.
        echo # Node Environment
        echo NODE_ENV=%ENV%
    ) > !ENV_FILE!
    
    echo ✅ !ENV_FILE! created. Edit with your Supabase credentials.
    echo.
    echo 📝 Required environment variables:
    echo    - SUPABASE_URL
    echo    - SUPABASE_SERVICE_ROLE_KEY
    echo    - JWT_SECRET
)

REM Step 4: Verify database connection
echo.
echo Step 4: Verifying database connection...
if "%ENV%"=="dev" (
    echo ⚠️  Skipping database check in dev (configure .env.%ENV% first^)
) else (
    call npm run test:db:connection -- %ENV% || echo ⚠️  Could not verify database connection
)

REM Step 5: Run tests
echo.
echo Step 5: Running tests...
call npm test -- kernel-execute.test.js
if !errorlevel! equ 0 (
    echo ✅ All tests passed!
) else (
    echo ⚠️  Some tests failed. Check logs above.
)

REM Step 6: Create logs directory
echo.
echo Step 6: Setting up logging...
if not exist "logs" mkdir logs
echo ✅ Logs directory created: logs\

REM Step 7: Summary
echo.
echo ==========================================
echo ✅ Setup Complete!
echo ==========================================
echo.
echo 📋 Next Steps:
echo.
echo 1. Edit .env.%ENV% with your Supabase credentials:
echo    - Open .env.%ENV% in your editor
echo    - Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
echo.
echo 2. Verify database tables and functions:
echo    npm run check:db
echo.
echo 3. Start development server:
echo    npm run dev
echo.
echo 4. Test the API:
echo    curl -X GET http://localhost:5000/kernel/health
echo    (or use PowerShell: Invoke-WebRequest -Uri http://localhost:5000/kernel/health^)
echo.
echo 5. View documentation:
echo    - Integration Guide: KERNEL_API_INTEGRATION_GUIDE.md
echo    - Deployment Checklist: KERNEL_API_DEPLOYMENT_CHECKLIST.md
echo    - Summary: KERNEL_API_COMPLETE_SUMMARY.md
echo.
echo 📚 Documentation:
echo    - API Specification: See KERNEL_API_INTEGRATION_GUIDE.md
echo    - Code Examples: See examples\ directory
echo    - Troubleshooting: See KERNEL_API_INTEGRATION_GUIDE.md#troubleshooting
echo.
echo 🐛 Issues?
echo    - Check logs: type logs\kernel-api.log
echo    - Run tests: npm test -- kernel-execute.test.js
echo    - Check env: npm run check:env
echo.
pause
