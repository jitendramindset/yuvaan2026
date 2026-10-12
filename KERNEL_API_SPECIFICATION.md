# 🧠 KERNEL API SPECIFICATION

**Status**: Development Ready  
**Endpoint**: `POST /kernel/execute`  
**Response Time Target**: <1 second  

---

## Overview

The Kernel is the **universal entry point** for all Yuvaan platforms. Every action flows through the Kernel, which:

1. Validates the brand context
2. Checks user permissions
3. Classifies intent
4. Routes to appropriate function
5. Executes with context
6. Generates UI response
7. Updates memory

---

## Universal Request Schema

```json
{
  "brand": "vanshavalli|mantravat|botmantra|jeetmantra|juniormantra",
  "action": "string - intent to perform",
  "context": {
    "user_id": "UUID",
    "node_id": "UUID",
    "session_id": "UUID",
    "device_type": "mobile|web|desktop",
    "ip_address": "string",
    "timestamp": "ISO8601"
  },
  "payload": {
    "...any action-specific data"
  },
  "memory_refs": ["vector_id_1", "vector_id_2"],
  "locale": "en|hi|es|fr",
  "ui_hint": "dashboard|form|list|detail"
}
```

---

## Universal Response Schema

```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "...action-specific result"
  },
  "ui": {
    "template": "dashboard|form|list|detail|modal",
    "layout": "grid|flex|stack",
    "widgets": [
      {
        "id": "widget_1",
        "type": "card|chart|table|form",
        "title": "string",
        "data": {},
        "actions": []
      }
    ],
    "navigation": {
      "breadcrumb": ["Home", "Family", "Members"],
      "next_actions": ["Edit", "Delete", "Share"]
    }
  },
  "memory_updates": [
    {
      "vector_id": "uuid",
      "action": "create|update|delete",
      "content": "string"
    }
  ],
  "notifications": [
    {
      "type": "success|warning|error|info",
      "message": "string",
      "duration": 3000
    }
  ],
  "timestamp": "ISO8601",
  "request_id": "UUID"
}
```

---

## Kernel Processing Pipeline

```
1. VALIDATE REQUEST
   ├─ Check required fields
   ├─ Validate brand exists
   ├─ Validate action format
   └─ Return 400 if invalid

2. LOAD CONTEXT
   ├─ Get user_core record
   ├─ Get node_identity
   ├─ Get brand_context
   ├─ Get role_context
   ├─ Get permission_context
   └─ Load memory_refs if provided

3. CLASSIFY INTENT
   ├─ Parse action string
   ├─ Map to intent type
   ├─ Resolve to function registry
   └─ Load function metadata

4. CHECK AUTHORIZATION
   ├─ Verify user role
   ├─ Check feature access
   ├─ Check action permission
   └─ Return 403 if denied

5. VALIDATE PAYLOAD
   ├─ Check required fields
   ├─ Type validation
   ├─ Business rule validation
   └─ Return 422 if invalid

6. EXECUTE FUNCTION
   ├─ Load function handler
   ├─ Pass context
   ├─ Execute with timeout (30s)
   ├─ Catch errors
   └─ Return result/error

7. GENERATE UI
   ├─ Determine template needed
   ├─ Load template definition
   ├─ Inject data into widgets
   ├─ Apply user preferences
   └─ Return UI schema

8. UPDATE MEMORY
   ├─ Generate embeddings if needed
   ├─ Insert into vector DB
   ├─ Update memory_context in node_identity
   └─ Cache for recommendations

9. RETURN RESPONSE
   ├─ Build response object
   ├─ Add request_id for tracing
   ├─ Set proper status code
   └─ Send to client
```

---

## VANSHAVALLI Endpoints

### Create Family Node
```
POST /kernel/execute
{
  "brand": "vanshavalli",
  "action": "create_family_node",
  "payload": {
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "Family Head"
  }
}

Response:
{
  "success": true,
  "data": {
    "node_id": "uuid",
    "family_id": "uuid"
  },
  "ui": {
    "template": "dashboard",
    "widgets": [...]
  }
}
```

### Add Family Relation
```
POST /kernel/execute
{
  "brand": "vanshavalli",
  "action": "add_family_relation",
  "payload": {
    "to_node_id": "uuid",
    "relationship_type": "Mother",
    "trust_level": 5
  }
}
```

### Send Family Invite
```
POST /kernel/execute
{
  "brand": "vanshavalli",
  "action": "send_family_invite",
  "payload": {
    "phone_or_email": "mom@email.com",
    "relationship": "Mother",
    "message": "Join our family tree!"
  }
}
```

### Accept Family Invite
```
POST /kernel/execute
{
  "brand": "vanshavalli",
  "action": "accept_family_invite",
  "payload": {
    "token": "invite_token_abc123"
  }
}
```

### Get Family Graph
```
POST /kernel/execute
{
  "brand": "vanshavalli",
  "action": "get_family_graph",
  "payload": {
    "family_id": "uuid"
  }
}
```

### Save Family Memory
```
POST /kernel/execute
{
  "brand": "vanshavalli",
  "action": "save_family_memory",
  "payload": {
    "title": "Birthday Party",
    "description": "Celebrating Mom's 60th",
    "media_urls": ["url1", "url2"],
    "tagged_people": ["node_id_1", "node_id_2"],
    "visibility": "family"
  }
}
```

