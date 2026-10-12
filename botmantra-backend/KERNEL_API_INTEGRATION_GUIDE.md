# KERNEL API INTEGRATION GUIDE

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-02-03

---

## Table of Contents

1. [Overview](#overview)
2. [API Specification](#api-specification)
3. [Frontend Integration](#frontend-integration)
4. [n8n Automation Integration](#n8n-automation-integration)
5. [Extending Kernel](#extending-kernel)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Kernel API is the **single execution gateway** for all BotMantra platform operations:

- ✅ Chat & messaging
- ✅ UI rendering & layout
- ✅ Data queries & transactions
- ✅ Automation & workflows
- ✅ Plugin execution
- ✅ AI operations

**Key Principle**: Everything goes through Kernel. Nothing bypasses it.

**6-Step Pipeline**:
```
1. JWT Validation
   ↓
2. User/Business/Role Resolution
   ↓
3. Permission Gate
   ↓
4. Trust Score Gate
   ↓
5. Action Routing (Chat | UI | Data | Automation | Plugin)
   ↓
6. Event Logging + Queue Publishing
```

---

## API Specification

### Endpoint

```
POST /kernel/execute
```

### Authentication

**Required Header**:
```
Authorization: Bearer <SUPABASE_JWT>
Content-Type: application/json
```

The JWT is validated by Supabase Auth middleware. The kernel extracts:
- `user_id` (from JWT `sub` claim)
- `business_id` (from business_users table)
- `role_id` (from business_users table)

### Request Payload

```json
{
  "action": "chat|ui|data|automation|plugin",
  "payload": {
    "message": "user input",
    "template_code": "optional code",
    "filters": {},
    "parameters": {}
  },
  "device": {
    "fingerprint": "optional device hash",
    "platform": "web|mobile|bot"
  }
}
```

### Response Format

**Success**:
```json
{
  "status": "success",
  "request_id": "req_1707000000000_abc123",
  "user_id": "user_uuid",
  "business_id": "business_uuid",
  "trust_score": 75,
  "karma_score": 110,
  "execution_time_ms": 234,
  "response": {
    "text": "AI response or result",
    "type": "chat|ui_bootstrap|data_result|automation_queued|plugin_result",
    "ui": {
      "layout": "grid|sidebar_main|data_grid",
      "widgets": ["widget_code_1", "widget_code_2"],
      "actions": ["action_1", "action_2"]
    },
    "data": [],
    "metadata": {}
  },
  "next_actions": ["suggested_action_1"],
  "metadata": {
    "timestamp": "2026-02-03T12:34:56Z",
    "kernel_version": "1.0.0"
  }
}
```

**Error**:
```json
{
  "status": "error",
  "code": "PERMISSION_DENIED|INVALID_JWT|LOW_TRUST_SCORE|USER_NOT_FOUND",
  "message": "Human-readable error message",
  "request_id": "req_xxx"
}
```

---

## Frontend Integration

### 1. React Hook for Kernel Calls

```javascript
// useKernel.js
import { useAuth } from '@supabase/auth-helpers-react';
import { useState } from 'react';

export function useKernel() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (action, payload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/kernel/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, payload })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
```

### 2. Chat Integration

```javascript
// ChatWidget.jsx
import { useKernel } from './useKernel';

export function ChatWidget() {
  const { execute } = useKernel();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    const response = await execute('chat', {
      message: input,
      context: { session_id: 'current_session' }
    });

    if (response.status === 'success') {
      // Add AI response to chat
      setMessages(prev => [
        ...prev,
        { role: 'user', text: input },
        { role: 'assistant', text: response.response.text }
      ]);

      // Suggest next actions
      if (response.next_actions?.length > 0) {
        console.log('Suggested actions:', response.next_actions);
      }

      setInput('');
    }
  };

  return (
    <div className="chat-widget">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
```

### 3. UI Bootstrap (Dynamic Rendering)

```javascript
// DynamicDashboard.jsx
import { useEffect, useState } from 'react';
import { useKernel } from './useKernel';

export function DynamicDashboard() {
  const { execute } = useKernel();
  const [layout, setLayout] = useState(null);
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    const loadUI = async () => {
      const response = await execute('ui', {
        screen: 'dashboard',
        context: {}
      });

      if (response.status === 'success') {
        setLayout(response.response.layout);
        setWidgets(response.response.ui.widgets);
      }
    };

    loadUI();
  }, []);

  if (!layout) return <div>Loading...</div>;

  return (
    <div className={`layout-${layout.layout}`}>
      {widgets.map(widget => (
        <Widget
          key={widget}
          code={widget}
        />
      ))}
    </div>
  );
}

// Generic widget renderer
function Widget({ code }) {
  const widgetMap = {
    'sales_kpi': SalesKPIWidget,
    'orders_table': OrdersTableWidget,
    'chat_window': ChatWidgetComponent,
    // ... add more widget types
  };

  const WidgetComponent = widgetMap[code] || DefaultWidget;
  return <WidgetComponent />;
}
```

### 4. Data Query Integration

```javascript
// useDataQuery.js
export function useDataQuery() {
  const { execute } = useKernel();

  const query = async (templateCode, filters = {}, pagination = {}) => {
    const response = await execute('data', {
      template_code: templateCode,
      filters,
      pagination: { limit: 50, offset: 0, ...pagination }
    });

    return response.response;
  };

  return { query };
}

// Usage
function OrdersList() {
  const { query } = useDataQuery();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    (async () => {
      const result = await query('orders_table', 
        { status: 'pending' },
        { limit: 25, offset: 0 }
      );
      setOrders(result.data);
    })();
  }, []);

  return (
    <table>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.customer}</td>
            <td>{order.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 5. Error Handling

```javascript
// kernelErrorBoundary.js
export function KernelErrorBoundary({ children }) {
  const [error, setError] = useState(null);

  return (
    <ErrorContext.Provider value={{ setError }}>
      {error ? (
        <ErrorDisplay
          code={error.code}
          message={error.message}
          onDismiss={() => setError(null)}
        />
      ) : (
        children
      )}
    </ErrorContext.Provider>
  );
}

function ErrorDisplay({ code, message, onDismiss }) {
  const errorMessages = {
    'PERMISSION_DENIED': 'You do not have access to this action',
    'LOW_TRUST_SCORE': 'Your account trust is too low. Write operations disabled.',
    'INVALID_JWT': 'Your session expired. Please log in again.',
    'KERNEL_ERROR': 'Server error. Please try again.'
  };

  return (
    <div className="error-banner">
      <p>{errorMessages[code] || message}</p>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  );
}
```

---

## n8n Automation Integration

### 1. Kernel Webhook Trigger

**n8n Workflow: Kernel Gateway**

```json
{
  "name": "Kernel Gateway",
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "kernel-trigger",
        "httpMethod": "POST",
        "responseMode": "responseNode"
      }
    },
    {
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "jwt": "={{ $nodeInputData[0].headers.authorization.split(' ')[1] }}",
          "action": "={{ $nodeInputData[0].body.action }}",
          "payload": "={{ $nodeInputData[0].body.payload }}"
        }
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:5000/kernel/execute",
        "method": "POST",
        "headers": {
          "Authorization": "={{ 'Bearer ' + $nodeInputData[0].jwt }}",
          "Content-Type": "application/json"
        },
        "body": {
          "action": "={{ $nodeInputData[0].action }}",
          "payload": "={{ $nodeInputData[0].payload }}"
        }
      }
    }
  ]
}
```

### 2. Background AI Worker

**n8n Workflow: AI Task Queue Processor**

```json
{
  "name": "AI Task Queue Processor",
  "trigger": "Cron (every 30 seconds)",
  "nodes": [
    {
      "type": "Cron",
      "parameters": {
        "interval": 30
      }
    },
    {
      "type": "Postgres",
      "parameters": {
        "operation": "SELECT",
        "table": "node_ai_task_queue",
        "where": "status = 'pending'",
        "limit": 10
      }
    },
    {
      "type": "Loop",
      "parameters": {
        "iterations": "={{ $nodeInputData[0].length }}"
      },
      "nodes": [
        {
          "type": "OpenAI",
          "parameters": {
            "operation": "Generate",
            "prompt": "={{ $nodeLoopData[0].payload }}"
          }
        },
        {
          "type": "Postgres",
          "parameters": {
            "operation": "UPDATE",
            "table": "node_ai_task_queue",
            "where": "id = '={{ $nodeLoopData[0].id }}'",
            "values": {
              "status": "completed",
              "result": "={{ $nodeInputData[0].text }}"
            }
          }
        }
      ]
    }
  ]
}
```

### 3. Event Queue Processor

**n8n Workflow: Event Processor**

```json
{
  "name": "Event Processor",
  "trigger": "Webhook (Postgres Realtime)",
  "nodes": [
    {
      "type": "Webhook",
      "parameters": {
        "path": "events"
      }
    },
    {
      "type": "Router",
      "parameters": {
        "routes": [
          {
            "name": "Update Karma",
            "condition": "={{ $nodeInputData[0].event_type === 'update_karma' }}"
          },
          {
            "name": "Send Notification",
            "condition": "={{ $nodeInputData[0].event_type === 'notification' }}"
          },
          {
            "name": "Trigger Automation",
            "condition": "={{ $nodeInputData[0].event_type === 'automation' }}"
          }
        ]
      }
    }
  ]
}
```

---

## Extending Kernel

### 1. Add New Action Type

**Step 1**: Update `kernel-execute.js`:

```javascript
// Add to actionPermissionMap
const actionPermissionMap = {
  // ... existing
  'custom_action': 'custom_permission'
};

