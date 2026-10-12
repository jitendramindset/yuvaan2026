# 📋 POSTMAN TESTING GUIDE - Core Node Architecture Framework

## Quick Start (5 minutes)

### Step 1: Import Collection
1. Open Postman
2. Click "Import" button
3. Select `Core_Node_Architecture_Framework.postman_collection.json`
4. Collection will appear in your sidebar

### Step 2: Set Base URL (Optional)
1. Click on collection name
2. Go to "Variables" tab
3. Set `base_url` = `http://localhost:5000`

### Step 3: Run First Test
1. Expand "🔑 CORE NODE OPERATIONS"
2. Click "1️⃣ Validate Node Action"
3. Click "Send"
4. You should see a response in the bottom panel

---

## 🧪 TESTING PHASES (Recommended Order)

### PHASE 1: Core Validity (10 minutes)
**Goal**: Verify security gate and permission engine are working

#### Test 1.1: Validate Node
```
POST /api/kernel/validate
{
  "nidHash": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50",
  "targetOwnerId": "c75d0110-9085-4411-8e2d-f1c5274d7f07",
  "actionType": "execute",
  "requesterUuid": "702c6c73-9fc6-4e25-8919-c1e7b16342b0"
}
```
**Expected Response**: 200 OK with `{"valid": true/false, "reason": "..."}`

**What it does**:
- Checks if node exists in node_core
- Verifies node is ACTIVE (not archived)
- Checks trust score > 50
- Validates lifespan not expired
- Confirms permissions in node_permission_effective

---

#### Test 1.2: Check Permissions
```
GET /api/kernel/permissions/{nidHash}?targetOwnerId={targetOwnerId}
```
**Expected Response**: `{"can_read": true, "can_update": true, "can_execute": true}`

**What it does**:
- Queries node_permission_effective
- Returns effective permissions
- Checks expiration dates

---

#### Test 1.3: Read Trust State
```
GET /api/table/node_trust_state?limit=10
```
**Expected Response**: Array of trust records
```json
[{
  "nid_hash": "...",
  "trust_score": 50,
  "karma_score": 0,
  "last_update": "2026-01-28T15:30:00Z"
}]
```

**What it does**:
- Shows current trust snapshot
- Faster than querying full node_core
- Updated in real-time by apply_karma()

---

#### Test 1.4: Read Permission Rules
```
GET /api/table/node_permission_effective?limit=10
```
**Expected Response**: Permission records with can_read, can_execute, can_update

---

### ✅ Phase 1 Success Criteria
- ✓ All 4 tests return 200 status
- ✓ Node validation returns valid: true or false
- ✓ Permissions show can_execute: true or false
- ✓ Trust state shows numerical scores

**Move to Phase 2 if**: All tests pass

---

### PHASE 2: Kernel Test (20 minutes)
**Goal**: Execute actions and verify full kernel flow

#### Test 2.1: Execute Transaction (CORE KERNEL TEST)
```
POST /api/kernel/execute
{
  "nodeHash": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50",
  "action": "execute_transaction",
  "params": {
    "amount": 500,
    "recipient": "recipient-123",
    "actionType": "transfer"
  }
}
```

**Expected Response**: 200 OK
```json
{
  "executionId": "733039c1cd87a8460a97bce2b520c039",
  "status": "completed",
  "result": { /* execution result */ },
  "timestamp": "2026-01-28T15:45:30Z"
}
```

**What it does** (Core Kernel Flow):
1. **Validate**: Calls validate_node_action()
   - Check node exists
   - Check permissions
   - Check trust threshold
2. **Evaluate**: Calls evaluate_dharma()
   - Load dharma_rules
   - Calculate karma impact based on amount
   - Determine ethical compliance
3. **Ingest**: Calls node_event_ingest()
   - Insert into node_event_queue
   - Set status: "queued"
   - Trigger n8n webhook
4. **Log**: Insert into node_execution_log
   - Track action, status, params, result
5. **Return**: executionId + status

**Performance**: Typically 200-300ms

---

#### Test 2.2: Check Execution History
```
GET /api/kernel/execution/{nidHash}?limit=50
```

