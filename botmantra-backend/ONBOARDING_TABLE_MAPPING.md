# Onboarding Flow: Complete Table & Field Mapping

## Overview
This document maps the complete data flow:
**User Chat Input → AI Function Call → Database Operations → Table Fields**

---

## Step 1: Business Selection (POST /api/onboarding/step1)

### User Action (via Chat)
- User provides: Business name/type

### Database Operations

#### READ from `business_modules`
**Purpose**: Get available business types
```sql
SELECT * FROM business_modules 
WHERE is_active = true;
```
**Required Columns**:
- `module_id` (or `id`) - Primary key
- `module_name` - Display name
- `module_type` - Business category
- `is_active` - Status filter
- `description` (optional) - For AI context

#### WRITE to `core_node` (or create initial node)
**Purpose**: Initialize user's business node
```sql
INSERT INTO core_node (owner_id, business_id, nid_hash, ...)
```
**Required Columns**:
- `owner_id` - User UUID from auth
- `business_id` - Selected module_id
- `nid_hash` - Generated node identifier
- `created_at` - Timestamp
- `status` - 'onboarding' or 'active'

---

## Step 2: Function Selection (POST /api/onboarding/step2)

### User Action (via Chat)
- User selects business functions/features

### Database Operations

#### READ from `business_functions`
**Purpose**: Get available functions for selected business
```sql
SELECT * FROM business_functions 
WHERE module_id = ? AND is_active = true;
```
**Required Columns**:
- `function_id` (or `id`) - Primary key
- `module_id` - Foreign key to business_modules
- `function_name` - Display name
- `function_type` - Category/type
- `is_active` - Status filter
- `permissions_required` (optional) - For access control

#### WRITE to `node_module_config` (or similar)
**Purpose**: Store selected functions for user's node
```sql
INSERT INTO node_module_config (node_id, function_id, ...)
```
**Required Columns**:
- `node_id` - Reference to core_node
- `function_id` - Selected function
- `is_enabled` - true
- `config_data` - JSON settings (optional)

---

## Step 3: Template Selection (POST /api/onboarding/step3)

### User Action (via Chat)
- User chooses UI template/theme

### Database Operations

#### READ from `ui_templates`
**Purpose**: Get available templates for selected functions
```sql
SELECT * FROM ui_templates 
WHERE business_id = ? AND is_active = true;
```
**Required Columns**:
- `template_id` (or `id`) - Primary key
- `template_name` - Display name
- `business_id` - Filter by business type
- `template_type` - Form/dashboard/report
- `is_active` - Status filter
- `preview_url` (optional) - For visual selection
- `ui_config` - JSON template structure

#### WRITE to `core_node` (update)
**Purpose**: Store selected template reference
```sql
UPDATE core_node 
SET selected_template_id = ?, ui_template_json = ?
WHERE nid_hash = ?;
```
**Required Columns** (to update):
- `selected_template_id` - Reference to ui_templates
- `ui_template_json` - Template snapshot (JSONB)

---

## Step 4: Widget/Layout Configuration (POST /api/onboarding/step4)

### User Action (via Chat)
- User customizes layout/widgets

### Database Operations

#### READ from `ui_template_widgets`
**Purpose**: Get available widgets for template
```sql
SELECT * FROM ui_template_widgets 
WHERE template_id = ?;
```
**Required Columns**:
- `widget_id` (or `id`) - Primary key
- `template_id` - Foreign key
- `widget_type` - input/display/action
- `widget_name` - Display name
- `widget_config` - JSON configuration
- `default_position` - Layout hint

#### READ from `ui_widget_layouts`
**Purpose**: Get layout options
```sql
SELECT * FROM ui_widget_layouts 
WHERE template_id = ?;
```
**Required Columns**:
- `layout_id` (or `id`) - Primary key
- `template_id` - Foreign key
- `layout_name` - Display name
- `layout_config` - JSON grid/flex config
- `is_default` - Flag

