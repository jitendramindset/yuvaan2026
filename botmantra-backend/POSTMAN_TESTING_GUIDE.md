# 🧪 Postman API Testing Guide

**Date**: January 29, 2026  
**Backend Status**: ✅ Running on port 5000  
**Collection**: Botmantra_Complete_API.postman_collection.json

---

## 📥 Import Collection into Postman

### Option 1: Direct Import (Recommended)
1. Open Postman
2. Click **Import** (top-left)
3. Select **Upload Files**
4. Choose: `Botmantra_Complete_API.postman_collection.json`
5. Click **Import**

### Option 2: Link Import
1. Open Postman
2. Click **Import** → **Link**
3. Paste the file path or URL
4. Click **Import**

---

## ✅ Health & Status Tests

### 1️⃣ Health Check
```
GET http://localhost:5000/health
```

**Expected Response** (200 OK):
```json
{
  "status": "OK",
  "timestamp": "2026-01-29T18:50:52.558Z",
  "environment": "development"
}
```

✅ **Test**: Server is running

---

### 2️⃣ Database Status
```
GET http://localhost:5000/api/db-status
```

**Expected Response** (200 OK):
```json
{
  "status": "connected",
  "timestamp": "2026-01-29T18:50:58.753Z",
  "message": "✅ Supabase connection successful"
}
```

✅ **Test**: Database is connected

---

## ⚙️ Kernel Engine Tests

### 3️⃣ Validate Node Action

**Endpoint**: `POST /api/kernel/validate`

**Request Body**:
```json
{
  "nidHash": "test_node_001",
  "targetOwnerId": "owner-uuid-123",
  "actionType": "read",
  "requesterUuid": "user-uuid-456"
}
```

**What it does**: Validates if an action is allowed on a node without executing it

**Expected**: 200 or 500 with JSON response

---

### 4️⃣ Execute Node Runtime

**Endpoint**: `POST /api/kernel/execute`

**Request Body**:
```json
{
  "nidHash": "test_node_001",
  "targetOwnerId": "owner-uuid-123",
  "actionType": "execute",
  "payload": {
    "command": "test",
    "parameters": {}
  }
}
```

**What it does**: Executes an action on a node (main kernel execution)

**Expected**: 200 or 500 with JSON response

---

### 5️⃣ Evaluate Dharma

**Endpoint**: `POST /api/kernel/evaluate-dharma`

**Request Body**:
```json
{
  "nidHash": "test_node_001",
  "actionType": "read",
  "principle": "dharma_principle_001"
}
```

**What it does**: Evaluates if an action aligns with dharma principles

**Expected**: 200 or 500 with JSON response

---

### 6️⃣ Apply Karma

**Endpoint**: `POST /api/kernel/apply-karma`

**Request Body**:
```json
{
  "nidHash": "test_node_001",
  "actorOwnerId": "actor-uuid-789",
  "actionType": "help",
  "karmaDelta": 10,
  "trustDelta": 5,
  "reason": "User performed helpful action"
}
```

**What it does**: Apply karma and trust changes to a node

**Expected**: 200 or 500 with JSON response

---

### 7️⃣ Ingest Event

**Endpoint**: `POST /api/kernel/event-ingest`

**Request Body**:
```json
{
  "nidHash": "test_node_001",
  "eventType": "action_completed",
  "payload": {
    "action_id": "act-001",
    "status": "success",
    "timestamp": "2026-01-29T10:00:00Z"
  },
  "prevHash": "prev_hash_if_known"
}
```

**What it does**: Queue an event for processing

**Expected**: 200 or 500 with JSON response

---

### 8️⃣ Calculate Reputation

**Endpoint**: `POST /api/kernel/calculate-reputation`

**Request Body**:
```json
{
  "nidHash": "test_node_001"
}
```

**What it does**: Calculate the current reputation score for a node

**Expected**: 200 or 500 with JSON response

---

## 📊 Kernel Data Retrieval Tests

### 9️⃣ Get Session Details