### Search Family Memory
```
POST /kernel/execute
{
  "brand": "vanshavalli",
  "action": "search_family_memory",
  "payload": {
    "query": "birthday",
    "family_id": "uuid"
  }
}
```

---

## MANTRAVAT Endpoints

### Register Business
```
POST /kernel/execute
{
  "brand": "mantravat",
  "action": "fn_register_business_v1",
  "payload": {
    "name": "Acme Corp",
    "industry": "Technology",
    "team_size": 50,
    "country": "USA"
  }
}
```

### Initialize Business
```
POST /kernel/execute
{
  "brand": "mantravat",
  "action": "fn_initialize_business_v1",
  "payload": {
    "business_id": "uuid",
    "modules": ["crm", "hr", "finance"]
  }
}
```

### Create Business Tables
```
POST /kernel/execute
{
  "brand": "mantravat",
  "action": "fn_create_business_tables",
  "payload": {
    "business_id": "uuid",
    "schema_blueprint": {
      "table_name": "customers",
      "fields": [
        { "name": "name", "type": "TEXT" },
        { "name": "email", "type": "TEXT" },
        { "name": "phone", "type": "TEXT" }
      ]
    }
  }
}
```

### Check Feature Access
```
POST /kernel/execute
{
  "brand": "mantravat",
  "action": "check_feature_access",
  "payload": {
    "business_id": "uuid",
    "feature_key": "crm.leads"
  }
}
```

---

## BOTMANTRA Endpoints

### Run RAG Engine
```
POST /kernel/execute
{
  "brand": "botmantra",
  "action": "run_rag_engine",
  "payload": {
    "query": "How do I reset password?",
    "document_ids": ["doc_1", "doc_2"],
    "top_k": 5
  }
}
```

### Build AI Context
```
POST /kernel/execute
{
  "brand": "botmantra",
  "action": "build_ai_context",
  "payload": {
    "query_embedding": [0.1, 0.2, 0.3, ...],
    "namespace": "vector_business_docs"
  }
}
```

### Build AI Prompt
```
POST /kernel/execute
{
  "brand": "botmantra",
  "action": "build_ai_prompt",
  "payload": {
    "agent_id": "uuid",
    "user_prompt": "What are our sales numbers?"
  }
}
```

### Execute Workflow
```
POST /kernel/execute
{
  "brand": "botmantra",
  "action": "execute_ai_action",
  "payload": {
    "agent_id": "uuid",
    "workflow_id": "uuid",
    "input": {}
  }
}
```

---

## JEETMANTRA Endpoints

### Load Course
```
POST /kernel/execute
{
  "brand": "jeetmantra",
  "action": "load_user_memory",
  "payload": {
    "course_id": "uuid",
    "student_id": "uuid"
  }
}
```

### Submit Homework
```
POST /kernel/execute
{
  "brand": "jeetmantra",
  "action": "save_user_memory",
  "payload": {
    "homework_id": "uuid",
    "submission_text": "...",
    "file_url": "...",
    "student_id": "uuid"
  }
}
```

### Get Progress
```
POST /kernel/execute
{
  "brand": "jeetmantra",
  "action": "generate_dynamic_query",
  "payload": {
    "student_id": "uuid",
    "course_id": "uuid",
    "metric": "progress"
  }
}
```

---

## JUNIORMANTRA Endpoints

### Load Kid Dashboard
```
POST /kernel/execute
{
  "brand": "juniormantra",
  "action": "get_ui_schema",
  "payload": {
    "child_id": "uuid",
    "template": "kid_dashboard"
  }
}
```

### Get Content
```
POST /kernel/execute
{
  "brand": "juniormantra",
  "action": "run_rag_engine",
  "payload": {
    "child_id": "uuid",
    "content_type": "video",
    "age_range": [6, 8]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": "INVALID_REQUEST",
  "message": "Missing required field: action"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "status_code": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "status_code": 403,
  "error": "PERMISSION_DENIED",
  "message": "User does not have permission to access feature: crm.leads"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "status_code": 422,
  "error": "VALIDATION_ERROR",
  "message": "Invalid payload",
  "details": {
    "field": "email",
    "error": "Invalid email format"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "status_code": 500,
  "error": "INTERNAL_ERROR",
  "message": "Function execution failed",
  "request_id": "uuid"
}
```

---

## Implementation Checklist

- [ ] Create kernel.js main handler
- [ ] Create intent-classifier.js
- [ ] Create function-registry.js
- [ ] Create middleware for brand validation
- [ ] Create middleware for auth checking
- [ ] Create middleware for permission checking
- [ ] Create error handler
- [ ] Create logging/tracing system
- [ ] Create request timeout handler
- [ ] Implement all vanshavalli functions
- [ ] Implement all mantravat functions
- [ ] Implement all botmantra functions
- [ ] Implement all jeetmantra functions
- [ ] Implement all juniormantra functions
- [ ] Create comprehensive test suite
- [ ] Load test for concurrency
- [ ] Document all endpoints

---

**Next**: Read IMPLEMENTATION_ROADMAP.md for phase-by-phase tasks.