#### WRITE to user's layout (custom table or core_node)
**Purpose**: Store customized layout
```sql
UPDATE core_node 
SET custom_layout_json = ?
WHERE nid_hash = ?;
```
**Required Columns**:
- `custom_layout_json` - JSONB with widget positions

---

## Step 5: Theme Selection (POST /api/onboarding/step5)

### User Action (via Chat)
- User selects color theme/style

### Database Operations

#### READ from `ui_theme_settings`
**Purpose**: Get available themes
```sql
SELECT * FROM ui_theme_settings 
WHERE is_active = true;
```
**Required Columns**:
- `theme_id` (or `id`) - Primary key
- `theme_name` - Display name
- `theme_type` - dark/light/custom
- `color_scheme` - JSON colors
- `is_active` - Status filter

#### WRITE to `core_node` (update)
**Purpose**: Store theme preference
```sql
UPDATE core_node 
SET theme_id = ?, theme_config = ?
WHERE nid_hash = ?;
```
**Required Columns**:
- `theme_id` - Reference to ui_theme_settings
- `theme_config` - JSON theme overrides

---

## Step 6: Field Selection & Mapping (POST /api/onboarding/step6)

### User Action (via Chat)
- User selects which data fields they need

### Database Operations

#### READ from `data_model_registry`
**Purpose**: Get available fields for selected functions
```sql
SELECT * FROM data_model_registry 
WHERE business_id = ? AND function_id = ?;
```
**Required Columns**:
- `field_id` (or `id`) - Primary key
- `business_id` - Business context
- `function_id` - Function context
- `field_name` - Technical name
- `display_name` - User-friendly name
- `field_type` - data type (string/number/date)
- `is_required` - Validation flag
- `validation_rules` - JSON rules
- `ui_component_type` - Which widget to use

#### WRITE to `node_selected_fields` (or similar)
**Purpose**: Store user's field selections
```sql
INSERT INTO node_selected_fields (node_id, field_id, ...)
```
**Required Columns**:
- `node_id` - Reference to core_node
- `field_id` - Reference to data_model_registry
- `is_enabled` - true
- `display_order` - Sort order
- `custom_label` - User override (optional)

#### WRITE to `core_node` (snapshot)
**Purpose**: Store complete field configuration
```sql
UPDATE core_node 
SET model_fields_json = ?, ui_fields_json = ?
WHERE nid_hash = ?;
```
**Required Columns**:
- `model_fields_json` - JSONB snapshot of selected fields
- `ui_fields_json` - JSONB snapshot of UI mappings

#### WRITE to `ui_template` (snapshot)
**Purpose**: Store template-level field mapping
```sql
UPDATE ui_templates 
SET ui_fields_json = ?, model_fields_json = ?
WHERE template_id = ?;
```
**Required Columns**:
- `ui_fields_json` - JSONB UI configuration
- `model_fields_json` - JSONB data model

---

## Step 7: Permissions & Finalization (POST /api/onboarding/step7)

### User Action (via Chat)
- User sets access permissions and finalizes setup

### Database Operations

#### READ from `node_permission` (or similar)
**Purpose**: Get default permission templates
```sql
SELECT * FROM node_permission 
WHERE permission_type = 'template';
```
**Required Columns**:
- `permission_id` (or `id`) - Primary key
- `permission_name` - Display name
- `permission_type` - template/custom
- `permission_config` - JSON rules
- `can_read`, `can_write`, `can_delete` - Flags

#### WRITE to `core_node` (finalize)
**Purpose**: Set permissions and activate node
```sql
UPDATE core_node 
SET status = 'active',
    perm_blob = ?,
    completed_at = NOW()
WHERE nid_hash = ?;
```
**Required Columns**:
- `status` - Change to 'active'
- `perm_blob` - JSONB permission rules
- `completed_at` - Timestamp

