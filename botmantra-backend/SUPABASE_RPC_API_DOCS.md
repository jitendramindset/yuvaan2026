# Supabase RPC API Documentation

**Generated:** 2026-02-04T07:09:45.094Z

## Available RPC Functions by Category

### AI Functions

#### `build_ai_context`
Build AI context from knowledge base

**Usage:**
```javascript
const { data, error } = await supabase.rpc('build_ai_context', {
  // parameters
});
```

#### `build_ai_prompt`
Build AI prompt with node context

**Usage:**
```javascript
const { data, error } = await supabase.rpc('build_ai_prompt', {
  // parameters
});
```

#### `build_rag_context`
Build RAG context

**Usage:**
```javascript
const { data, error } = await supabase.rpc('build_rag_context', {
  // parameters
});
```

#### `generate_embedding`
Generate text embedding

**Usage:**
```javascript
const { data, error } = await supabase.rpc('generate_embedding', {
  // parameters
});
```

#### `execute_ai_action`
Execute AI action

**Usage:**
```javascript
const { data, error } = await supabase.rpc('execute_ai_action', {
  // parameters
});
```

### ANALYTICS Functions

#### `evaluate_agent_rules`
Evaluate agent rules

**Usage:**
```javascript
const { data, error } = await supabase.rpc('evaluate_agent_rules', {
  // parameters
});
```

### API Functions

#### `api_get_handler`
Generic GET handler

**Usage:**
```javascript
const { data, error } = await supabase.rpc('api_get_handler', {
  // parameters
});
```

#### `api_post_handler`
Generic POST handler

**Usage:**
```javascript
const { data, error } = await supabase.rpc('api_post_handler', {
  // parameters
});
```

### BUSINESS Functions

#### `fn_register_business_v1`
Register new business

**Usage:**
```javascript
const { data, error } = await supabase.rpc('fn_register_business_v1', {
  // parameters
});
```

#### `fn_create_business_tables`
Create business tables

**Usage:**
```javascript
const { data, error } = await supabase.rpc('fn_create_business_tables', {
  // parameters
});
```

#### `fn_initialize_business_v1`
Initialize business

**Usage:**
```javascript
const { data, error } = await supabase.rpc('fn_initialize_business_v1', {
  // parameters
});
```

### CACHE Functions

#### `get_cached_result`
Get cached result

**Usage:**
```javascript
const { data, error } = await supabase.rpc('get_cached_result', {
  // parameters
});
```

#### `get_cached_summary`
Get cached summary

**Usage:**
```javascript
const { data, error } = await supabase.rpc('get_cached_summary', {
  // parameters
});
```

#### `generate_cache_key`
Generate cache key

**Usage:**
```javascript
const { data, error } = await supabase.rpc('generate_cache_key', {
  // parameters
});
```

### DATA Functions

#### `chunk_text`
Chunk text for processing

**Usage:**
```javascript
const { data, error } = await supabase.rpc('chunk_text', {
  // parameters
});
```

#### `expand_context`
Expand context from knowledge base

**Usage:**
```javascript
const { data, error } = await supabase.rpc('expand_context', {
  // parameters
});
```

### GDPR Functions

#### `gdpr_delete_user`
GDPR user deletion

**Usage:**
```javascript
const { data, error } = await supabase.rpc('gdpr_delete_user', {
  // parameters
});
```

### NODE Functions

#### `generate_node_hash`
Generate node hash

**Usage:**
```javascript
const { data, error } = await supabase.rpc('generate_node_hash', {
  // parameters
});
```

#### `create_runtime_session`
Create runtime session

**Usage:**
```javascript
const { data, error } = await supabase.rpc('create_runtime_session', {
  // parameters
});
```

#### `create_mobile_session`
Create mobile session

**Usage:**
```javascript
const { data, error } = await supabase.rpc('create_mobile_session', {
  // parameters
});
```

#### `ai_decide`
AI decision making

**Usage:**
```javascript
const { data, error } = await supabase.rpc('ai_decide', {
  // parameters
});
```

