# N8N Kernel Workflows Reference

Complete documentation of all n8n workflows integrated with the Kernel API.

## Architecture Overview

```
                    ┌─────────────────┐
                    │  Kernel API     │
                    │  /kernel/       │
                    │  execute        │
                    └────────┬────────┘
                             │
                    (publishes event)
                             │
                    ┌────────▼────────┐
                    │   n8n Queue     │
                    │   Consumer      │
                    │   (webhook)     │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
      ┌───▼───┐         ┌────▼────┐      ┌─────▼─────┐      ┌────────┐
      │  AI   │         │ Memory  │      │Automation │      │Notif   │
      │Worker │         │Worker   │      │Engine     │      │Worker  │
      └───┬───┘         └────┬────┘      └─────┬─────┘      └────┬───┘
          │                  │                  │                 │
          └──────────────────┼──────────────────┴─────────────────┘
                             │
                    (results to Supabase)
                             │
                    ┌────────▼────────┐
                    │   node_event_   │
                    │   queue (marked │
                    │   processed)    │
                    └─────────────────┘
```

---

## 1. Queue Consumer Workflow

**File**: `n8n-kernel-queue-consumer.json`

**Purpose**: Main webhook entry point that receives all events from Kernel API and routes them to appropriate workers.

**Trigger Type**: Webhook (POST)

**Webhook Path**: `/webhook/kernel-events`

**Entry Point Format**:
```json
{
  "event_type": "ai_task_created|memory_write_pending|automation_triggered",
  "event_id": "evt_1234567890",
  "request_id": "req_xyz",
  "user_id": "12345",
  "business_id": "67890",
  "payload": { /* event-specific data */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Processing Steps**:

1. **Webhook Node** - Receives POST request from Kernel
2. **Code Node (Extract)** - Parses event and extracts:
   - `event_type` (string)
   - `user_id` (UUID)
   - `business_id` (UUID)
   - `payload` (object)
   - `event_id` (string)

3. **Switch Node** - Routes by event_type:
   - `ai_task_created` → AI Task Worker webhook
   - `memory_write_pending` → Memory Persistence Worker webhook
   - `automation_triggered` → Automation Engine webhook
   - `notification_queued` → Notification Worker webhook

4. **HTTP Request Nodes** (4 parallel) - Call worker webhooks:
   ```
   POST /webhook/ai-task-worker
   POST /webhook/memory-worker
   POST /webhook/automation-engine
   POST /webhook/notification-worker
   ```

5. **Postgres Node** - Mark event as processed:
   ```sql
   UPDATE node_event_queue 
   SET status = 'processed', processed_at = NOW()
   WHERE event_id = $1
   ```

6. **Response Node** - Return 200 OK:
   ```json
   {
     "status": "event_routed",
     "event_id": "evt_xxx",
     "workers_triggered": ["ai", "memory", "automation"]
   }
   ```

**Error Handling**:
- If webhook fails: Retry up to 3 times with exponential backoff
- If route invalid: Log to `node_event_queue` with status "failed"
- If Postgres fails: Still return 200 (log failure for manual review)

**Performance**:
- Webhook response time: < 100ms (async workers triggered in parallel)
- Supports: 1000+ events/second (n8n horizontal scaling)

**Configuration Required**:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kernel-events
POSTGRES_CONNECTION=supabase_connection
```

---

## 2. AI Task Worker Workflow

**File**: `n8n-ai-task-worker.json`

**Purpose**: Process AI tasks asynchronously using OpenAI API without blocking Kernel response.

**Trigger Type**: Webhook (POST) from Queue Consumer

**Webhook Path**: `/webhook/ai-task-worker`

