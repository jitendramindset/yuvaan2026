# 📮 Postman API Testing - Quick Start

## 🚀 Import Collection (60 seconds)

### Step 1: Open Postman
1. Download & install [Postman](https://www.postman.com/downloads/)
2. Open the application

### Step 2: Import Collection
1. Click **Import** (top left)
2. Select **Upload Files** tab
3. Navigate to: `d:\React App\Yuvaan-v1\botmantra-backend\Kernel_Engine_API.postman_collection.json`
4. Click **Import**

### Step 3: Start Testing!
✅ All 18 endpoints ready to test

---

## 🧪 Test These First (5-minute test)

1. **Health Check**
   ```
   GET http://localhost:5000/health
   ```
   Expected: Status 200 ✅

2. **Database Status**
   ```
   GET http://localhost:5000/api/db-status
   ```
   Expected: Status 200 ✅

3. **Validate Node Action**
   ```
   POST http://localhost:5000/api/kernel/validate
   Body: {
     "nidHash": "test-node-123",
     "targetOwnerId": "owner-456",
     "actionType": "transfer",
     "requesterUuid": "user-789"
   }
   ```
   Expected: Status 200 ✅

4. **Execute Action**
   ```
   POST http://localhost:5000/api/kernel/execute
   Body: {
     "nodeHash": "test-node-123",
     "action": "process_transaction",
     "params": {
       "amount": 1000,
       "recipient": "recipient-123"
     }
   }
   ```
   Expected: Status 200 ✅

5. **Get Users**
   ```
   GET http://localhost:5000/api/table/users?limit=10
   ```
   Expected: Status 200, returns array ✅

---

## 📋 All Available Endpoints (18 Total)

### Health (2)
- ✅ GET /health
- ✅ GET /api/db-status

### Kernel Operations (6)
- ✅ POST /api/kernel/validate
- ✅ POST /api/kernel/evaluate-dharma
- ✅ POST /api/kernel/apply-karma
- ✅ POST /api/kernel/event-ingest
- ✅ POST /api/kernel/execute
- ✅ POST /api/kernel/calculate-reputation

### Session & Logs (8)
- ✅ GET /api/kernel/session/{nodeHash}
- ✅ GET /api/kernel/execution/{nodeHash}
- ✅ GET /api/kernel/reputation/{nodeHash}
- ✅ GET /api/kernel/permissions/{nodeHash}
- ✅ GET /api/kernel/events/{nodeHash}
- ✅ GET /api/kernel/failures/{nodeHash}
- ✅ GET /api/kernel/dharma-logs/{nodeHash}
- ✅ GET /api/kernel/karma-logs/{nodeHash}

### Database Tables (6)
- ✅ GET /api/table/users
- ✅ GET /api/table/node_core
- ✅ GET /api/table/node_trust_state
- ✅ GET /api/table/node_execution_log
- ✅ GET /api/table/node_dharma_log
- ✅ GET /api/table/node_karma_log

---

## 🔑 Parameters & Examples

### Node Hash
Replace `{nodeHash}` with: `test-node-123`

### Owner ID
Example: `owner-456`

### Query Limits
All GET endpoints support: `?limit=10` (default 50)

### Request Headers
All POST requests need:
```
Content-Type: application/json
```

---

## 🎯 Common Test Flow

```
1. GET /health
   ↓
2. GET /api/db-status
   ↓
3. POST /api/kernel/validate
   ↓
4. POST /api/kernel/execute
   ↓
5. GET /api/kernel/execution/{nodeHash}
   ↓
6. POST /api/kernel/calculate-reputation
   ↓
7. GET /api/kernel/reputation/{nodeHash}
```

---

## 📊 Response Examples

### Success (200)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-28T15:30:44.762Z"
}
```

### Error (400+)
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Make sure server is running: `npm start` |
| Postman collection won't import | Check file path, ensure .json is valid |
| 404 errors | Verify endpoint spelling and nodeHash |
| 500 errors | Check server logs, may need database data |

---

## ✨ Additional Resources

- **API_TESTING_GUIDE.md** - Detailed endpoint documentation
- **API_VALIDATION_REPORT.md** - Validation test results
- **Kernel_Engine_API.postman_collection.json** - Ready to import

---

**🎉 Ready to test! Import the collection now!**
