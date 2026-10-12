# 🚀 Quick Start Guide

## Step 1: Configure Environment

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env with your Supabase credentials
notepad .env
```

**Required variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3000
```

## Step 2: Install Dependencies (if not already done)

```powershell
npm install
```

## Step 3: Run Function Analyzer

```powershell
node api-functions-analyzer.js
```

This generates:
- `rpc-handler.js` - RPC wrapper functions
- `SUPABASE_RPC_API_DOCS.md` - Documentation

## Step 4: Start Server

```powershell
npm start
```

Or use the automated script:

```powershell
.\start.ps1
```

## Step 5: Test the API

### Health Check
```powershell
curl http://localhost:3000/health
```

### Test API v1 Endpoint
```powershell
curl http://localhost:3000/api/v1/health
```

## Running Tests

```powershell
# Set test environment variables first
$env:TEST_AUTH_TOKEN="your_token"
$env:TEST_BUSINESS_ID="your_business_id"
$env:TEST_USER_ID="your_user_id"
$env:TEST_ROLE_ID="your_role_id"

# Run tests
npm test
```

## Available Scripts

```powershell
npm start          # Start the server
npm run dev        # Start with nodemon (auto-reload)
npm test           # Run test suite
npm run analyze    # Analyze Supabase functions
npm run scan       # Scan for dead code
```

## API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /api/v1/health` - API v1 health check

### Business Management
- `POST /api/v1/business/register` - Register new business
- `POST /api/v1/business/:id/initialize` - Initialize business

### Generic Data API
- `GET /api/v1/data/:routeCode` - Fetch data
- `POST /api/v1/data/:routeCode` - Create data

### AI & RAG
- `POST /api/v1/ai/embedding` - Generate embeddings
- `POST /api/v1/ai/context` - Build AI context
- `POST /api/v1/ai/prompt` - Generate AI prompt
- `POST /api/v1/ai/chunk-text` - Chunk text

### Permissions
- `POST /api/v1/permission/check` - Check permissions
- `POST /api/v1/feature/check` - Check feature access

### UI
- `GET /api/v1/ui/schema` - Get UI schema
- `GET /api/v1/ui/context` - Get UI context
- `GET /api/v1/ui/branding/:id` - Get branding

**See `API_IMPLEMENTATION_GUIDE.md` for complete documentation**

## Troubleshooting

### Server won't start
1. Check `.env` file exists and has correct values
2. Ensure PORT is not already in use
3. Check `node --version` (requires Node.js 16+)

### API routes not found
1. Run `node api-functions-analyzer.js`
2. Check `rpc-handler.js` was generated
3. Restart the server

### Tests failing
1. Set environment variables (TEST_AUTH_TOKEN, etc.)
2. Ensure Supabase is accessible
3. Check test data exists in database

## Next Steps

1. ✅ Configure `.env` with your credentials
2. ✅ Start the server
3. ✅ Test health endpoint
4. 📖 Read `API_IMPLEMENTATION_GUIDE.md`
5. 🧪 Run test suite
6. 🚀 Integrate with your frontend

## Support

- 📖 Complete API Docs: `API_IMPLEMENTATION_GUIDE.md`
- 🔧 RPC Functions: `SUPABASE_RPC_API_DOCS.md`
- ✅ Implementation Status: `API_IMPLEMENTATION_COMPLETE.md`