**Input Format**:
```json
{
  "event_type": "ai_task_created",
  "user_id": "12345",
  "business_id": "67890",
  "payload": {
    "task_id": "9876",
    "model": "gpt-4-turbo",
    "system_prompt": "You are a helpful assistant...",
    "prompt": "What is the capital of France?",
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

**Processing Steps**:

1. **Webhook Node** - Receives event from Queue Consumer

2. **Code Node (Get Task)** - Fetch task details from DB:
   ```sql
   SELECT * FROM node_ai_task_queue 
   WHERE id = $1 AND status = 'pending'
   ```

3. **OpenAI Node** - Call OpenAI API:
   ```json
   {
     "model": "${payload.model}",
     "messages": [
       { "role": "system", "content": "${payload.system_prompt}" },
       { "role": "user", "content": "${payload.prompt}" }
     ],
     "temperature": ${payload.temperature},
     "max_tokens": ${payload.max_tokens}
   }
   ```

4. **Code Node (Extract Result)** - Parse response:
   - Extract `content` from first choice
   - Extract `usage.total_tokens`
   - Extract `model` and `finish_reason`

5. **Postgres Node (Update Task)** - Mark task completed:
   ```sql
   UPDATE node_ai_task_queue 
   SET status = 'completed', 
       result = $1,
       tokens_used = $2,
       completed_at = NOW(),
       model_used = $3
   WHERE id = $4
   ```

6. **Postgres Node (Reward)** - Give karma to user:
   ```sql
   UPDATE node_trust_state 
   SET karma_points = karma_points + 5,
       ai_usage_count = ai_usage_count + 1
   WHERE user_id = $1
   ```

7. **Email Node (Optional)** - Notify user of completion:
   ```
   From: system@botmantra.com
   To: user_email
   Subject: AI Task Completed
   Body: Your task has been processed. Result: {result}
   ```

8. **Response Node** - Return 200 OK

**Error Handling**:

If OpenAI API fails:
```sql
UPDATE node_ai_task_queue 
SET status = 'failed', 
    error_message = $1,
    failed_at = NOW()
