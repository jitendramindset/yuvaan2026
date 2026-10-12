# N8N KERNEL AUTOMATION LAYER SETUP GUIDE

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-02-03

---

## Overview

This guide connects your Kernel API to n8n for asynchronous event processing and automation.

**Architecture**:
```
Kernel API (sync)
    ↓ emits events to node_event_queue
    ↓
n8n Queue Consumer (webhook)
    ↓ routes by event type
    ↓
n8n Workers (async)
  ├─ AI Task Worker (calls OpenAI, stores results)
  ├─ Memory Persistence Worker (saves chat history)
  ├─ Automation Engine (sends emails, webhooks, creates records)
  └─ Notification Engine (sends notifications)
    ↓
Results persisted to Supabase
    ↓
Kernel reads results on next user request
```

---

## Prerequisites

- [x] Kernel API deployed and running
- [x] Supabase instance with all tables
- [x] n8n self-hosted or cloud (https://n8n.io)
- [x] OpenAI API key (for AI tasks)
- [x] SendGrid account (for email)
- [ ] Environment variables configured

---

## Installation Steps

### Step 1: Install n8n (if not already)

**Docker (Recommended)**:
```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Then access**: http://localhost:5678

**Manual Installation**:
```bash
npm install -g n8n
n8n start
```

### Step 2: Configure Environment Variables

Create `.env.n8n`:
```
N8N_WEBHOOK_BASE=http://localhost:5678/webhook
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_SECURE_COOKIE=false

# Database
DB_POSTGRESDB_HOST=your-supabase-host
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your-password

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@botmantra.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 3: Create Supabase Connection in n8n

1. In n8n UI, go to **Credentials**
2. Click **+ New**
3. Search for **Postgres**
4. Configure:
   ```
   Host: your-supabase-host
   Port: 5432
   Database: postgres
   User: postgres
   Password: (from Supabase settings)
   SSL: true
   ```
5. Test connection
6. Save as "Supabase Production"

### Step 4: Import Workflows

4 workflows to import:

#### 4.1 Queue Consumer & Router
1. In n8n, go to **Workflows**
2. Click **+ Create New**
3. Open the JSON editor
4. Copy content from `n8n-kernel-queue-consumer.json`
5. Click **Import**
6. Test webhook URL: Copy the webhook URL (you'll need it)

#### 4.2 AI Task Worker
1. Create new workflow
2. Import from `n8n-ai-task-worker.json`
3. Verify OpenAI credentials configured
4. Set to **Active**

#### 4.3 Memory Persistence Worker
1. Create new workflow
2. Import from `n8n-memory-persistence-worker.json`
3. Verify Supabase credentials
4. Set to **Active**

#### 4.4 Automation Engine
1. Create new workflow
2. Import from `n8n-automation-engine.json`
3. Configure SendGrid credentials
4. Set to **Active**

### Step 5: Webhook URL Configuration

From Queue Consumer workflow, copy webhook URL:
```
http://your-n8n-host:5678/webhook/kernel-events
```

Add to Kernel API:

**In routes/kernel-execute.js**, add after event logging:
```javascript
// Publish to n8n webhook
if (process.env.N8N_WEBHOOK_URL) {
  fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: action,
      event_id: `evt_${Date.now()}_${userId.slice(0,8)}`,
      request_id: requestId,
      user_id: userId,
      business_id: businessId,
      payload: { ...payload }
    })
  }).catch(err => console.error('n8n webhook error:', err));
}
```

### Step 6: Add Required Tables

If these tables don't exist, create them:

```sql
-- Automation logging
CREATE TABLE IF NOT EXISTS node_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  user_id UUID,
  business_id UUID,
  action_type TEXT,
  status TEXT,
  result JSONB,
  executed_at TIMESTAMP
);

-- AI task queue
CREATE TABLE IF NOT EXISTS node_ai_task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  model TEXT DEFAULT 'gpt-4-turbo',
  system_prompt TEXT,
  prompt TEXT NOT NULL,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 2000,
  status TEXT DEFAULT 'pending',
  result TEXT,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  attempted_at TIMESTAMP
);

-- Event queue
CREATE TABLE IF NOT EXISTS node_event_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,
  event_type TEXT,
  request_id TEXT,
  user_id UUID,
  business_id UUID,
  status TEXT DEFAULT 'pending',
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages (for memory)
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  session_id TEXT,
  role TEXT,
  content TEXT,
  request_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 7: Test Integration

**Test Flow**:
1. Start Kernel API: `npm start`
2. Make a request to `/kernel/execute`:
```bash
curl -X POST http://localhost:5000/kernel/execute \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "chat",
    "payload": {
      "message": "Hello AI",
      "task_queue": true
    }
  }'
```

3. Check n8n workflow executions
4. Verify queue consumer webhook was triggered
5. Check node_event_queue table for processed events
6. Verify results persisted to appropriate tables

---

## Workflow Details

### 1. Queue Consumer & Router

**Purpose**: Receives events from Kernel, routes to appropriate worker

**Flow**:
```
Webhook Trigger
    ↓
Extract Event (event_type, user_id, payload)
    ↓
Route by Event Type
    ├─ ai_task_created → AI Task Worker
    ├─ memory_write_pending → Memory Worker
    ├─ automation_triggered → Automation Engine
    └─ notification_queued → Notification Engine
    ↓
Mark Event Processed in node_event_queue
```

**Webhook URL**: Copy from workflow

**Expected Payload**:
```json
{
  "event_type": "ai_task_created",
  "event_id": "evt_xxx",
  "request_id": "req_xxx",
  "user_id": "user_uuid",
  "business_id": "business_uuid",
  "payload": { ... }
}
```

### 2. AI Task Worker

**Purpose**: Execute AI tasks asynchronously

**Flow**:
```
Webhook Trigger (from Queue Consumer)
    ↓
Get Task from node_ai_task_queue
    ↓
Call OpenAI API
    ↓
Extract Result
    ↓
Update Task Status (completed/failed)
    ↓
Reward User Karma
```

**Input**:
```json
{
  "payload": {
    "task_id": "uuid",
    "model": "gpt-4-turbo",
    "system_prompt": "...",
    "prompt": "...",
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

**Output**:
```json
{
  "status": "completed",
  "result": "AI response text",
  "tokens_used": 1234
}
```

### 3. Memory Persistence Worker

**Purpose**: Async save chat messages to ai_chat_messages

**Flow**:
```
Webhook Trigger
    ↓
Prepare Message (extract text, role, session)
    ↓
Insert into ai_chat_messages
    ↓
Get Message Stats
    ↓
Update User Activity
```

**Input**:
```json
{
  "payload": {
    "message": "User said this",
    "role": "user",
    "session_id": "session_uuid"
  }
}
```

### 4. Automation Engine

**Purpose**: Execute automations (email, webhooks, DB records)

**Flow**:
```
Webhook Trigger
    ↓
Route by Action Type
    ├─ send_email → SendGrid
    ├─ webhook_call → HTTP Call
    ├─ create_record → INSERT
    └─ update_record → UPDATE
    ↓
Log Automation Execution
```

**Input Examples**:

**Send Email**:
```json
{
  "payload": {
    "action_type": "send_email",
    "email": "user@example.com",
    "subject": "Hello",
    "body": "<html>...</html>"
  }
}
```

**Create Record**:
```json
{
  "payload": {
    "action_type": "create_record",
    "table_name": "orders",
    "columns": ["user_id", "total"],
    "values": { "user_id": "uuid", "total": 99.99 }
  }
}
```

---

## Monitoring

### Check Workflow Executions

In n8n UI:
1. Click workflow name
2. See execution history
3. Click execution to see details

### Monitor from Database

```sql
-- Recent events
SELECT event_id, event_type, status, processed_at
FROM node_event_queue
ORDER BY processed_at DESC
LIMIT 20;

-- Failed automations
SELECT * FROM node_automation_log
WHERE status = 'failed'
ORDER BY executed_at DESC;

-- AI task queue status
SELECT status, COUNT(*) as count
FROM node_ai_task_queue
GROUP BY status;
```

### Health Check

```bash
# Check n8n is running
curl http://localhost:5678/

# Check Queue Consumer webhook
curl -X POST http://localhost:5678/webhook/kernel-events \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Troubleshooting

### Webhook Not Triggering

**Issue**: Events not reaching n8n

**Solution**:
1. Verify webhook URL in Kernel code
2. Check n8n logs: `docker logs <container_id>`
3. Test manually:
```bash
curl -X POST http://localhost:5678/webhook/kernel-events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "ai_task_created",
    "event_id": "test_123",
    "user_id": "user_123",
    "business_id": "business_123",
    "payload": {}
  }'
```

### Supabase Connection Error

**Issue**: Workflows can't connect to database

**Solution**:
1. Go to n8n Credentials
2. Test "Supabase Production" connection
3. Check host, port, credentials
4. Verify network access (if self-hosted)

### OpenAI API Error

**Issue**: AI tasks failing

**Solution**:
1. Verify OPENAI_API_KEY is set
2. Check API key is valid (https://platform.openai.com/account/api-keys)
3. Verify account has credits
4. Check model name is valid (gpt-4-turbo, gpt-4, gpt-3.5-turbo)

### SendGrid Email Not Sending

**Issue**: Email actions failing

**Solution**:
1. Verify SENDGRID_API_KEY is set
2. Check from email is verified in SendGrid
3. Verify to email is valid
4. Check spam folder

---

## Performance Tuning

### Queue Processing Speed

**Increase Webhook Concurrency** (in n8n settings):
```
Execution Mode: Queue + Workers
Max Concurrency: 10
```

### Database Performance

Add indexes for frequently queried columns:
```sql
CREATE INDEX idx_event_queue_status ON node_event_queue(status);
CREATE INDEX idx_ai_task_user ON node_ai_task_queue(user_id, status);
CREATE INDEX idx_chat_messages_user ON ai_chat_messages(user_id, created_at DESC);
```

### n8n Resource Limits

Docker memory allocation:
```bash
docker run -it \
  -e N8N_EXPRESSIONEXTENSIONS='n8n-nodes-base.httpRequest' \
  -m 2g \
  n8nio/n8n
```

---

## Security Considerations

### API Keys

- Store all keys in environment variables
- Never commit .env files
- Rotate keys every 90 days
- Use separate keys for staging/production

### Webhook Security

Option 1: IP Allowlist (if n8n is on known IP)
```javascript
// In Kernel, verify request source
if (!['10.0.0.5'].includes(req.ip)) return 403;
```

Option 2: HMAC Signature
```javascript
// Sign payload in Kernel
const signature = crypto
  .createHmac('sha256', process.env.N8N_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

// In n8n, verify signature
```

### Database Access

- Use service role key (least privilege)
- Enable RLS for sensitive tables
- Audit all automation actions

---

## Deployment to Production

### Docker Compose Setup

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      N8N_HOST: n8n.yourdomain.com
      N8N_PORT: 5678
      N8N_PROTOCOL: https
      N8N_SECURE_COOKIE: true
      N8N_WEBHOOK_URL: https://n8n.yourdomain.com/webhook
      WEBHOOK_TUNNEL_URL: https://n8n.yourdomain.com/
    volumes:
      - ~/.n8n:/home/node/.n8n
    restart: unless-stopped
```

### SSL/TLS Setup

Use Let's Encrypt + Nginx reverse proxy:
```nginx
server {
    listen 443 ssl;
    server_name n8n.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/n8n.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring Setup

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'n8n'
    static_configs:
      - targets: ['localhost:9090']
```

---

## Success Criteria

✅ **Setup Complete When**:

- [x] n8n running and accessible
- [x] All 4 workflows imported and active
- [x] Supabase credentials configured
- [x] Queue Consumer webhook working
- [x] AI Task Worker executing tasks
- [x] Memory Worker persisting messages
- [x] Automation Engine sending emails/webhooks
- [x] All monitoring queries returning data

---

## Next Steps

1. **Test End-to-End**
   - Make Kernel request with task
   - Verify event appears in queue
   - Check worker executed
   - Confirm result persisted

2. **Activate Multi-Brand Mode** (after confirming n8n works)
   - Use business_id for isolation
   - Route by brand in UI

3. **Set Up Monitoring Dashboard**
   - Queue depth
   - Worker health
   - Error rates
   - Processing time

---

**Status**: 🟢 **Ready to Deploy**

For support: See KERNEL_API_INTEGRATION_GUIDE.md or check n8n logs.