**Endpoint**: `GET /api/kernel/session/:sessionId`

**Example**:
```
GET http://localhost:5000/api/kernel/session/session_id_or_uuid
```

**What it does**: Get runtime session details

**Expected**: 200 with session data or not found message

---

### 🔟 Get Execution Details

**Endpoint**: `GET /api/kernel/execution/:executionId`

**Example**:
```
GET http://localhost:5000/api/kernel/execution/execution_id_or_hash
```

**What it does**: Get execution log details

**Expected**: 200 with execution data or not found message

---

### 1️⃣1️⃣ Get Reputation Score

**Endpoint**: `GET /api/kernel/reputation/:nidHash`

**Example**:
```
GET http://localhost:5000/api/kernel/reputation/test_node_001
```

**What it does**: Get karma and reputation state

**Expected**: 200 with reputation data or 500 error

---

### 1️⃣2️⃣ Get Permissions

**Endpoint**: `GET /api/kernel/permissions/:nidHash?targetOwnerId=owner_uuid`

**Example**:
```
GET http://localhost:5000/api/kernel/permissions/test_node_001?targetOwnerId=owner-uuid-123
```

**What it does**: Get effective permissions for a node

**Expected**: 200 with permissions data

---

### 1️⃣3️⃣ Get Event History

**Endpoint**: `GET /api/kernel/events/:nidHash?limit=50&offset=0`

**Example**:
```
GET http://localhost:5000/api/kernel/events/test_node_001?limit=50&offset=0
```

**What it does**: Get event history with pagination

**Expected**: 200 with event array

---

### 1️⃣4️⃣ Get Failure Logs

**Endpoint**: `GET /api/kernel/failures/:nidHash?limit=50`

**Example**:
```
GET http://localhost:5000/api/kernel/failures/test_node_001?limit=50
```

**What it does**: Get failure logs for a node

**Expected**: 200 with failure array

---

### 1️⃣5️⃣ Get Dharma Logs

**Endpoint**: `GET /api/kernel/dharma-logs/:nidHash?limit=50`

**Example**:
```
GET http://localhost:5000/api/kernel/dharma-logs/test_node_001?limit=50
```

**What it does**: Get dharma evaluation logs

**Expected**: 200 with dharma logs

---

### 1️⃣6️⃣ Get Karma Logs

**Endpoint**: `GET /api/kernel/karma-logs/:nidHash?limit=50`

**Example**:
```
GET http://localhost:5000/api/kernel/karma-logs/test_node_001?limit=50
```

**What it does**: Get karma change history

**Expected**: 200 with karma logs

---

## 🔄 Generic CRUD Operations

### 1️⃣7️⃣ Get Table Data

**Endpoint**: `GET /api/table/:tableName?limit=10&offset=0`

**Examples**:
```
GET http://localhost:5000/api/table/users?limit=10&offset=0
GET http://localhost:5000/api/table/node_core?limit=10&offset=0
GET http://localhost:5000/api/table/businesses?limit=10&offset=0
```

**What it does**: Get all records from a table with pagination

**Expected Response** (200):
```json
{
  "success": true,
  "table": "users",
  "count": 5,
  "limit": 10,
  "offset": 0,
  "data": [
    { "id": "...", "email": "..." }
  ]
}
```

---

### 1️⃣8️⃣ Insert Record

**Endpoint**: `POST /api/table/:tableName`

**Example**:
```json
POST http://localhost:5000/api/table/users
{
  "id": "test-user-001",
  "email": "test@example.com",
  "created_at": "2026-01-29T00:00:00Z"
}
```

**What it does**: Insert a new record

**Expected Response** (201):
```json
{
  "success": true,
  "message": "Data inserted successfully",
  "data": { ... }
}
```

---

### 1️⃣9️⃣ Update Record

**Endpoint**: `PUT /api/table/:tableName`

**Request Body**:
```json
{
  "filter": {
    "id": "test-user-001"
  },
  "data": {
    "email": "newemail@example.com",
    "updated_at": "2026-01-29T10:00:00Z"
  }
}
```

