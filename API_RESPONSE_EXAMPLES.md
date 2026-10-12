# API Response Examples - UI/Kernel Integration

This document contains real-world examples of API responses that the UI expects.

## 1. UI Bootstrap Request/Response

### Request
```http
POST /kernel/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "ui_bootstrap",
  "payload": {
    "brand": "default"
  }
}
```

### Response (Success)
```json
{
  "status": "success",
  "request_id": "req_1716584523456_a1b2c3d4e",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "business_id": "biz_550e8400e29b41d4a716446655440001",
  "trust_score": 85,
  "karma_score": 100,
  "execution_time_ms": 234,
  "response": {
    "type": "ui_bootstrap",
    "screen": "dashboard",
    "template_id": "default_dashboard",
    "ui": {
      "layout": "grid",
      "widgets": [
        {
          "id": "widget_stats_001",
          "type": "stats",
          "title": "Total Revenue",
          "size": "medium",
          "config": {
            "metric": "revenue",
            "period": "monthly",
            "currency": "USD"
          },
          "data": {
            "current": 45000,
            "previous": 38000,
            "change_percent": 18.4
          }
        },
        {
          "id": "widget_chart_001",
          "type": "chart",
          "title": "Revenue Trend",
          "size": "large",
          "config": {
            "chart_type": "line",
            "metric": "revenue",
            "period": "6m"
          },
          "data": {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "values": [30000, 32000, 35000, 38000, 42000, 45000]
          }
        },
        {
          "id": "widget_table_001",
          "type": "table",
          "title": "Recent Transactions",
          "size": "large",
          "config": {
            "columns": ["date", "amount", "status"],
            "rows_per_page": 10,
            "sortable": true
          },
          "data": {
            "rows": [
              {
                "date": "2024-05-25",
                "amount": 1500,
                "status": "completed"
              },
              {
                "date": "2024-05-24",
                "amount": 2200,
                "status": "completed"
              }
            ]
          }
        }
      ],
      "floating_chat": true,
      "permissions": {
        "can_edit": true,
        "can_delete": false,
        "can_share": true,
        "can_export": true
      },
      "theme": "light",
      "brand": "default",
      "metadata": {
        "version": "1.0.0",
        "updated_at": "2024-05-25T10:30:00Z"
      }
    }
  },
  "next_actions": [
    "load_data",
    "initialize_chat",
    "sync_permissions"
  ],
  "metadata": {
    "timestamp": "2024-05-25T10:30:00Z",
    "kernel_version": "1.0.0",
    "execution_type": "sync"
  }
}
```

### How Frontend Receives It
```javascript
// In Renderer.tsx
const response = await uiBootstrap();
// response.success === true
// response.response.ui contains the UI state

setUIState(response.response.ui);
// Now uiState = {
//   layout: "grid",
//   widgets: [3 widgets],
//   floating_chat: true,
//   permissions: {...},
//   theme: "light",
//   brand: "default"
// }

// Renderer re-renders with:
<LayoutRenderer layout={uiState.layout}>
  {uiState.widgets.map(widget => (
    <WidgetRenderer key={widget.id} widget={widget} />
  ))}
</LayoutRenderer>
{uiState.floating_chat && <FloatingChat />}
```

## 2. Chat Request/Response

### Request
```http
POST /kernel/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "chat",
  "payload": {
    "message": "Show me revenue trends for this quarter",
    "context": {
      "session_id": "session_123",
      "conversation_id": "conv_456"
    }
  }
}
```

### Response (Chat with UI Update)
```json
{
  "status": "success",
  "request_id": "req_1716584523457_b2c3d4e5f",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "business_id": "biz_550e8400e29b41d4a716446655440001",
  "trust_score": 85,
  "karma_score": 102,
  "execution_time_ms": 1234,
  "response": {
    "type": "chat_with_ui_update",
    "text": "Here are the revenue trends for Q2 2024. As you can see, we've experienced steady growth with revenue increasing from $30,000 in January to $45,000 in May, representing an 18.4% increase. The trend shows consistent month-over-month growth.",
    "sources": [
      {
        "type": "database",
        "table": "transactions",
        "query_id": "q_789"
      }
    ],
    "ui": {
      "layout": "grid",
      "widgets": [
        {
          "id": "widget_chart_quarterly",
          "type": "chart",
          "title": "Q2 2024 Revenue Breakdown",
          "size": "large",
          "config": {
            "chart_type": "bar",
            "metric": "revenue",
            "period": "quarterly"
          },
          "data": {
            "labels": ["Q1", "Q2"],
            "values": [97000, 127000]
          }
        },
        {
          "id": "widget_summary_q2",
          "type": "card",
          "title": "Q2 Summary",
          "size": "medium",
          "config": {
            "display_type": "summary"
          },
          "data": {
            "metric_value": "$127,000",
            "metric_label": "Total Revenue",
            "change": "+31.0%",
            "change_type": "positive"
          }
        }
      ],
      "floating_chat": true,
      "theme": "light",
      "brand": "default"
    }
  },
  "next_actions": [
    "save_conversation",
    "update_analytics"
  ],
  "metadata": {
    "timestamp": "2024-05-25T10:35:00Z",
    "kernel_version": "1.0.0",
    "ai_model": "openai",
    "tokens_used": 456
  }
}
```

