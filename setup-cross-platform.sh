#!/bin/bash

# 📱🌐 BOTMANTRA CROSS-PLATFORM UI FACTORY
# Quick Start Setup Guide (5 Minutes)

echo "🚀 Starting BotMantra Mobile + Web App Builder Setup..."

# ============================================================
# STEP 1: DATABASE SETUP
# ============================================================
echo ""
echo "📊 STEP 1: Setting up database..."
echo "1. Go to Supabase SQL Editor"
echo "2. Copy contents of: db-migrations/20260203_app_builder_mode.sql"
echo "3. Execute the SQL"
echo "✓ Database ready!"

# ============================================================
# STEP 2: BACKEND API
# ============================================================
echo ""
echo "🔗 STEP 2: Starting backend..."
cd botmantra-backend
npm install
node server.js &
BACKEND_PID=$!
echo "✓ Backend running on http://localhost:5000"
echo "✓ Process ID: $BACKEND_PID"

# ============================================================
# STEP 3: WEB APP
# ============================================================
echo ""
echo "🌐 STEP 3: Starting web app..."
cd ../frontend/web
npm install
npm run dev &
WEB_PID=$!
echo "✓ Web app running on http://localhost:5173"
echo "✓ Process ID: $WEB_PID"

# ============================================================
# STEP 4: TEST API ENDPOINTS
# ============================================================
echo ""
echo "🧪 STEP 4: Testing API endpoints..."
sleep 3

echo ""
echo "Testing app-builder components endpoint..."
curl -X GET http://localhost:5000/api/app-builder/components \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "Testing app-builder templates endpoint..."
curl -X GET http://localhost:5000/api/app-builder/templates \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" | jq .

# ============================================================
# STEP 5: MOBILE APP SETUP
# ============================================================
echo ""
echo "📱 STEP 5: Mobile app setup..."
cd ../../frontend/mobile
flutter pub get
echo "✓ Flutter dependencies installed"
echo ""
echo "To run on device:"
echo "  flutter run"
echo ""
echo "To build iOS:"
echo "  flutter build ios"
echo ""
echo "To build Android:"
echo "  flutter build apk"

# ============================================================
# VERIFICATION CHECKLIST
# ============================================================
echo ""
echo "✅ VERIFICATION CHECKLIST"
echo ""
echo "Backend:"
echo "  [ ] http://localhost:5000/health returns 200"
echo "  [ ] GET /api/app-builder/components works"
echo "  [ ] GET /api/app-builder/templates works"
echo ""
echo "Web App:"
echo "  [ ] http://localhost:5173 loads"
echo "  [ ] Can see dynamic renderer demo"
echo "  [ ] Can load UI schema from kernel"
echo ""
echo "Mobile App:"
echo "  [ ] flutter pub get succeeds"
echo "  [ ] No build errors in lib/main.dart"
echo "  [ ] Firebase configured"
echo ""
echo "Database:"
echo "  [ ] mobile_layout_registry table exists"
echo "  [ ] app_builder_components table exists"
echo "  [ ] app_builder_templates table exists"
echo "  [ ] app_deployment_configs table exists"

# ============================================================
# RUNNING SERVICES
# ============================================================
echo ""
echo "🎯 SERVICES RUNNING"
echo ""
echo "Backend:   http://localhost:5000"
echo "  API:     /api/kernel/execute"
echo "  Builder: /api/app-builder/*"
echo ""
echo "Web App:   http://localhost:5173"
echo "  Renderer: DynamicScreenRenderer component"
echo ""
echo "Mobile App: (Ready to run with flutter run)"
echo "  Renderer: DynamicScreenRenderer widget"
echo ""

# ============================================================
# TROUBLESHOOTING
# ============================================================
echo ""
echo "❓ TROUBLESHOOTING"
echo ""
echo "Backend not starting?"
echo "  cd botmantra-backend && npm install"
echo "  Check .env file has SUPABASE_URL and SUPABASE_KEY"
echo ""
echo "Web app build error?"
echo "  cd frontend/web"
echo "  rm -rf node_modules package-lock.json"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Flutter pub get fails?"
echo "  cd frontend/mobile"
echo "  flutter clean"
echo "  flutter pub get"
echo ""
echo "Database migration failed?"
echo "  Check Supabase SQL error"
echo "  Verify tables manually: SELECT * FROM pg_tables WHERE schemaname='public';"
echo ""

# ============================================================
# NEXT STEPS
# ============================================================
echo ""
echo "📚 NEXT STEPS"
echo ""
echo "1. Configure Firebase for mobile push notifications"
echo "   - Add google-services.json (Android)"
echo "   - Add GoogleService-Info.plist (iOS)"
echo ""
echo "2. Set up app store credentials"
echo "   - iOS: App Store Connect team ID, bundle ID"
echo "   - Android: Google Play keystore, package name"
echo ""
echo "3. Test app builder"
echo "   - POST /api/app-builder/create"
echo "   - POST /api/app-builder/:app_id/save"
echo "   - POST /api/app-builder/:app_id/publish"
echo ""
echo "4. Build and deploy to stores"
echo "   - POST /api/app-builder/:app_id/build/ios"
echo "   - POST /api/app-builder/:app_id/build/android"
echo ""
echo "🎉 Setup complete! Happy building! 🚀"
echo ""

# Keep processes running
echo "Press Ctrl+C to stop all services"
wait
