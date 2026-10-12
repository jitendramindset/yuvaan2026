#!/bin/bash

# KERNEL API Quick Setup Script
# Usage: bash kernel-setup.sh [dev|staging|prod]

set -e

ENV=${1:-dev}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 KERNEL API Setup for $ENV Environment"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check Node.js
echo "Step 1: Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  log_success "Node.js found: $NODE_VERSION"
else
  log_error "Node.js not found. Please install Node.js 16+"
  exit 1
fi

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
if [ -f "package.json" ]; then
  npm install
  log_success "Dependencies installed"
else
  log_error "package.json not found"
  exit 1
fi

# Step 3: Create .env file
echo ""
echo "Step 3: Setting up environment variables..."
ENV_FILE=".env.$ENV"

if [ -f "$ENV_FILE" ]; then
  log_warning "$ENV_FILE already exists. Skipping..."
else
  cat > "$ENV_FILE" << EOF
# Kernel API Configuration
KERNEL_ENV=$ENV
KERNEL_PORT=5000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_SECOND=5
RATE_LIMIT_BURST=10

# Logging
LOG_LEVEL=debug
ENABLE_METRICS=true

# Database
DATABASE_POOL_SIZE=10

# Node Environment
NODE_ENV=$ENV
EOF
  log_success "$ENV_FILE created. Edit with your Supabase credentials."
  echo ""
  echo "📝 Required environment variables:"
  echo "   - SUPABASE_URL"
  echo "   - SUPABASE_SERVICE_ROLE_KEY"
  echo "   - JWT_SECRET"
fi

# Step 4: Verify database connection
echo ""
echo "Step 4: Verifying database connection..."
if [ "$ENV" = "dev" ]; then
  log_warning "Skipping database check in dev (configure .env.$ENV first)"
else
  npm run test:db:connection -- "$ENV" || log_warning "Could not verify database connection"
fi

# Step 5: Run tests
echo ""
echo "Step 5: Running tests..."
if npm test -- kernel-execute.test.js; then
  log_success "All tests passed!"
else
  log_warning "Some tests failed. Check logs above."
fi

# Step 6: Create logs directory
echo ""
echo "Step 6: Setting up logging..."
mkdir -p logs
chmod 755 logs
log_success "Logs directory created: logs/"

# Step 7: Summary
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Edit .env.$ENV with your Supabase credentials:"
echo "   nano .env.$ENV"
echo ""
echo "2. Verify database tables and functions:"
echo "   npm run check:db"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Test the API:"
echo "   curl -X GET http://localhost:5000/kernel/health"
echo ""
echo "5. View documentation:"
echo "   - Integration Guide: KERNEL_API_INTEGRATION_GUIDE.md"
echo "   - Deployment Checklist: KERNEL_API_DEPLOYMENT_CHECKLIST.md"
echo "   - Summary: KERNEL_API_COMPLETE_SUMMARY.md"
echo ""
echo "📚 Documentation:"
echo "   - API Specification: See KERNEL_API_INTEGRATION_GUIDE.md"
echo "   - Code Examples: See examples/ directory"
echo "   - Troubleshooting: See KERNEL_API_INTEGRATION_GUIDE.md#troubleshooting"
echo ""
echo "🐛 Issues?"
echo "   - Check logs: tail -f logs/kernel-api.log"
echo "   - Run tests: npm test -- kernel-execute.test.js"
echo "   - Check env: npm run check:env"
echo ""
