# BotMantra Two-API System Documentation

## 🎯 Overview

The BotMantra system now has **TWO MAIN APIs** that handle all operations:

### 1. **BotMantra AI Framework API** (No Auth Required)
- **Purpose**: UI building, data-to-UI conversion, property management
- **Base URL**: `/api/botmantra-ai`
- **Authentication**: None required

### 2. **NodeCore Chat API** (Auth Required)
- **Purpose**: Data operations with RAG, permissions, and AI key management
- **Base URL**: `/api/nodecore-chat`
- **Authentication**: JWT Bearer token required

---

## 📡 API #1: BotMantra AI Framework

### Features
- ✅ Convert data/queries to UI components
- ✅ Intelligent field mapping with registry model
- ✅ AI-powered layout suggestions
- ✅ Preview and validate UI
- ✅ Editable mode with save options
- ✅ No login required

### Endpoints

#### 1. `POST /api/botmantra-ai/chat`
**Convert data to UI framework**

```json
{
  "message": "Create a product form",
  "dataExample": [
    {
      "product_name": "iPhone 15",
      "price": 999,
      "category": "Electronics"
    }
  ],
  "context": {
    "businessType": "ecommerce",
    "layout": "grid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "framework": {
    "fields": [
      {
        "name": "product_name",
        "type": "text",
        "widget": "input",
        "confidence": 1.0
      },
      {
        "name": "price",
        "type": "number",
        "widget": "input",
        "confidence": 1.0
      }
    ],
    "components": [...],
    "layout": {
      "type": "grid",
      "columns": 2,
      "responsive": true
    },
    "theme": {
      "primary": "#4F46E5",
      "accent": "#10B981",
      "style": "modern"
    }
  },
  "metadata": {
    "totalFields": 3,
    "newFieldsCreated": 0,
    "confidence": 0.95
  }
}
```

#### 2. `POST /api/botmantra-ai/validate-ui`
**Validate UI configuration**

```json
{
  "components": [
    {
      "fieldName": "name",
      "widget": "input",
      "type": "text"
    }
  ],
  "layout": {
    "type": "grid",
    "columns": 2
  }
}
```

#### 3. `POST /api/botmantra-ai/save-ui`
**Save UI framework**

```json
{
  "framework": { ... },
  "metadata": {
    "name": "My Product Form",
    "businessType": "ecommerce"
  }
}
```

**Response:**
```json
{
  "success": true,
  "uiId": "ui_1738188800000_abc123",
  "message": "UI saved successfully",
  "previewUrl": "/preview/ui_1738188800000_abc123"
}
```

#### 4. `GET /api/botmantra-ai/tables`
**Get available database tables and schemas**

---

## 🔐 API #2: NodeCore Chat (Authenticated)

### Features
- ✅ RAG-powered AI responses
- ✅ Load data from node core
- ✅ Create and suggest data structures
- ✅ Full permission checking
- ✅ AI key management
- ✅ Complete operation logging

### Authentication

All endpoints require a JWT Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### 1. `POST /api/nodecore-chat/chat`
**RAG-powered chat for data operations**

```json
{
  "message": "How do I create a customer record?",
  "context": {
    "operation": "create",
    "entityType": "customer"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "To create a customer record, you need...",
  "sources": [
    {
      "document": "Customer Management Guide",
      "relevance": "high"
    }
  ],
  "aiKey": "nck_1738188800000_abc...",
  "metadata": {
    "userId": "user-123",
    "ragEnabled": true
  }
}
```

#### 2. `POST /api/nodecore-chat/load`
**Load data from node core**

```json
{
  "nidHash": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "row_id": 1,
    "nid_hash": "a1b2c3d4e5f6...",
    "owner_id": "user-123",
    "dna_blob": { ... },
    "field_map": { ... },
    "status": "active"
  }
}
```

#### 3. `POST /api/nodecore-chat/create`
**Create new data in node core**

```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "type": "customer"
  }
}
```

**Response:**
```json
{
  "success": true,
  "nidHash": "new_hash_123...",
  "data": { ... }
}
```

#### 4. `POST /api/nodecore-chat/suggest`
**AI suggests data structure**

```json
{
  "query": "I need to store customer information with orders",
  "existingData": null
}
```

**Response:**
```json
{
  "success": true,
  "suggestion": "Based on your requirements...",
  "sources": [...],
  "recommendedFields": [
    { "name": "id", "type": "string", "required": true },
    { "name": "customer_name", "type": "string", "required": true },
    { "name": "orders", "type": "array", "required": false }
  ]
}
```

#### 5. `GET /api/nodecore-chat/my-nodes`
**Get all nodes owned by user**