#### WRITE to `ui_context_cache` (optional)
**Purpose**: Cache compiled UI configuration for fast loading
```sql
INSERT INTO ui_context_cache (node_id, cache_key, cache_data)
```
**Required Columns**:
- `node_id` - Reference to core_node
- `cache_key` - Unique identifier
- `cache_data` - JSONB compiled config
- `created_at` - Timestamp
- `expires_at` - TTL

---

## Chat AI Function Mapping

### User Says: "I want to start a restaurant business"
**AI Calls**: `POST /api/onboarding/step1` with `{ business_type: "restaurant" }`
**Tables Touched**: `business_modules` (READ), `core_node` (INSERT)

### User Says: "I need inventory and billing"
**AI Calls**: `POST /api/onboarding/step2` with `{ functions: ["inventory", "billing"] }`
**Tables Touched**: `business_functions` (READ), `node_module_config` (INSERT)

### User Says: "Show me modern templates"
**AI Calls**: `POST /api/onboarding/step3`
**Tables Touched**: `ui_templates` (READ), `core_node` (UPDATE)

### User Says: "I want dark theme"
**AI Calls**: `POST /api/onboarding/step5` with `{ theme: "dark" }`
**Tables Touched**: `ui_theme_settings` (READ), `core_node` (UPDATE)

### User Says: "I need customer name, phone, and email fields"
**AI Calls**: `POST /api/onboarding/step6` with `{ fields: ["customer_name", "phone", "email"] }`
**Tables Touched**: 
- `data_model_registry` (READ)
- `node_selected_fields` (INSERT)
- `core_node` (UPDATE with snapshots)
- `ui_template` (UPDATE with snapshots)

---

## Critical Table Verification Checklist

Before the onboarding flow works, verify these tables have these columns:

### ✅ business_modules
- [ ] Primary key (module_id or id)
- [ ] module_name
- [ ] is_active

### ✅ business_functions
- [ ] Primary key (function_id or id)
- [ ] module_id (FK)
- [ ] function_name
- [ ] is_active

### ✅ ui_templates
- [ ] Primary key (template_id or id)
- [ ] template_name
- [ ] business_id
- [ ] is_active
- [ ] ui_fields_json (JSONB) - **ADDED**
- [ ] model_fields_json (JSONB) - **ADDED**

### ✅ ui_template_widgets
- [ ] Primary key (widget_id or id)
- [ ] template_id (FK)
- [ ] widget_type
- [ ] widget_name

### ✅ ui_widget_layouts
- [ ] Primary key (layout_id or id)
- [ ] template_id (FK)
- [ ] layout_name
- [ ] layout_config (JSONB)

### ✅ ui_theme_settings
- [ ] Primary key (theme_id or id)
- [ ] theme_name
- [ ] color_scheme (JSONB)
- [ ] is_active

### ✅ data_model_registry
- [ ] Primary key (field_id or id)
- [ ] business_id
- [ ] function_id
- [ ] field_name
- [ ] display_name
- [ ] field_type
- [ ] ui_component_type

### ✅ node_permission
- [ ] Primary key (permission_id or id)
- [ ] permission_name
- [ ] permission_config (JSONB)

### ✅ core_node
- [ ] nid_hash (unique identifier)
- [ ] owner_id (user reference)
- [ ] business_id
- [ ] selected_template_id
- [ ] theme_id
- [ ] status
- [ ] ui_template_json (JSONB) - **ADDED**
- [ ] ui_fields_json (JSONB) - **ADDED**
- [ ] model_fields_json (JSONB) - **ADDED**
- [ ] perm_blob (JSONB)

### ✅ ui_context_cache
- [ ] Primary key (id)
- [ ] node_id (FK to core_node)
- [ ] cache_key
- [ ] cache_data (JSONB)
- [ ] created_at
- [ ] expires_at

---

## Next Steps

1. **Run schema-verification-queries.sql** in Supabase to get all column definitions
2. **Compare results** with this mapping document
3. **Update API routes** to use exact column names from your schema
4. **Create missing columns** if any are not present (especially JSONB columns)
5. **Test each step** to verify data flow works correctly
