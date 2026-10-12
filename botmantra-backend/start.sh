#!/bin/bash

# BotMantra Backend Setup Script
# This script sets up the environment and starts the server

echo "╔════════════════════════════════════════╗"
echo "║  BotMantra Backend - Setup & Start    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env with your Supabase credentials before continuing!"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Run analyzer to generate RPC handlers
echo "🔍 Running function analyzer..."
node api-functions-analyzer.js
echo ""

# Check if routes directory exists
if [ ! -d routes ]; then
    echo "📁 Creating routes directory..."
    mkdir -p routes
fi

# Start the server
echo "🚀 Starting server..."
echo "📍 Server will run on: http://localhost:${PORT:-3000}"
echo "📍 API v1 endpoint: http://localhost:${PORT:-3000}/api/v1"
echo "📍 Health check: http://localhost:${PORT:-3000}/health"
echo ""

npm start