// Add router case
case 'custom_action':
  actionResult = await handleCustomAction(userId, businessId, payload, supabase);
  break;
```

**Step 2**: Create handler function:

```javascript
async function handleCustomAction(userId, businessId, payload, supabase) {
  // Implementation here
  return {
    response: { /* your response */ },
    nextActions: [],
    asyncEvents: []
  };
}
```

**Step 3**: Add test:

```javascript
test('Should handle custom_action', async () => {
  // Test implementation
});
```

### 2. Add New Permission Type

**Step 1**: Insert into `permissions` table:

```sql
INSERT INTO permissions (id, code, resource_type, description)
VALUES (
  gen_random_uuid(),
  'custom_permission',
  'action',
  'Custom permission'
);
```

**Step 2**: Map to role in `role_permissions` table:

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM roles, permissions
WHERE permissions.code = 'custom_permission'
AND roles.role_code = 'editor';
```

### 3. Custom UI Widget

**Register in frontend**:

```javascript
const widgetMap = {
  'custom_widget': CustomWidgetComponent
};

function CustomWidgetComponent() {
  const { execute } = useKernel();

  const handleAction = async () => {
    const response = await execute('custom_action', {
      param1: 'value'
    });
    
    // Handle response
  };

  return <div onClick={handleAction}>Custom Widget</div>;
}
```