### How Frontend Receives It
```javascript
// In FloatingChat.tsx
const response = await chatSend(message);

// Add assistant message
if (response?.response?.text) {
  addMessage({
    role: 'assistant',
    text: response.response.text,
    sources: response.response?.sources
  });
}

// Update UI if new widgets provided
if (response?.response?.ui) {
  setUIState(response.response.ui);
  // Dashboard re-renders with new chart and summary widget
}
```

## 3. Chat Request/Response (Text Only)

### Request
```http
POST /kernel/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "chat",
  "payload": {
    "message": "What was the total revenue last month?",
    "context": {
      "session_id": "session_123"
    }
  }
}
```

### Response (Chat Text Only - No UI Update)
```json
{
  "status": "success",
  "request_id": "req_1716584523458_c3d4e5f6g",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "business_id": "biz_550e8400e29b41d4a716446655440001",
  "trust_score": 85,
  "karma_score": 103,
  "execution_time_ms": 856,
  "response": {
    "type": "chat_response_text",
    "text": "The total revenue for April 2024 was $42,000. This represented a 20% increase from March's $35,000."
  },
  "next_actions": [
    "save_conversation"
  ],
  "metadata": {
    "timestamp": "2024-05-25T10:40:00Z",
    "kernel_version": "1.0.0",
    "ai_model": "openai"
  }
}
```

### How Frontend Receives It
```javascript
// In FloatingChat.tsx
const response = await chatSend(message);

// Just add the text message
if (response?.response?.text) {
  addMessage({
    role: 'assistant',
    text: response.response.text
  });
}

// No UI update needed (no response.ui)
```

## 4. Error Response

### Request
```http
POST /kernel/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer invalid_token
Content-Type: application/json

{
  "action": "ui_bootstrap"
}
```

### Response (Error)
```json
{
  "status": "error",
  "code": "INVALID_JWT",
  "message": "Authentication failed"
}
```

### How Frontend Receives It
```javascript
// In Renderer.tsx
const response = await uiBootstrap();

if (!response.success) {
  setError(response.error || 'Failed to bootstrap UI');
  // Show error message to user
  // Offer reload button
}
```

## 5. Form Submission Request/Response

### Request
```http
POST /kernel/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "form_submit",
  "payload": {
    "formId": "contact_form_001",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I'd like to know more about your services"
    }
  }
}
```

### Response
```json
{
  "status": "success",
  "request_id": "req_1716584523459_d4e5f6g7h",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "business_id": "biz_550e8400e29b41d4a716446655440001",
  "trust_score": 86,
  "karma_score": 105,
  "execution_time_ms": 345,
  "response": {
    "type": "form_submission_success",
    "message": "Your message has been received. We'll get back to you within 24 hours.",
    "submission_id": "sub_123456",
    "ui": {
      "layout": "grid",
      "widgets": [
        {
          "id": "widget_success_message",
          "type": "card",
          "title": "Success",
          "size": "medium",
          "config": {
            "style": "success"
          },
          "data": {
            "icon": "checkmark",
            "message": "Your submission was successful!",
            "submission_id": "sub_123456"
          }
        }
      ],
      "floating_chat": true,
      "theme": "light"
    }
  },
  "next_actions": [
    "clear_form",
    "track_submission"
  ],
  "metadata": {
    "timestamp": "2024-05-25T10:45:00Z",
    "kernel_version": "1.0.0"
  }
}
```

## 6. Data Query Request/Response

### Request
```http
POST /kernel/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "data",
  "payload": {
    "template_code": "revenue_by_product",
    "filters": {
      "date_range": "Q2_2024",
      "region": "North America"
    },
    "pagination": {
      "limit": 20,
      "offset": 0
    }
  }
}
```

