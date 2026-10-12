# Kernel API ↔ N8N Integration Patch

This document shows how to integrate the `kernel-n8n-bridge.js` into the existing `routes/kernel-execute.js` to enable async event publishing to n8n workers.

## Changes Required

### 1. Add Import at Top of kernel-execute.js

**Location**: Line 22 (after existing requires)

```javascript
const KernelN8nBridge = require('../kernel-n8n-bridge');
```

### 2. Initialize Bridge After Supabase Client

**Location**: Line 30 (after supabase client initialization)

```javascript
// Initialize n8n bridge for async event processing
const n8nBridge = new KernelN8nBridge({
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
  supabase,
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 5000
});
```

### 3. Replace Event Publishing Logic

**Location**: Lines 228-241 (STEP 6: EVENT LOGGING + QUEUE PUBLISHING)

**OLD CODE**:
```javascript
// Publish async events if needed
if (actionResult.asyncEvents && actionResult.asyncEvents.length > 0) {
  for (const event of actionResult.asyncEvents) {
    await supabase
      .from('node_event_queue')
      .insert({
        business_id: businessId,
        event_type: event.type,
        payload: event.payload,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to queue event:', err));
  }
}
```

**NEW CODE**:
```javascript
// Publish async events to n8n workers via bridge
if (actionResult.asyncEvents && actionResult.asyncEvents.length > 0) {
  for (const event of actionResult.asyncEvents) {
    n8nBridge.publishEvent(
      event.type,
      event.payload,
      {
        requestId,
        userId,
        businessId
      }
    )
    .catch(err => console.error('Failed to publish event to n8n:', err));
  }
}

// Also publish Kernel-specific events
if (action === 'chat' && actionResult.needsAIProcessing) {
  n8nBridge.createAITask({
    userId,
    businessId,
    prompt: actionResult.aiPrompt,
    systemPrompt: actionResult.systemPrompt || 'You are a helpful assistant.',
    model: actionResult.model || 'gpt-4-turbo',
    temperature: actionResult.temperature || 0.7,
    maxTokens: actionResult.maxTokens || 2000,
    requestId
  })
  .catch(err => console.error('Failed to create AI task:', err));
}

if (action === 'chat' && actionResult.persistChat) {
  n8nBridge.queueMemoryWrite({
    userId,
    businessId,
    sessionId: actionResult.sessionId,
    role: actionResult.role || 'user',
    message: actionResult.message,
    requestId
  })
  .catch(err => console.error('Failed to queue memory write:', err));
}

if (action === 'automation' && actionResult.automationAction) {
  n8nBridge.queueAutomation({
    userId,
    businessId,
    actionType: actionResult.automationAction.type,
    actionParams: actionResult.automationAction.params,
    requestId
  })
  .catch(err => console.error('Failed to queue automation:', err));
}
```

## Environment Variables

Add to `.env`:

```bash
# N8N Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kernel-events
N8N_RETRY_ATTEMPTS=3
N8N_RETRY_DELAY=1000
N8N_TIMEOUT=5000

# OpenAI (for n8n AI workers)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# SendGrid (for n8n automation engine)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@botmantra.com
```

## Testing the Integration

### 1. Verify n8n is Running

```bash
curl http://localhost:5678/api/v1/workflows
```

Should return 200 with workflow list.

### 2. Test Event Publishing

```bash
curl -X POST http://localhost:3000/kernel/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "chat",
    "params": {
      "message": "What is machine learning?",
      "sessionId": "sess_123"
    }
  }'
```

### 3. Check Event Queue

```sql
SELECT * FROM node_event_queue 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Verify n8n Webhook Received Event

In n8n UI:
1. Open Queue Consumer workflow
2. Click on Webhook node
3. Check "Logs" tab - should show recent webhook calls

### 5. Monitor AI Task Queue

```sql
SELECT * FROM node_ai_task_queue 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 5;
```

Should show:
- `pending` tasks (waiting for worker)
- `completed` tasks (processed by OpenAI)
- `failed` tasks (if any errors)

## Deployment Checklist

- [ ] `kernel-n8n-bridge.js` added to project
- [ ] `KernelN8nBridge` imported in `kernel-execute.js`
- [ ] n8nBridge initialized after Supabase client
- [ ] Event publishing code replaced with bridge calls
- [ ] Environment variables configured
- [ ] n8n running and accessible
- [ ] All 4 workflows imported into n8n
- [ ] Test event published and received
- [ ] Check logs for errors
- [ ] Verify results in Supabase tables
- [ ] Load test with 100+ concurrent events
- [ ] Monitor memory/CPU usage

## Rolling Back

If issues occur:

1. **Revert code changes**: Restore original event publishing logic
2. **Keep direct DB inserts**: Events will write to `node_event_queue` directly
3. **Disable n8n**: Stop n8n server (events won't be processed but API still works)
4. **Clear queue**: Delete stuck events from `node_event_queue`

## Performance Impact

**Before n8n Integration**:
- Kernel response time: 50-200ms (depends on action complexity)
- No background processing

**After n8n Integration**:
- Kernel response time: 50-200ms (unchanged - events sent async)
- Background tasks start within 1-2 seconds
- Parallel workers (10-50) processing events

**Example Flow**:
```
0ms: Request received by Kernel
50ms: Action executed, response returned to client (NO WAIT)
100ms: Event queued to n8n
105ms: Event published to n8n webhook
500ms: n8n worker receives event and starts processing
2000ms: AI response from OpenAI, result stored in DB
```

Client gets instant response while work happens in background!

## Troubleshooting

### n8n Webhook Not Responding

```bash
# Check n8n is running
curl http://localhost:5678/api/v1/workflows

# Check specific webhook
curl http://localhost:5678/webhook/kernel-events \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Events Not Reaching Workers

1. Check Queue Consumer webhook is active (n8n UI: Workflow → Active checkbox)
2. Verify switch node routing logic
3. Check worker webhook URLs are correct

### AI Tasks Stuck in "Pending"

1. Verify OpenAI API key configured in n8n
2. Check n8n AI Task Worker logs
3. Check OpenAI account has active credits
4. Test OpenAI API directly:
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer sk-..." \
     -d '{"model":"gpt-4-turbo","messages":[{"role":"user","content":"test"}]}'
   ```

### Memory Not Persisting

1. Verify Supabase connection in n8n
2. Check `ai_chat_messages` table exists
3. Review Memory Worker logs for SQL errors
4. Manually test insert:
   ```sql
   INSERT INTO ai_chat_messages (user_id, business_id, session_id, role, message)
   VALUES (uuid, uuid, 'sess_123', 'user', 'test message');
   ```

## Next Steps

1. **Deploy**: Follow deployment checklist above
2. **Test**: Run test suite (`npm test -- n8n-integration.test.js`)
3. **Monitor**: Set up alerts for failed events
4. **Scale**: Increase n8n worker concurrency as load increases
5. **Extend**: Add custom workflows for your specific automations
