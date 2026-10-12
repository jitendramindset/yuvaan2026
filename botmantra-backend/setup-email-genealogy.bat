@echo off
REM Quick Setup Script for Email & Genealogy Features - Windows Version
REM Run this to configure and test the new features

echo.
echo 🚀 Yuvaan Email and Genealogy Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ Please run this script from botmantra-backend directory
    pause
    exit /b 1
)

echo 📦 Installing/Verifying dependencies...
npm list nodemailer >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing nodemailer...
    call npm install nodemailer
) else (
    echo ✅ nodemailer already installed
)

echo.
echo 📋 Configuration Required:
echo ================================
echo.
echo 1. Edit .env file and add email configuration:
echo.
echo    EMAIL_SERVICE=gmail
echo    EMAIL_USER=your-email@gmail.com
echo    EMAIL_PASSWORD=your-app-password
echo    EMAIL_HOST=smtp.gmail.com
echo    EMAIL_PORT=587
echo    EMAIL_SECURE=false
echo    EMAIL_FROM=noreply@yuvaan.app
echo.
echo    📌 For Gmail: Use app-specific password, not your regular password
echo    📌 Get app password at: https://myaccount.google.com/apppasswords
echo.

set /p CONFIGURED="Have you configured email in .env? (y/n): "
if /i not "%CONFIGURED%"=="y" (
    echo.
    echo ⚠️  Email not configured. Email features will use console logging.
    echo    Configure .env and restart server to enable real email sending.
)

echo.
echo 2. Database tables required:
echo ================================
echo.
echo The following tables need to exist in Supabase:
echo   - user_family_lineage
echo   - family_tree
echo.
echo Run this SQL script in Supabase console:
echo https://app.supabase.com ^-^> SQL Editor
echo.
echo CREATE TABLE user_family_lineage (
echo   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
echo   user_id UUID NOT NULL REFERENCES auth.users(id),
echo   family_name VARCHAR(255),
echo   gotra VARCHAR(255),
echo   generation VARCHAR(100),
echo   ancestry_level VARCHAR(100),
echo   ancestor_names TEXT[] DEFAULT '{}',
echo   branch VARCHAR(255),
echo   details JSONB DEFAULT '{}',
echo   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
echo   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
echo );
echo.
echo CREATE INDEX idx_user_family_lineage_user_id 
echo   ON user_family_lineage(user_id);
echo.

set /p DB_CREATED="Have you created the database tables? (y/n): "
if /i not "%DB_CREATED%"=="y" (
    echo.
    echo ⚠️  Database tables not created.
    echo    Go to Supabase console and run the SQL scripts above.
    echo    https://app.supabase.com ^-^> SQL Editor
)

echo.
echo 3. Creating test user...
echo ================================

set /p CREATE_USER="Create test user (test@example.com / Test@123)? (y/n): "
if /i "%CREATE_USER%"=="y" (
    echo.
    echo Creating test user...
    call node setup-test-user.js
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Test user created successfully
    ) else (
        echo ❌ Failed to create test user
    )
)

echo.
echo 4. Starting server...
echo ================================

set /p START_SERVER="Start backend server now? (y/n): "
if /i "%START_SERVER%"=="y" (
    echo.
    echo Starting server on port 3000...
    echo Press Ctrl+C to stop
    echo.
    call npm start
)

echo.
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Make sure frontend is running (npm start in botmantra-ui)
echo 2. Open http://localhost:3000 in browser
echo 3. Login with test@example.com / Test@123
echo 4. Go to Forgot Password to test email sending
echo 5. Check dashboard for Vanshawali genealogy display
echo.
echo 📚 Documentation: EMAIL_AND_GENEALOGY_IMPLEMENTATION.md
echo.
pause
