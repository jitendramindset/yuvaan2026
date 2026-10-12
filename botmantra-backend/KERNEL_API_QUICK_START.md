# KERNEL API - QUICK START REFERENCE CARD

---

## ⚡ 60-Second Overview

**Kernel API** = Single gateway for all platform operations  
**Endpoint** = `POST /kernel/execute`  
**Auth** = Supabase JWT (required)  
**Pipeline** = 6 steps: JWT → User → Permission → Trust → Route → Log  
**Actions** = 5 types: chat, ui, data, automation, plugin  

---

## 🚀 5-Minute Setup

### Linux/Mac:
```bash
cd botmantra-backend
bash kernel-setup.sh dev
```

### Windows:
```cmd
cd botmantra-backend
kernel-setup.bat dev
```

### Manual Setup:
```bash
npm install
npm test -- kernel-execute.test.js
npm start
```

---

## 🔌 Basic Usage

### React Frontend
```javascript
import { useKernel } from './useKernel';

const { execute } = useKernel();
const response = await execute('chat', { 
  message: 'Hello world' 
});
```

### cURL
```bash
curl -X POST http://localhost:5000/kernel/execute \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"action":"chat","payload":{"message":"Hello"}}'
```

### n8n
```
Webhook → HTTP Request to /kernel/execute
  Headers: Authorization: Bearer <JWT>
  Method: POST
  Body: {"action":"chat","payload":{...}}
```

---

## 📊 Response Format

```json
{
  "status": "success",
  "request_id": "req_...",
  "user_id": "uuid",
  "business_id": "uuid",
  "trust_score": 75,
  "execution_time_ms": 245,
  "response": {
    "text": "AI response",
    "type": "chat"
  }
}
```

---

## 🎯 5 Action Types

| Action | Purpose | Returns |
|--------|---------|---------|
| **chat** | AI chat | AI response + suggestions |
| **ui** | Render screen | Layout + widgets + actions |
| **data** | Query data | Paginated results |
| **automation** | Queue task | Task ID + status |
| **plugin** | Call plugin | Plugin response |

---

## 🔐 Error Codes

| Code | Status | Fix |
|------|--------|-----|
| MISSING_AUTH_HEADER | 401 | Add JWT header |
| INVALID_JWT | 401 | Re-authenticate |
| PERMISSION_DENIED | 403 | Check role permissions |
| LOW_TRUST_SCORE | 403 | Admin raises trust |
| USER_NOT_FOUND | 404 | Create user account |
| INVALID_ACTION | 400 | Check action name |

---

## 📁 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| routes/kernel-execute.js | Main handler | 540+ |
| kernel-execute.test.js | Tests | 590+ |
| KERNEL_API_INTEGRATION_GUIDE.md | Integration | 400+ |
| KERNEL_API_DEPLOYMENT_CHECKLIST.md | Deploy | 500+ |

---

## ✅ Testing

```bash
# Run all tests
npm test -- kernel-execute.test.js

# Expected: ✅ 40+ tests passing
# Time: ~2-3 seconds
```

---

## 🌐 Endpoints

```
GET    /kernel/health          → {"status":"healthy"}
POST   /kernel/execute         → Action response
```

---

## 🔧 Common Commands

| Task | Command |
|------|---------|
| Start dev | npm start |
| Run tests | npm test -- kernel-execute.test.js |
| Check env | npm run check:env |
| Build prod | npm run build:prod |
| Deploy k8s | kubectl apply -f k8s/kernel-api.yaml |

---

## 📚 Documentation Map

```
START HERE ↓
KERNEL_API_COMPLETE_SUMMARY.md (architecture + quick ref)
        ↓
INTEGRATE? → KERNEL_API_INTEGRATION_GUIDE.md
DEPLOY?   → KERNEL_API_DEPLOYMENT_CHECKLIST.md
EXTEND?   → KERNEL_API_INTEGRATION_GUIDE.md#extending
LOST?     → KERNEL_API_PRODUCTION_DELIVERY_INDEX.md
```

---

## 🚀 Deployment Timeline

| Phase | Time | Steps |
|-------|------|-------|
| Dev | 15 min | Setup + test |
| Staging | 30 min | Deploy + verify |
| Prod | 45 min | Deploy + monitor |

---

## 🔐 Security Features

✅ JWT validation  
✅ Role-based permissions  
✅ Trust score gating  
✅ Rate limiting (5 req/sec default)  
✅ Execution logging  
✅ RLS enforcement  

---

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| P50 latency | <200ms |
| P99 latency | <1000ms |
| Throughput | >100 req/s |
| Error rate | <1% |

---

## 🚨 Troubleshooting

**"PERMISSION_DENIED"**
→ Check user role in database

**"LOW_TRUST_SCORE"**
→ Admin must increase user trust

**"INVALID_JWT"**
→ User must re-login

**Tests failing?**
→ Check database connection

**Slow responses?**
→ Check execution logs

---

## 🎯 Your Checklist

- [ ] Run kernel-setup.sh or kernel-setup.bat
- [ ] Run npm test -- kernel-execute.test.js
- [ ] Mount router in app.js
- [ ] Start server: npm start
- [ ] Test /kernel/health endpoint
- [ ] Read KERNEL_API_INTEGRATION_GUIDE.md
- [ ] Integrate with frontend
- [ ] Follow KERNEL_API_DEPLOYMENT_CHECKLIST.md

---

## 💡 Pro Tips

1. **JWT Header Format**: `Authorization: Bearer <token>`
2. **Environment File**: Create `.env.dev` with Supabase credentials
3. **Test Locally First**: Always test on dev before staging
4. **Monitor Errors**: Watch execution logs for patterns
5. **Cache Responses**: Use template caching for data queries
6. **Log Everything**: Kernel logs all requests automatically

---

## 📞 Quick Help

**Setup Issues?**
→ Run kernel-setup.sh/bat with verbose output

**Test Failures?**
→ Check .env file has valid Supabase URL

**Deployment Issues?**
→ Follow KERNEL_API_DEPLOYMENT_CHECKLIST.md step-by-step

**API Issues?**
→ Check error code in response, see Troubleshooting section

---

## 🎁 What You Get

✅ Production-ready Kernel API (540+ lines)  
✅ Complete test suite (40+ tests)  
✅ Integration guide (400+ lines)  
✅ Deployment guide (500+ lines)  
✅ Setup scripts (automated)  
✅ Code examples (10+)  
✅ n8n workflows (3)  
✅ Full documentation (1,900+ lines)  

---

## 🟢 Status

**READY FOR PRODUCTION** ✅

All files created | All tests passing | All docs complete | Ready to deploy

---

## 🏃 Quick Start (Pick One)

**Option A: Automated** (5 min)
```bash
bash kernel-setup.sh dev
```

**Option B: Manual** (10 min)
```bash
npm install
npm test -- kernel-execute.test.js
npm start
```

**Option C: Docker** (5 min)
```bash
docker build -t kernel-api:1.0.0 .
docker run -p 5000:5000 kernel-api:1.0.0
```

---

*See KERNEL_API_COMPLETE_SUMMARY.md for full details.*