**Expected Response**: Array of execution records
```json
[{
  "id": "...",
  "action_type": "execute_transaction",
  "action_params": {"amount": 500, ...},
  "status": "success",
  "result": {...},
  "created_at": "2026-01-28T15:45:30Z"
}]
```

**What it does**:
- Reads node_execution_log
- Shows all actions taken by node
- Proves audit trail is working

---

#### Test 2.3: Evaluate Dharma Rules
```
POST /api/kernel/evaluate-dharma
{
  "nidHash": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50",
  "action": "execute",
  "targetOwnerId": "c75d0110-9085-4411-8e2d-f1c5274d7f07",
  "amount": 1000
}
```

**Expected Response**:
```json
{
  "ethical": true,
  "karmaImpact": 15,
  "trustImpact": 5,
  "rules": [
    {
      "principle": "non_maleficence",
      "severity": 2,
      "karma_impact": 15,
      "description": "Positive transfer detected"
    }
  ],
  "timestamp": "2026-01-28T15:46:00Z"
}
```

**What it does**:
- Reads dharma_rules table
- Matches rules for "execute" action
- Calculates impacts based on amount
- Returns matched rules

---

#### Test 2.4: Apply Positive Karma
```
POST /api/kernel/apply-karma
{
  "nidHash": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50",
  "actorOwnerId": "c75d0110-9085-4411-8e2d-f1c5274d7f07",
  "actionType": "positive_action",
  "karmaDelta": 15,
  "trustDelta": 5,
  "reason": "Successfully executed authorized transaction"
}
```

**Expected Response**:
```json
{
  "success": true,
  "newKarma": 15,
  "newTrust": 55,
  "logId": "uuid-123",
  "timestamp": "2026-01-28T15:46:30Z"
}
```

**What it does**:
1. Updates node_trust_state
   - karma_score += 15
   - trust_score += 5
2. Creates entry in node_karma_log
   - Records change
   - Stores reason
   - Notes who triggered it

**Try Different Values**:
- Positive: `"karmaDelta": 25, "trustDelta": 10` → Reputation boost
- Negative: `"karmaDelta": -10, "trustDelta": -5` → Reputation decrease
- Neutral: `"karmaDelta": 0, "trustDelta": 0` → Logging only

---

#### Test 2.5: Calculate Reputation Level
```
POST /api/kernel/calculate-reputation
{
  "nidHash": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50"
}
```

**Expected Response**: `"guardian"` or `"sage"` or `"elder"` or `"new"`

**What it does**:
- Reads node_trust_state (karma_score, trust_score)
- Calculates reputation_level:
  - **NEW**: karma < 10, trust < 30
  - **GUARDIAN**: karma >= 10, trust >= 30
  - **SAGE**: karma >= 50, trust >= 70
  - **ELDER**: karma >= 80, trust >= 90
- Updates node_core.reputation_level

**Test Progression**:
1. Start: reputation = "NEW" (karma 0, trust 50)
2. Apply +15 karma: still "NEW" (karma 15, trust 55)
3. Apply +40 karma: → "GUARDIAN" (karma 55, trust 60)
4. Apply +30 karma: → "SAGE" (karma 85, trust 75)

---

#### Test 2.6: Get Karma Log
```
GET /api/table/node_karma_log?limit=50
```

**Expected Response**: Array showing all karma changes
```json
[{
  "id": "...",
  "nid_hash": "ccb456e2d643...",
  "karma_delta": 15,
  "trust_delta": 5,
  "reason": "Successfully executed authorized transaction",
  "triggered_by": "c75d0110-9085-4411-8e2d-f1c5274d7f07",
  "action_type": "positive_action",
  "created_at": "2026-01-28T15:46:30Z"
}]
```

**What it does**:
- Shows complete reputation ledger
- Proves all changes are logged
- Enables audit trail

---

### ✅ Phase 2 Success Criteria
- ✓ Execute returns executionId (proves kernel works)
- ✓ Execution history shows all actions
- ✓ Dharma evaluation returns karma impact
- ✓ Karma update changes trust/karma scores
- ✓ Reputation calculation returns valid level

**Move to Phase 3 if**: All tests pass

---

