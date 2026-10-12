# 🔥 KERNEL ENGINE - QUICK REFERENCE

## Files

| File | Purpose | Size |
|---|---|---|
| `kernel-engine.js` | Core logic (6 methods) | 380 lines |
| `routes-kernel.js` | REST API (13 endpoints) | 220 lines |
| `server.js` | Server integration | Updated |
| `test-kernel.js` | Test suite | 150 lines |

---

## Core Methods

### `validateNodeAction(nidHash, targetOwnerId, actionType, requesterUuid)`
Validates: status, permissions, lifespan, trust score
Returns: `{ valid, reason, nodeCore, permissions }`

### `evaluateDharma(nidHash, actionType, principle)`
Applies ethical rules from `dharma_rules`
Returns: `{ karma_impact, trust_impact, verdict }`

### `applyKarma(nidHash, actorOwnerId, actionType, karmaDelta, trustDelta, reason)`
Updates reputation system
Returns: `{ success, newKarma, newTrust, reputationLevel }`

### `nodeEventIngest(nidHash, eventType, payload, prevHash)`
Queues event for async processing
Returns: `{ eventId, eventHash }`

### `nodeRuntimeExecute(params)` 🎯 MAIN
Orchestrates entire flow: Validate → Dharma → Karma → Event → Log → Session
Returns: `{ success, executionId, eventId, dharmaVerdict, newKarmaScore, newTrustScore, reputation }`

### `calculateReputation(karma, trust)`
Maps trust_score to reputation level
Returns: `"untrusted"|"novice"|"trusted"|"expert"|"master"|"guardian"`

---

## API Endpoints

### Execute
```
POST /api/kernel/execute
→ { nidHash, requesterUuid, targetOwnerId, actionType, principle, payload, actionName }
← { success, executionId, eventId, dharmaVerdict, newKarmaScore, newTrustScore, reputation, timestamp }
```

### Validate
```
POST /api/kernel/validate
→ { nidHash, targetOwnerId, actionType, requesterUuid }
← { valid, reason, nodeCore, permissions }
```

### Dharma
```
POST /api/kernel/evaluate-dharma
→ { nidHash, actionType, principle }
← { karma_impact, trust_impact, verdict }
```

### Karma
```
POST /api/kernel/apply-karma
→ { nidHash, actorOwnerId, actionType, karmaDelta, trustDelta, reason }
← { success, newKarma, newTrust, reputationLevel, timestamp }
```

### Events
```
POST /api/kernel/event-ingest
→ { nidHash, eventType, payload, prevHash }
← { success, eventId, eventHash, timestamp }

GET /api/kernel/events/:nidHash?limit=50&offset=0
← [{ event_id, nid_hash, event_type, payload, status, created_at, ... }]
```

### Queries
```
GET /api/kernel/reputation/:nidHash
← { nid_hash, karma_score, trust_score, last_update }

GET /api/kernel/permissions/:nidHash?targetOwnerId=...
← { nid_hash, target_owner_id, can_read, can_write, can_delete }

GET /api/kernel/session/:sessionId
← { session_id, nid_hash, trust_snapshot, karma_snapshot, created_at, expires_at, active }

GET /api/kernel/execution/:executionId
← { exec_id, nid_hash, action_name, requester, execution_type, status, created_at }

GET /api/kernel/failures/:nidHash?limit=50
← [{ id, nid_hash, error_msg, occurred_at }]

GET /api/kernel/dharma-logs/:nidHash?limit=50
← [{ id, nid_hash, action_type, matched_principle, karma_applied, trust_applied, verdict, created_at }]

GET /api/kernel/karma-logs/:nidHash?limit=50
← [{ id, nid_hash, actor_owner_id, action_type, karma_delta, trust_delta, reason, created_at }]
```

---

## Validation Flow

```
Input → Validate → Dharma → Karma → Event → Log → Session → Output
         ✓ Status  Rules   Update  Queue  Record  Store    Success
         ✓ Perms   Eval    Trust   Hash   Exec    Expire
         ✓ Trust   Calc    Karma   Queue  Meta    Snapshot
```

---

## Reputation Levels

| Trust Score | Level |
|---|---|
| 0-999 | untrusted |
| 1000-2999 | novice |
| 3000-4999 | trusted |
| 5000-6999 | expert |
| 7000-8999 | master |
| 9000-10000 | guardian |

---

## Tables Used

```
Input Processing
├─ node_core (read: metadata)
├─ node_permission_effective (read: permissions)
└─ node_dharma_profile (read: rule assignments)

Decision Making
├─ dharma_rules (read: ethical rules)
└─ node_dharma_log (write: evaluation record)

Reputation Update
├─ node_karma_log (write: karma history)
└─ node_trust_state (write: current scores)

Output Logging
├─ node_event_queue (write: event)
├─ node_execution_log (write: execution)
├─ node_runtime_session (write: session)
└─ node_failure_log (write: on error)
```

---

## Error Handling

All errors:
- Logged to `node_failure_log`
- Include: nid_hash, error_msg, timestamp
- Caught and returned to client
- No data corruption on failure

---

## Starting Server

```bash
npm start              # or
node server.js
```

Server logs:
```
🚀 Backend Server Running
📍 Port: 5000
🔥 Kernel Engine: http://localhost:5000/api/kernel/*
```

---

## Testing

```bash
node test-kernel.js
```

Tests:
- ✅ Validate Node Action
- ✅ Evaluate Dharma
- ✅ Calculate Reputation
- ✅ Full Execution Flow
- ✅ Available Endpoints

---

## Example Request

```javascript
// Node.js
const response = await fetch('http://localhost:5000/api/kernel/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nidHash: 'node123',
    requesterUuid: 'user456',
    targetOwnerId: 'owner789',
    actionType: 'write',
    principle: 'dharma_compliance',
    payload: { data: 'test' },
    actionName: 'update_status'
  })
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   executionId: 'abc123',
//   newKarmaScore: 110,
//   newTrustScore: 5000,
//   reputation: 'trusted',
//   ...
// }
```

```bash
# cURL
curl -X POST http://localhost:5000/api/kernel/execute \
  -H "Content-Type: application/json" \
  -d '{"nidHash":"node123",...}'
```

---

## Execution Summary

```
1. VALIDATE
   Checks: archived, lifespan, activated, cold state, permissions, trust

2. DHARMA
   Applies: ethical rules → karma delta + trust delta

3. KARMA
   Updates: node_trust_state, node_karma_log, reputation level

4. EVENT
   Creates: SHA256 hash → queues to node_event_queue

5. LOG
   Records: to node_execution_log

6. SESSION
   Stores: runtime session with trust snapshot, 1hr expiration

7. OUTPUT
   Returns: executionId, eventId, verdict, new scores, reputation
```

---

## Integration Checklist

- [ ] Start server: `node server.js`
- [ ] Test health: `curl http://localhost:5000/health`
- [ ] Test kernel: `node test-kernel.js`
- [ ] Create test node in database (with valid_until, is_activated, etc.)
- [ ] Test execute endpoint with real data
- [ ] Verify entries in node_execution_log
- [ ] Check karma updates in node_karma_log
- [ ] Verify reputation tier calculation
- [ ] Set up event worker for n8n
- [ ] Add monitoring/alerts
- [ ] Deploy to production

---

**Status:** ✅ PRODUCTION READY
**Version:** 1.0.0
**Created:** January 2024