---

## Monitoring

### 1. Request Logging

All requests are logged to `node_execution_log`:

```sql
SELECT 
  request_id,
  user_id,
  business_id,
  action_type,
  status,
  execution_time_ms,
  trust_score,
  created_at
FROM node_execution_log
ORDER BY created_at DESC
LIMIT 100;
```

### 2. Error Tracking

```sql
SELECT 
  request_id,
  user_id,
  error_code,
  error_message,
  created_at
FROM node_execution_log
WHERE status = 'error'
ORDER BY created_at DESC;
```

### 3. Performance Monitoring

```sql
SELECT 
  action_type,
  AVG(execution_time_ms) as avg_time,
  MAX(execution_time_ms) as max_time,
  COUNT(*) as total_calls
FROM node_execution_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY action_type;
```

### 4. Trust & Karma Tracking

```sql
SELECT 
  user_id,
  trust_score,
  karma_score,
  updated_at
FROM node_trust_state
WHERE updated_at > NOW() - INTERVAL '1 day'
ORDER BY trust_score DESC;
```

---

## Troubleshooting

### Issue: "PERMISSION_DENIED"

**Cause**: User lacks required permission

**Solution**:
1. Check user's role in `business_users`
2. Verify role has permission in `role_permissions`
3. Verify permission exists in `permissions` table

```sql
SELECT bu.role_id, r.role_name, rp.permission_id, p.code
FROM business_users bu
JOIN roles r ON bu.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE bu.user_id = 'your_user_id';
```

### Issue: "LOW_TRUST_SCORE"

**Cause**: User's trust score is below threshold (30) for write operations

**Solution**:
1. Check user's trust score:
```sql
SELECT trust_score, is_trusted FROM node_trust_state WHERE nid_hash = 'hash';
```

2. Increase trust score via admin action
3. Check karma log to understand why score is low

### Issue: "INVALID_JWT"

**Cause**: JWT is expired or malformed

**Solution**:
1. Re-authenticate user
2. Request new JWT token
3. Ensure Authorization header format is `Bearer <token>`

### Issue: Slow Response Times

**Cause**: RLS policies or database queries too complex

**Solution**:
1. Monitor execution times in `node_execution_log`
2. Add indexes on frequently queried columns
3. Cache results in `semantic_cache`
4. Optimize RLS policies

---

## Rate Limiting

The Kernel enforces rate limiting:

**Default**: 5 requests/second per user (nid_hash)

**Configuration** (in kernel-execute.js):

```javascript
const RATE_LIMIT = {
  requests_per_second: 5,
  burst_allowance: 10
};
```

To adjust:
1. Modify `RATE_LIMIT` constant
2. Update trust score gating
3. Test with load tests

---

## Security Checklist

- [ ] JWT validation enabled
- [ ] All actions checked for permission
- [ ] Trust score gating enforced
- [ ] Rate limiting enabled
- [ ] SQL injection protection (parameterized queries)
- [ ] CORS headers configured
- [ ] HTTPS enforced in production
- [ ] Execution logging enabled
- [ ] Error messages don't leak sensitive data
- [ ] Service role key stored in env only

---

## Next Steps

1. **Deploy Kernel API** → `npm start`
2. **Test Endpoints** → Use provided test suite
3. **Wire UI** → Use React hooks provided
4. **Set Up n8n Workflows** → Copy provided JSON
5. **Monitor Performance** → Watch execution logs
6. **Scale & Optimize** → Add caching, indexes as needed

---

**Questions?** See `KERNEL_API_DEPLOYMENT_CHECKLIST.md`