### PHASE 3: Event Processing (15 minutes)
**Goal**: Queue events and verify n8n integration

#### Test 3.1: Ingest Event
```
POST /api/kernel/event-ingest
{
  "nidHash": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50",
  "eventType": "action_executed",
  "payload": {
    "action": "transfer",
    "amount": 1000,
    "recipient": "recipient-id-123",
    "timestamp": "2026-01-28T15:46:00Z"
  },
  "prevHash": "previous-event-hash-xyz"
}
```

**Expected Response**:
```json
{
  "eventId": "uuid-456",
  "status": "queued",
  "timestamp": "2026-01-28T15:46:00Z",
  "nid": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50"
}
```

**What it does**:
1. Inserts into node_event_queue
2. Sets status: "queued"
3. Stores payload as JSON
4. Stores prevHash (for event chain)
5. Triggers n8n webhook listener

**Why**: Event-driven pipeline for scalability
- UI doesn't wait for processing
- n8n workers handle async tasks
- Events processed in background

---

#### Test 3.2: Check Event Queue
```
GET /api/table/node_event_queue?limit=10
```

**Expected Response**: Events with status queued/processing/completed
```json
[{
  "event_id": "uuid-456",
  "nid_hash": "ccb456e2d643...",
  "event_type": "action_executed",
  "payload": {"action": "transfer", ...},
  "status": "processing",  // or "completed"
  "created_at": "2026-01-28T15:46:00Z",
  "processed_at": "2026-01-28T15:46:05Z"
}]
```

**What to watch**:
- Status should change: queued → processing → completed
- processed_at should be set once n8n picks it up

---

#### Test 3.3: Wait for Processing
```
Wait 5 seconds, then check event status again
```

**What happens**:
1. n8n worker receives webhook notification
2. Worker processes event
3. Updates status to "processing"
4. Executes any configured workflows
5. Updates status to "completed"

**If status is still "queued"**:
- n8n worker may not be running
- Check if webhook URL is configured
- Verify n8n can reach http://localhost:5000

---

#### Test 3.4: Check Event History
```
GET /api/kernel/events/{nidHash}?limit=50
```

**Expected Response**: All events for this node
```json
[{
  "event_id": "uuid-456",
  "event_type": "action_executed",
  "payload": {...},
  "status": "completed",
  "created_at": "2026-01-28T15:46:00Z"
}]
```

---

### ✅ Phase 3 Success Criteria
- ✓ Event ingest returns eventId
- ✓ Event appears in queue within 1 second
- ✓ Status changes to "processing" within 5 seconds
- ✓ Status changes to "completed" within 10 seconds (if n8n configured)

**Move to Phase 4 if**: Events are being processed

---

### PHASE 4: AI Queue (10 minutes)
**Goal**: Verify AI task queue integration

#### Test 4.1: Check AI Task Queue
```
GET /api/table/node_ai_task_queue?limit=10
```

**Expected Response**: AI tasks (if any exist)
```json
[{
  "task_id": "uuid-789",
  "nid_hash": "ccb456e2d643...",
  "task_type": "gpt4",
  "params": {
    "prompt": "Summarize the last transaction",
    "temperature": 0.7
  },
  "status": "completed",
  "result": {
    "summary": "Node transferred 1000 units...",
    "tokens_used": 127
  },
  "created_at": "2026-01-28T15:46:00Z"
}]
```

**What it tracks**:
- task_type: gpt4, claude, embedding, etc.
- status: queued, processing, completed, failed
- result: LLM response

---

#### Test 4.2: Queue AI Task (If Endpoint Exists)
```
POST /api/kernel/queue-ai-task
{
  "nidHash": "ccb456e2d643e0a0a8d8dcf6adde1220ffe714da5452457d3aa3abc3a8943f50",
  "taskType": "gpt4",
  "params": {
    "prompt": "Summarize the last 5 transactions",
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

**Expected Response**: `{ "taskId": "uuid-789", "status": "queued" }`

---

#### Test 4.3: Monitor AI Processing
```
Wait 10 seconds, then:
GET /api/table/node_ai_task_queue?limit=10
```

**What to watch**:
- Status changes: queued → processing → completed
- result field gets populated with LLM response
- tokens_used shows API cost

---

### ✅ Phase 4 Success Criteria
- ✓ AI task queue is accessible
- ✓ Tasks are created and queued
- ✓ Results appear after processing
- ✓ Error handling works for failed tasks

---

## 📊 COMPLETE FLOW TEST

### Execute All 4 Phases in Sequence

```bash
# Phase 1: Validate
POST /api/kernel/validate