WHERE id = $2
```

If task not found:
- Log to Postgres error table
- Return 404

If rate limited:
- Retry with exponential backoff
- Max 3 retries

**Environment Variables Required**:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

**Performance**:
- Execution time: 3-20 seconds (depends on OpenAI API)
- Parallel tasks: 10-50 concurrent (based on OpenAI tier)
- Cost per task: $0.01-$0.10 (depends on tokens)

**Success Metrics**:
- Task completion rate: > 99%
- Average response time: < 10 seconds
- Token cost tracking: All recorded in DB

---

## 3. Memory Persistence Worker Workflow

**File**: `n8n-memory-persistence-worker.json`

**Purpose**: Asynchronously persist chat messages to database without blocking chat API response.

**Trigger Type**: Webhook (POST) from Queue Consumer

**Webhook Path**: `/webhook/memory-worker`

**Input Format**:
```json
{
  "event_type": "memory_write_pending",
  "user_id": "12345",
  "business_id": "67890",
  "payload": {
    "role": "user|assistant",
    "message": "What is machine learning?",
    "session_id": "sess_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Processing Steps**:

1. **Webhook Node** - Receives event from Queue Consumer

2. **Code Node (Validate)** - Validate message:
   - Check user exists in `node_users`
   - Check session exists in `ai_chat_sessions`
   - Validate message length (max 10,000 chars)
   - Validate role is `user` or `assistant`

3. **Postgres Node (Insert Message)** - Save to history:
   ```sql
   INSERT INTO ai_chat_messages 
   (user_id, business_id, session_id, role, message, tokens_estimate)
   VALUES ($1, $2, $3, $4, $5, LENGTH($5)/4)
   RETURNING id, created_at
   ```

4. **Postgres Node (Get Statistics)** - Count messages:
   ```sql
   SELECT COUNT(*) as total_messages,
          SUM(tokens_estimate) as total_tokens
   FROM ai_chat_messages 
   WHERE session_id = $1
   ```

5. **Postgres Node (Update Activity)** - Track user engagement:
   ```sql
   UPDATE node_trust_state 
   SET last_activity_at = NOW(),
       message_count = message_count + 1,
       total_interaction_time = total_interaction_time + 
         EXTRACT(EPOCH FROM (NOW() - last_activity_at))
   WHERE user_id = $1
   ```

6. **Postgres Node (Check Milestones)** - Award achievements:
   ```sql
   -- If message_count = 100:
   UPDATE node_trust_state 
   SET karma_points = karma_points + 50
   WHERE user_id = $1
   ```

7. **Response Node** - Return confirmation:
   ```json
   {
     "status": "message_persisted",
     "message_id": "msg_123",
     "total_messages_in_session": 42
   }
   ```

**Error Handling**:

If insertion fails:
```sql
INSERT INTO node_event_queue 
(event_type, status, error_message, payload)
VALUES ('memory_persistence_failed', 'failed', 
        'DB Error: ' || $1, $2)
```

If session invalid:
- Log to error queue
- Alert admin

**Performance**:
- Write latency: < 100ms
- Parallel writes: 1000+ concurrent
- Storage efficiency: Compressed message archive

**Data Retention**:
- Active messages: Keep indefinitely
- Archived messages: 90 days (archive to cold storage)
- Cleanup: Automated daily at 2 AM UTC

---

## 4. Automation Engine Workflow

**File**: `n8n-automation-engine.json`

**Purpose**: Execute flexible automations (email, webhooks, database operations) triggered by Kernel events.

**Trigger Type**: Webhook (POST) from Queue Consumer

**Webhook Path**: `/webhook/automation-engine`

**Input Format**:
```json
{
  "event_type": "automation_triggered",
  "user_id": "12345",
  "business_id": "67890",
  "payload": {
    "action_type": "send_email|webhook_call|create_record|update_record",
    "action_params": { /* type-specific params */ }
  }
}
```

### 4A. Send Email Action

**Parameters**:
```json
{
  "action_type": "send_email",
  "recipient": "user@example.com",
  "subject": "Your AI Result",
  "template": "ai_completion",
  "context": {
    "result": "...",
    "user_name": "John",
    "timestamp": "..."
  }
}
```

**Processing**:
1. Validate recipient email
2. Render template with context
3. Send via SendGrid
4. Log to `node_automation_log`

**Configuration**:
```env
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@botmantra.com
```

### 4B. Webhook Call Action

**Parameters**:
```json
{
  "action_type": "webhook_call",
  "webhook_url": "https://external-service.com/webhook",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer token",
    "X-Custom": "value"
  },
  "body": {
    "event": "task_completed",
    "data": { /* full context */ }
  }
}
```

**Processing**:
1. Validate webhook URL (security check)
2. Set request timeout (30 seconds)
3. Retry up to 3 times on failure
4. Log request/response to audit table
5. Store response for inspection

### 4C. Create Record Action

**Parameters**:
```json
{
  "action_type": "create_record",
  "table": "node_notifications",
  "data": {
    "user_id": "12345",
    "type": "ai_complete",
    "title": "Your task is done",
    "content": "...",
    "read": false
  }
}
```

**Processing**:
1. Validate table exists (whitelist: node_notifications, node_activity_log, etc)
2. Validate data types match table schema
3. INSERT into specified table
4. Return created record ID

### 4D. Update Record Action

**Parameters**:
```json
{
  "action_type": "update_record",
  "table": "node_tasks",
  "where": {
    "id": "task_123"
  },
  "data": {
    "status": "completed",
    "result": "...",
    "completed_at": "2024-01-15T10:30:00Z"
  }
}
```

**Processing**:
1. Validate table and columns exist
2. Validate WHERE clause is safe
3. UPDATE specified records
4. Return count of updated rows

---

## 5. Notification Worker Workflow (Future)

**File**: `n8n-notification-worker.json` (to be created)

**Purpose**: Send real-time notifications (push, SMS, Slack) for important events.

**Trigger Types**:
- `notification_queued` - From Queue Consumer
- `urgent_alert` - Direct from Kernel

**Notification Channels**:
- Push notifications (Firebase Cloud Messaging)
- SMS (Twilio)
- Slack messages (workspace webhook)
- Email notifications (SendGrid)
- In-app notifications (stored in `node_notifications`)

**Example Configuration**:
```json
{
  "event_type": "notification_queued",
  "payload": {
    "user_id": "12345",
    "channel": "push|sms|slack|email",
    "title": "AI Task Complete",
    "message": "Your analysis is ready",
    "data": {
      "task_id": "task_123",
      "result_url": "..."
    }
  }
}
```

---

## Integration Checklist

- [ ] All 4 workflows imported into n8n
- [ ] Supabase connection configured in n8n UI
- [ ] OpenAI API key configured in n8n secrets
- [ ] SendGrid API key configured (if using email actions)
- [ ] Webhook URLs verified responding
- [ ] Test event published from Kernel
- [ ] Event received by Queue Consumer
- [ ] Worker executed successfully
- [ ] Result persisted to Supabase
- [ ] Error handling tested (network, API, DB failures)
- [ ] Performance verified (concurrent load test)
- [ ] Monitoring dashboard created
- [ ] Alerts configured for failures

---

## Monitoring Queries

### Check Queue Depth

```sql
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM node_event_queue
GROUP BY status
```

### Monitor Worker Performance

```sql
SELECT 
  DATE_TRUNC('minute', processed_at) as minute,
  COUNT(*) as processed,
  ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at))), 2) as avg_latency_sec
FROM node_event_queue
WHERE status = 'processed'
GROUP BY DATE_TRUNC('minute', processed_at)
ORDER BY minute DESC
LIMIT 60
```

### Check AI Task Success Rate

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as percentage,
  ROUND(AVG(tokens_used), 0) as avg_tokens
FROM node_ai_task_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
```

### Automation Audit Log

```sql
SELECT 
  created_at,
  automation_type,
  status,
  COUNT(*) as count
FROM node_automation_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), automation_type, status
ORDER BY created_at DESC
```

---

## Troubleshooting

### Queue Consumer Not Receiving Events

**Symptom**: Events published but no webhook called

**Diagnosis**:
```sql
SELECT * FROM node_event_queue 
WHERE created_at > NOW() - INTERVAL '1 hour'
LIMIT 10
```

**Solution**:
1. Check Kernel API logs for errors
2. Verify N8N_WEBHOOK_URL environment variable in Kernel
3. Check n8n webhook URL accessible from Kernel server
4. Test with curl:
   ```bash
   curl -X POST http://localhost:5678/webhook/kernel-events \
     -H "Content-Type: application/json" \
     -d '{"event_type":"test","event_id":"evt_test"}'
   ```

### AI Worker Not Completing Tasks

**Symptom**: Tasks stuck in "pending" status

**Diagnosis**:
```sql
SELECT * FROM node_ai_task_queue 
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '5 minutes'
```

**Solution**:
1. Check OpenAI API key configured in n8n
2. Check OpenAI rate limits (might be exceeded)
3. Check n8n AI Task Worker logs for errors
4. Verify Postgres connection in n8n working
5. Check OpenAI account has credits/active subscription

### Memory Not Persisting

**Symptom**: Chat messages disappear after page refresh

**Diagnosis**:
```sql
SELECT * FROM node_event_queue 
WHERE event_type = 'memory_write_pending'
AND status = 'failed'
ORDER BY created_at DESC
LIMIT 10
```

**Solution**:
1. Check Memory Worker webhook accessible
2. Verify user/session IDs valid in payload
3. Check ai_chat_messages table has disk space
4. Review n8n Memory Worker error logs

### Automation Not Executing

**Symptom**: Emails not sent, webhooks not called

**Diagnosis**:
```sql
SELECT * FROM node_automation_log 
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10
```

**Solution**:
1. Check SendGrid API key (if sending email)
2. Check webhook URL is accessible
3. Check action_type is valid (send_email, webhook_call, etc)
4. Review n8n Automation Engine logs
5. Verify table/column names for create/update actions

---

## Performance Tuning

### Increase Concurrent Workers

In n8n UI:
1. Settings → Execution → Concurrency → Set to 20-50 (depending on server resources)
2. Restart n8n for changes to take effect

### Database Optimization

Create indexes:
```sql
CREATE INDEX idx_event_queue_status ON node_event_queue(status);
CREATE INDEX idx_ai_task_queue_user ON node_ai_task_queue(user_id, status);
CREATE INDEX idx_chat_messages_session ON ai_chat_messages(session_id);
```

### Monitor Resource Usage

In n8n UI:
- Settings → Debug → Enable Execution History
- Check max execution time for each workflow
- Archive old executions: Settings → Auto-cleanup

---

## Security Considerations

### Webhook Verification

All n8n webhooks should validate:
1. Request comes from known Kernel server (IP whitelist)
2. Request contains valid event signature
3. User ID and business ID belong to authenticated user

### API Key Rotation

- Rotate OpenAI key every 90 days
- Rotate SendGrid key every 90 days
- Rotate n8n admin password monthly

### Data Encryption

- Enable encryption for Supabase connection in n8n
- Use HTTPS for all webhook calls (enforce TLS 1.2+)
- Encrypt sensitive data in node_event_queue payload

---

## Version History

- **v1.0** - Initial 4 core workflows (Queue Consumer, AI Worker, Memory Worker, Automation Engine)
- **v1.1** (Coming) - Notification Worker + SMS/Push support
- **v1.2** (Coming) - Advanced routing + conditional workflows
- **v2.0** (Coming) - Multi-tenant support + business-specific automation rules

---

## Support & Documentation

- **Setup Guide**: [N8N_KERNEL_SETUP_GUIDE.md](./N8N_KERNEL_SETUP_GUIDE.md)
- **Kernel Integration**: [kernel-n8n-bridge.js](./kernel-n8n-bridge.js)
- **API Docs**: [KERNEL_API_COMPLETE.md](./KERNEL_API_COMPLETE.md)
- **n8n Official Docs**: https://docs.n8n.io