**What it does**: Update a record

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Data updated successfully",
  "data": { ... }
}
```

---

### 2️⃣0️⃣ Delete Record

**Endpoint**: `DELETE /api/table/:tableName`

**Request Body**:
```json
{
  "filter": {
    "id": "test-user-001"
  }
}
```

**What it does**: Delete a record

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

---

## 📋 Testing Checklist

### Start Here (Must Work)
- [ ] Health Check (GET /health) → 200 OK
- [ ] Database Status (GET /api/db-status) → connected
- [ ] Get Users (GET /api/table/users) → success: true

### Kernel Validation
- [ ] Validate Node Action → 200 or error
- [ ] Execute Node → 200 or error
- [ ] Evaluate Dharma → 200 or error
- [ ] Apply Karma → 200 or error

### Kernel Data
- [ ] Get Reputation → 200 or error
- [ ] Get Event History → 200 with array
- [ ] Get Permissions → 200 with data

### CRUD Operations
- [ ] Get Users table → success: true
- [ ] Get node_core table → success: true
- [ ] Get businesses table → success: true

---

## 🔍 How to Test in Postman

### Method 1: Manual Testing
1. Select a request from the collection
2. Click **Send**
3. Check the response
4. Look for ✅ or ❌ indicators

### Method 2: Automated Testing
1. Click **Run** (collection icon)
2. Select all requests
3. Click **Run**
4. Watch automated tests execute
5. See summary of passes/failures

### Method 3: Test with Variables
1. Go to **Variables** tab in collection
2. Modify `nid_hash`, `owner_uuid`, `user_uuid` as needed
3. Requests will automatically use these values

---

## 📊 Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **200** | Success | ✅ OK, request worked |
| **201** | Created | ✅ OK, resource created |
| **400** | Bad Request | ❌ Check request format |
| **404** | Not Found | ⚠️ Resource doesn't exist |
| **500** | Server Error | ❌ Backend issue - check logs |

---

## 🐛 Troubleshooting

### Problem: Connection Refused
**Cause**: Backend server not running  
**Solution**: Run `npm start` in terminal

### Problem: All requests return 500
**Cause**: Missing environment variables  
**Solution**: Check .env file has SUPABASE_URL, SERVICE_ROLE_KEY, OPENAI_API_KEY

### Problem: Kernel endpoints fail
**Cause**: Missing valid nidHash or invalid parameters  
**Solution**: Check request body format in collection

### Problem: CRUD returns "Table not found"
**Cause**: Table name is wrong or table doesn't exist  
**Solution**: Use valid table names from database

---

## 📝 Quick Reference

### Most Important Endpoints
```bash
# Health
GET http://localhost:5000/health

# Database
GET http://localhost:5000/api/db-status

# Kernel Validation
POST http://localhost:5000/api/kernel/validate

# Get Users
GET http://localhost:5000/api/table/users

# Get Node Core
GET http://localhost:5000/api/table/node_core
```

### Common Parameters
```
limit=10          # Max records to return
offset=0          # Skip first N records
targetOwnerId=xxx # Filter by owner
nidHash=xxx       # Node identifier
```

---

## 🚀 Next Steps

1. **Import Collection** into Postman
2. **Run Health Check** to verify server
3. **Test CRUD Operations** on users table
4. **Test Kernel Endpoints** with valid nidHash
5. **Check Responses** for status codes
6. **Review Logs** if anything fails

---

## 📞 Support

**Server**: http://localhost:5000  
**Database**: Supabase (mantravat.cloud)  
**API Keys**: Configured in .env  
**Status**: ✅ Running and responding

For more details, see:
- VECTOR_SYSTEM_NAVIGATION.md (architecture)
- VECTOR_IMPLEMENTATION_GUIDE.md (detailed implementation)
- QUICK_SETUP_GUIDE.md (configuration)

---

**Collection Created**: January 29, 2026  
**Last Updated**: January 29, 2026  
**Status**: ✅ Ready for Testing