**Response:**
```json
{
  "success": true,
  "nodes": [
    {
      "row_id": 1,
      "nid_hash": "abc123...",
      "status": "active",
      "created_at": "2026-01-29T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### 6. `POST /api/nodecore-chat/get-ai-key`
**Get or generate AI key**

**Response:**
```json
{
  "success": true,
  "key": "nck_1738188800000_abc123...",
  "isNew": false,
  "message": "Existing AI key retrieved"
}
```

---

## 🔧 Field Registry Model

The system uses an intelligent field registry to map and create fields dynamically:

```javascript
FIELD_REGISTRY = {
  text: { type: 'text', validation: 'string', widget: 'input' },
  number: { type: 'number', validation: 'numeric', widget: 'input' },
  email: { type: 'email', validation: 'email', widget: 'input' },
  phone: { type: 'phone', validation: 'phone', widget: 'input' },
  date: { type: 'date', validation: 'date', widget: 'datepicker' },
  boolean: { type: 'boolean', validation: 'boolean', widget: 'toggle' },
  select: { type: 'select', validation: 'enum', widget: 'dropdown' },
  image: { type: 'file', validation: 'url', widget: 'upload' },
  richtext: { type: 'text', validation: 'html', widget: 'editor' },
  json: { type: 'json', validation: 'json', widget: 'jsoneditor' }
}
```

### Intelligent Field Detection

The AI automatically detects field types based on naming patterns:
- `email` → email widget
- `phone`, `mobile` → phone widget
- `date`, `time` → datepicker
- `price`, `amount`, `cost` → number input
- `active`, `enabled`, `is_*` → boolean toggle
- `image`, `photo`, `avatar` → image upload
- `description`, `bio`, `content` → rich text editor

---

## 🛡️ Permission System

### Roles
- **admin**: Full system access
- **user**: Standard access (read, create, update)
- **viewer**: Read-only access

### Permissions
- `node_core:read`
- `node_core:create`
- `node_core:update`
- `node_core:delete`
- `ui:create`
- `ui:read`

### Permission Checking

All NodeCore Chat endpoints automatically check permissions before executing operations.

---

## 📊 Logging

All API requests are logged to the `api_logs` table:

```sql
SELECT * FROM api_logs 
WHERE endpoint = '/api/nodecore-chat/chat' 
ORDER BY timestamp DESC 
LIMIT 10;
```

View usage statistics:

```sql
SELECT * FROM api_usage_stats 
WHERE endpoint LIKE '/api/botmantra-ai%';
```

---

## 🔍 RAG System

The RAG (Retrieval-Augmented Generation) system enhances AI responses with relevant context from:
- `vector_documents`: Source documents
- `vector_chunks`: Embedded text chunks for semantic search

### How it works:
1. User query is received
2. Relevant chunks are retrieved from vector database
3. Context is built from retrieved documents
4. AI generates response using context + query
5. Sources are returned with the response

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd botmantra-backend
npm install jsonwebtoken
```

### 2. Run Database Migration
```bash
# Execute the schema file in your PostgreSQL database
psql -h api.mantravat.cloud -U supabase -d postgres -f db-schema-two-api-system.sql
```

### 3. Start Server
```bash
node server.js
```

### 4. Test BotMantra AI Framework (No Auth)
```bash
curl -X POST http://localhost:5000/api/botmantra-ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a contact form",
    "context": {"businessType": "personal"}
  }'
```

### 5. Test NodeCore Chat (With Auth)
```bash
# First, get a token by logging in
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Then use the token
curl -X POST http://localhost:5000/api/nodecore-chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"message": "Show me my nodes"}'
```

---

## 📦 Database Tables

### New Tables
- `api_logs` - Request/response logging
- `user_roles` - User role assignments
- `vector_documents` - RAG document storage
- `vector_chunks` - Embedded text chunks
- `ui_templates` - AI-generated UI frameworks (enhanced)

### Enhanced Tables
- `ui_templates` - Now includes business_type, theme, usage_count

---

## 🎨 UI Framework Structure

```json
{
  "fields": [/* Detected/mapped fields */],
  "components": [/* UI widgets */],
  "layout": {
    "type": "grid|list|card|form",
    "columns": 1-3,
    "responsive": true
  },
  "theme": {
    "primary": "#hex",
    "accent": "#hex",
    "style": "modern|professional|minimal|friendly"
  }
}
```

---

## 🔄 Workflow Examples

### Example 1: Build UI from JSON Data
1. User pastes JSON data
2. POST to `/api/botmantra-ai/chat` with data
3. AI maps fields intelligently
4. UI framework returned with components
5. User previews and adjusts
6. POST to `/api/botmantra-ai/save-ui` to save

### Example 2: Load and Modify NodeCore Data
1. User logs in
2. POST to `/api/nodecore-chat/get-ai-key` to get AI key
3. GET `/api/nodecore-chat/my-nodes` to list nodes
4. POST to `/api/nodecore-chat/load` with nid_hash
5. Modify data
6. POST to `/api/nodecore-chat/create` to save changes

---

## 🐛 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": "Additional context"
}
```

### Common Error Codes
- `AUTH_REQUIRED` - No token provided
- `INVALID_TOKEN` - Token expired or invalid
- `PERMISSION_DENIED` - User lacks required permission
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data

---

## 📈 Monitoring

View real-time API usage:

```sql
-- Top endpoints by usage
SELECT endpoint, COUNT(*) as requests 
FROM api_logs 
GROUP BY endpoint 
ORDER BY requests DESC;

-- User activity
SELECT user_id, COUNT(*) as api_calls 
FROM api_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_id;

-- Error rate
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  COUNT(*) as total
FROM api_logs 
GROUP BY hour 
ORDER BY hour DESC;
```

---

## 🔗 Integration with UI

### React Component Example

```javascript
// BotMantra AI Framework (No Auth)
const generateUI = async (data) => {
  const response = await fetch('http://localhost:5000/api/botmantra-ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataExample: data,
      context: { businessType: 'personal', layout: 'grid' }
    })
  });
  
  const framework = await response.json();
  return framework;
};

// NodeCore Chat (With Auth)
const chatWithAI = async (message, token) => {
  const response = await fetch('http://localhost:5000/api/nodecore-chat/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });
  
  const result = await response.json();
  return result;
};
```

---

## 📝 Notes

- BotMantra AI Framework works **without login** for public UI building
- NodeCore Chat requires **authentication** for data operations
- All operations are **logged** for audit trails
- RAG system enhances AI responses with **relevant context**
- Permission system ensures **secure access control**
- Field registry enables **intelligent field mapping**

---

## 🎯 Next Steps

1. Install `jsonwebtoken` package
2. Run database migration
3. Test both APIs with sample requests
4. Integrate with React frontend
5. Configure RAG embeddings for better AI responses
6. Set up monitoring and analytics

---

**System Ready! 🚀**