### Response
```json
{
  "status": "success",
  "request_id": "req_1716584523460_e5f6g7h8i",
  "user_id": "user_550e8400e29b41d4a716446655440000",
  "business_id": "biz_550e8400e29b41d4a716446655440001",
  "trust_score": 86,
  "karma_score": 106,
  "execution_time_ms": 567,
  "response": {
    "type": "data_query_result",
    "data": {
      "rows": [
        {
          "product": "Product A",
          "revenue": 45000,
          "units_sold": 1200,
          "margin": 0.35
        },
        {
          "product": "Product B",
          "revenue": 32000,
          "units_sold": 800,
          "margin": 0.28
        },
        {
          "product": "Product C",
          "revenue": 50000,
          "units_sold": 1500,
          "margin": 0.40
        }
      ],
      "total_rows": 3,
      "total_revenue": 127000
    },
    "ui": {
      "layout": "grid",
      "widgets": [
        {
          "id": "widget_data_table",
          "type": "table",
          "title": "Revenue by Product - Q2 2024",
          "size": "large",
          "config": {
            "columns": [
              { "key": "product", "label": "Product", "sortable": true },
              { "key": "revenue", "label": "Revenue", "sortable": true, "format": "currency" },
              { "key": "units_sold", "label": "Units Sold", "sortable": true, "format": "number" },
              { "key": "margin", "label": "Margin", "sortable": true, "format": "percent" }
            ]
          },
          "data": {
            "rows": [
              { "product": "Product A", "revenue": 45000, "units_sold": 1200, "margin": 0.35 },
              { "product": "Product B", "revenue": 32000, "units_sold": 800, "margin": 0.28 },
              { "product": "Product C", "revenue": 50000, "units_sold": 1500, "margin": 0.40 }
            ]
          }
        }
      ],
      "floating_chat": true,
      "theme": "light"
    }
  },
  "next_actions": [
    "display_data",
    "enable_export"
  ],
  "metadata": {
    "timestamp": "2024-05-25T10:50:00Z",
    "kernel_version": "1.0.0",
    "query_execution_time_ms": 234
  }
}
```

## Widget Types Supported

| Type | Example Response | Frontend Component |
|------|------------------|-------------------|
| **stats** | Shows metric with change | StatsWidget |
| **chart** | Line/Bar/Pie chart data | ChartRenderer |
| **table** | Rows, columns, pagination | TableRenderer |
| **card** | Title, content, metadata | CardWidget |
| **form** | Fields, validation | FormRenderer |
| **list** | Items with actions | ListWidget |
| **progress** | Progress bar data | ProgressWidget |
| **text** | Rich text content | TextWidget |
| **custom** | Custom widget payload | CustomWidget |

## Response Structure Rules

### All responses MUST have:
```javascript
{
  "status": "success|error",
  "request_id": "req_...",        // For tracking
  "execution_time_ms": 123        // For monitoring
}
```

### Success responses (200) MUST have:
```javascript
{
  "status": "success",
  "response": {
    "type": "...",                // Response type
    "ui": {                       // OPTIONAL: If UI should update
      "layout": "...",            // REQUIRED
      "widgets": [...],           // REQUIRED (can be empty)
      "floating_chat": boolean    // RECOMMENDED
    }
  }
}
```

### Error responses (4xx/5xx) MUST have:
```javascript
{
  "status": "error",
  "code": "ERROR_CODE",           // Machine-readable error
  "message": "Human readable"     // User-facing message
}
```

## Integration Points

### Renderer.tsx expects:
```javascript
response.response?.ui?.{layout, widgets, floating_chat, ...}
```

### FloatingChat.tsx expects:
```javascript
response.response?.{text, ui}
```

### WidgetRenderer.tsx expects each widget:
```javascript
{
  id: string,
  type: string,
  title: string,
  size?: 'small|medium|large',
  config?: Record<string, any>,
  data?: Record<string, any>
}
```

## Testing with cURL

```bash
# Test UI Bootstrap
curl -X POST http://localhost:3000/kernel/execute \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"action":"ui_bootstrap"}'

# Test Chat
curl -X POST http://localhost:3000/kernel/execute \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"action":"chat","payload":{"message":"Hello"}}'

# Format response pretty
# ... | jq '.'
```

---

**Last Updated**: 2024
**API Version**: 1.0.0
**Status**: Current