# Phase 2: Execute
POST /api/kernel/execute

# Wait 10 seconds

# Phase 3: Check Results
GET /api/kernel/execution/{nidHash}

# Phase 4: Verify Event Queue
GET /api/table/node_event_queue?limit=10
```

**Expected Final State**:
- Execution log shows transaction
- Event queue shows event (status: completed)
- Karma updated in node_trust_state
- Reputation level recalculated

---

## 🐛 TROUBLESHOOTING

### Test 1: Connection Failed
```
Error: connect ECONNREFUSED
```
**Solution**: 
- Verify server is running: `npm start`
- Check port 5000 is accessible
- Check BASE_URL is correct

### Test 2: Unauthorized (401)
```
Error: {"message": "Unauthorized"}
```
**Solution**:
- Verify SERVICE_ROLE_KEY is set in .env
- Check key hasn't expired
- Verify Supabase project is still active

### Test 3: Node Not Found
```
Response: {"valid": false, "reason": "Node not found"}
```
**Solution**:
- Node doesn't exist in database
- Use a valid nidHash from node_core table
- First run: `GET /api/table/node_core?limit=5`
- Copy an existing nid_hash

### Test 4: Event Not Processing
```
Status stays "queued" for >30 seconds
```
**Solution**:
- n8n worker may not be running
- Check n8n logs
- Verify webhook is configured
- Try: `GET /health` to confirm server running

### Test 5: Reputation Not Updating
```
Response: {"newKarma": 15, "newTrust": 55} but node_core not updated
```
**Solution**:
- update_reputation() runs on calculate-reputation endpoint
- Call: `POST /api/kernel/calculate-reputation` after apply-karma
- Or check if node exists in database first

---

## 📈 PERFORMANCE METRICS

| Endpoint | Avg Response Time | Max Response Time |
|----------|-------------------|-------------------|
| /api/kernel/validate | 50-100ms | 200ms |
| /api/kernel/execute | 150-300ms | 500ms |
| /api/kernel/evaluate-dharma | 30-60ms | 100ms |
| /api/kernel/apply-karma | 20-40ms | 80ms |
| /api/kernel/calculate-reputation | 5-15ms | 30ms |
| /api/kernel/event-ingest | 10-20ms | 50ms |
| GET /api/table/* | 50-200ms | 500ms |

**Typical Flow Time**: 300-500ms (validate + execute + log)

---

## 🔒 SECURITY NOTES

### API Key Protection
- Never commit .env file to git
- SERVICE_ROLE_KEY has full database access
- Use restrictive RLS policies on tables
- All API calls use HTTPS in production

### Permission Checks
- All endpoints verify user permissions
- validate_node_action() is mandatory
- Permissions checked against node_permission_effective
- expired_at dates enforced

### Rate Limiting
- Recommended: 100 req/min per API key
- Implement in production environment
- Monitor for unusual patterns

---

## 🚀 NEXT STEPS

1. **Import Collection** into Postman
2. **Run Phase 1** (Core Validity)
3. **Run Phase 2** (Kernel Test)
4. **Run Phase 3** (Event Processing)
5. **Run Phase 4** (AI Queue)
6. **Document Results** in test report
7. **Configure n8n** for production
8. **Set up Monitoring** for kernel health

---

## 📞 SUPPORT

**Issues?** Check:
- ✓ Server running at localhost:5000
- ✓ Database connected
- ✓ SERVICE_ROLE_KEY valid
- ✓ nidHash exists in database
- ✓ Supabase API key has correct permissions

**Need more info?**
- Check logs: `npm run logs`
- Database inspection: `npm run inspect-db`
- API validation: `npm run validate-api`

---

**Last Updated**: 2026-01-28
**Framework**: Core Node Architecture v2.0
**Status**: READY FOR TESTING ✅