#### `apply_karma`
Apply karma

**Usage:**
```javascript
const { data, error } = await supabase.rpc('apply_karma', {
  // parameters
});
```

#### `evaluate_dharma`
Evaluate dharma rules

**Usage:**
```javascript
const { data, error } = await supabase.rpc('evaluate_dharma', {
  // parameters
});
```

#### `apply_billing`
Apply billing

**Usage:**
```javascript
const { data, error } = await supabase.rpc('apply_billing', {
  // parameters
});
```

#### `calculate_node_bill`
Calculate node bill

**Usage:**
```javascript
const { data, error } = await supabase.rpc('calculate_node_bill', {
  // parameters
});
```

### PLUGIN Functions

#### `execute_plugin`
Execute plugin

**Usage:**
```javascript
const { data, error } = await supabase.rpc('execute_plugin', {
  // parameters
});
```

### QUERY Functions

#### `build_template_query`
Build template-based query

**Usage:**
```javascript
const { data, error } = await supabase.rpc('build_template_query', {
  // parameters
});
```

#### `build_kpi_query`
Build KPI query

**Usage:**
```javascript
const { data, error } = await supabase.rpc('build_kpi_query', {
  // parameters
});
```

#### `generate_dynamic_query`
Generate dynamic query

**Usage:**
```javascript
const { data, error } = await supabase.rpc('generate_dynamic_query', {
  // parameters
});
```

#### `build_auto_join_clause`
Build auto join clause

**Usage:**
```javascript
const { data, error } = await supabase.rpc('build_auto_join_clause', {
  // parameters
});
```

### SCHEMA Functions

#### `generate_schema_from_blueprint`
Generate schema from blueprint

**Usage:**
```javascript
const { data, error } = await supabase.rpc('generate_schema_from_blueprint', {
  // parameters
});
```

### SECURITY Functions

#### `check_action_permission`
Check action permission

**Usage:**
```javascript
const { data, error } = await supabase.rpc('check_action_permission', {
  // parameters
});
```

#### `check_feature_access`
Check feature access

**Usage:**
```javascript
const { data, error } = await supabase.rpc('check_feature_access', {
  // parameters
});
```

#### `check_usage_limit`
Check usage limit

**Usage:**
```javascript
const { data, error } = await supabase.rpc('check_usage_limit', {
  // parameters
});
```

#### `gateway_execute`
Gateway execution handler

**Usage:**
```javascript
const { data, error } = await supabase.rpc('gateway_execute', {
  // parameters
});
```

### UI Functions

#### `get_ui_schema`
Get UI schema

**Usage:**
```javascript
const { data, error } = await supabase.rpc('get_ui_schema', {
  // parameters
});
```

#### `get_ui_context`
Get UI context

**Usage:**
```javascript
const { data, error } = await supabase.rpc('get_ui_context', {
  // parameters
});
```

#### `get_widget_data`
Get widget data

**Usage:**
```javascript
const { data, error } = await supabase.rpc('get_widget_data', {
  // parameters
});
```

#### `get_branding`
Get branding config

**Usage:**
```javascript
const { data, error } = await supabase.rpc('get_branding', {
  // parameters
});
```

#### `activate_template_version`
Activate template version

**Usage:**
```javascript
const { data, error } = await supabase.rpc('activate_template_version', {
  // parameters
});
```

### UTILITY Functions

#### `encrypt_payload`
Encrypt payload

**Usage:**
```javascript
const { data, error } = await supabase.rpc('encrypt_payload', {
  // parameters
});
```

#### `decrypt_payload`
Decrypt payload

**Usage:**
```javascript
const { data, error } = await supabase.rpc('decrypt_payload', {
  // parameters
});
```

#### `generate_pin`
Generate PIN

**Usage:**
```javascript
const { data, error } = await supabase.rpc('generate_pin', {
  // parameters
});
```

#### `generate_qr_token`
Generate QR token

**Usage:**
```javascript
const { data, error } = await supabase.rpc('generate_qr_token', {
  // parameters
});
```

