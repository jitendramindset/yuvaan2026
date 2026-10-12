#!/bin/bash
# Quick Setup Script for Email & Genealogy Features
# Run this to configure and test the new features

echo "🚀 Yuvaan Email & Genealogy Setup Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if in backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from botmantra-backend directory"
    exit 1
fi

echo "📦 Installing/Verifying dependencies..."
npm list nodemailer > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Installing nodemailer..."
    npm install nodemailer
else
    echo "✅ nodemailer already installed"
fi

echo ""
echo "📋 Configuration Required:"
echo "================================"
echo ""
echo "1. Edit .env file and add email configuration:"
echo ""
echo "   EMAIL_SERVICE=gmail"
echo "   EMAIL_USER=your-email@gmail.com"
echo "   EMAIL_PASSWORD=your-app-password"
echo "   EMAIL_HOST=smtp.gmail.com"
echo "   EMAIL_PORT=587"
echo "   EMAIL_SECURE=false"
echo "   EMAIL_FROM=noreply@yuvaan.app"
echo ""
echo "   📌 For Gmail: Use app-specific password, not your regular password"
echo "   📌 Get app password at: https://myaccount.google.com/apppasswords"
echo ""

# Ask user if they want to configure email
read -p "Have you configured email in .env? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Email not configured. Email features will use console logging."
    echo "    Configure .env and restart server to enable real email sending."
fi

echo ""
echo "2. Database tables required:"
echo "================================"
echo ""
echo "The following tables need to exist in Supabase:"
echo "  - user_family_lineage"
echo "  - family_tree"
echo ""
echo "Run these SQL scripts in Supabase console:"
echo ""
echo "CREATE TABLE user_family_lineage ("
echo "  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),"
echo "  user_id UUID NOT NULL REFERENCES auth.users(id),"
echo "  family_name VARCHAR(255),"
echo "  gotra VARCHAR(255),"
echo "  generation VARCHAR(100),"
echo "  ancestry_level VARCHAR(100),"
echo "  ancestor_names TEXT[] DEFAULT '{}',"
echo "  branch VARCHAR(255),"
echo "  details JSONB DEFAULT '{}',"
echo "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
echo "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
echo ");"
echo ""
echo "CREATE INDEX idx_user_family_lineage_user_id ON user_family_lineage(user_id);"
echo ""

read -p "Have you created the database tables? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Database tables not created."
    echo "    Go to Supabase console and run the SQL scripts above."
    echo "    https://app.supabase.com -> SQL Editor"
fi

echo ""
echo "3. Creating test user..."
echo "================================"
read -p "Create test user (test@example.com / Test@123)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node setup-test-user.js
    if [ $? -eq 0 ]; then
        echo "✅ Test user created successfully"
    else
        echo "❌ Failed to create test user"
    fi
fi

echo ""
echo "4. Starting server..."
echo "================================"
read -p "Start backend server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting server on port 3000..."
    echo "Press Ctrl+C to stop"
    echo ""
    npm start
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Make sure frontend is running (npm start in botmantra-ui)"
echo "2. Open http://localhost:3000 in browser"
echo "3. Login with test@example.com / Test@123"
echo "4. Go to Forgot Password to test email sending"
echo "5. Check dashboard for Vanshawali genealogy display"
echo ""
echo "📚 Documentation: EMAIL_AND_GENEALOGY_IMPLEMENTATION.md"
