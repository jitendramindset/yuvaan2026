/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NODE TYPE SCHEMA DEFINITION — Neural OS Foundation         ║
 * ║  Every object in the system = node_core entry               ║
 * ║  Actual DB table: node_core (comprehensive schema below)    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * NODE_CORE TABLE SCHEMA (Complete Field Documentation):
 *
 * CORE IDENTIFIERS:
 * - row_id: bigint (Primary Key, Auto-increment)
 * - owner_id: uuid (Owner of this node)
 * - nid_hash: text (SHA256 hash: owner_id + timestamp, unique node identifier)
 *
 * DATA STORAGE BLOBS:
 * - dna_blob: bytea (Core node DNA - type, relationships, metadata)
 * - field_map: bytea (Structured field data, JSON-encoded)
 * - perm_blob: bytea (Permission rules and access control)
 * - rule_blob: bytea (Business rules and validation logic)
 * - runtime_blob: bytea (Runtime state and execution data)
 * - memory_blob: bytea (AI memory and context data)
 * - ui_blob: bytea (UI configuration and layout data)
 * - sys_blob: bytea (System metadata and internal state)
 *
 * AI/VECTOR DATA:
 * - vec_embedding: vector (pgvector embedding for semantic search)
 * - state_hash: text (Hash of current node state for change detection)
 *
 * TIMESTAMPS:
 * - created_at: timestamp (Creation timestamp)
 * - updated_at: timestamp (Last modification timestamp)
 *
 * HIERARCHY & RELATIONSHIPS:
 * - parent_nid_hash: text (Parent node identifier)
 * - node_depth: integer (Depth in node hierarchy)
 *
 * ARCHIVAL SYSTEM:
 * - is_archived: boolean (Soft delete flag)
 * - archived_at: timestamp (When node was archived)
 *
 * TRUST & KARMA SYSTEM:
 * - karma_score: integer (User reputation score -100 to +100)
 * - trust_score: integer (System trust score 0-100)
 * - reputation_level: text (Computed reputation tier)
 *
 * STATE MANAGEMENT:
 * - node_state: text (Current operational state)
 * - valid_until: timestamp (Expiration date)
 * - can_execute: boolean (Execution permission flag)
 * - can_update: boolean (Update permission flag)
 * - external_access: boolean (External API access allowed)
 *
 * HEALTH MONITORING:
 * - health_score: integer (System health score 0-100)
 * - last_check: timestamp (Last health check timestamp)
 *
 * SLEEP/WAKE SYSTEM:
 * - sleep_after: timestamp (When to enter sleep mode)
 * - wakeup_at: timestamp (When to wake from sleep)
 * - is_cold: boolean (Cold storage flag)
 *
 * FINANCIAL SYSTEM:
 * - wallet_id: uuid (Associated wallet identifier)
 *
 * GAMIFICATION:
 * - experience_level: integer (User experience level)
 * - exposure_mode: text (Content exposure preferences)
 *
 * SECURITY & AUTHENTICATION:
 * - pin_hash: text (Hashed PIN for local auth)
 * - pin_expiry: timestamp (PIN expiration)
 * - is_activated: boolean (Account activation status)
 * - device_fingerprint: text (Device identification)
 * - qr_token_hash: text (QR code authentication token)
 * - qr_expiry: timestamp (QR token expiration)
 * - recovery_qr_hash: text (Recovery QR token)
 * - recovery_expiry: timestamp (Recovery token expiration)
 *
 * SYNCHRONIZATION:
 * - sync_version: integer (Version for conflict resolution)
 * - last_sync_at: timestamp (Last synchronization timestamp)
 *
 * NODE TYPE SYSTEM:
 * - node_type: node_type_enum (Type classification)
 * - node_system_prompt: text (AI system prompt for this node)
 * - prompt_version: integer (Prompt version number)
 * - prompt_last_update: timestamp (Last prompt modification)
 *
 * PERFORMANCE:
 * - hot_cache: boolean (Hot cache flag for frequently accessed nodes)
 *
 * GEOLOCATION:
 * - latitude: float8 (GPS latitude coordinate)
 * - longitude: float8 (GPS longitude coordinate)
 *
 * ENCRYPTION:
 * - encryption_key_ref: uuid (Reference to encryption key)
 *
 * PRIVACY & PERMISSIONS:    
 * - privacy_mode: privacy_mode_enum (Privacy level setting)
 * - permission_scope: permission_scope_enum (Permission scope)
 *
 * TASK MANAGEMENT:
 * - task_status: task_status_enum (Current task status)
 * - status: tx_status_enum (Transaction/blockchain status)
 *
 * Node Types:
 *   1. brand_root       — One per brand (VANSHAWALI, JEETMANTRA, MANTRAVAT, JUNIOR, BOTMANTRA)
 *   2. user_node         — Living node (parent, student, employee, admin, child)
 *   3. nonliving_node    — Business, family group, document, course, task, video, company
 *   4. dashboard_layout  — Grid/feed/tree/kanban layouts
 *   5. widget            — UI widget blocks
 *   6. permission_rule   — Access control rules
 *   7. role_node         — Role definitions
 *   8. data_template     — Data structure templates
 *   9. relationship_rule — Relationship definitions
 *  10. theme_config      — Visual theming
 */

const crypto = require('crypto');
const uuid = require('uuid');

// ─── BRAND DEFINITIONS ───────────────────────────────────────
const BRANDS = {
  VANSHAWALI:  { code: 'VANSHAWALI',  name: 'Vanshawali',   ageRange: [0, 150], description: 'Family & Genealogy' },
  JEETMANTRA:  { code: 'JEETMANTRA',  name: 'JeetMantra',   ageRange: [10, 25], description: 'Education & Learning' },
  MANTRAVAT:   { code: 'MANTRAVAT',   name: 'Mantravat',    ageRange: [18, 150], description: 'Business & Enterprise' },
  JUNIOR:      { code: 'JUNIOR',      name: 'Junior Mantra', ageRange: [0, 12], description: 'Kids Content' },
  BOTMANTRA:   { code: 'BOTMANTRA',   name: 'BotMantra',    ageRange: [0, 150], description: 'AI Platform' }
};

// ─── MASTER NODE SCHEMA (matches node_core table exactly) ───
const MASTER_NODE_SCHEMA = {
  // Core Identifiers
  row_id:              { type: 'bigint', primary_key: true, auto_increment: true, description: 'Primary key, auto-increment' },
  owner_id:            { type: 'uuid', description: 'Owner of this node' },
  nid_hash:            { type: 'text', description: 'SHA256 hash: owner_id + timestamp, unique node identifier' },

  // Data Storage Blobs
  dna_blob:            { type: 'bytea', description: 'Core node DNA - type, relationships, metadata' },
  field_map:           { type: 'bytea', description: 'Structured field data, JSON-encoded' },
  perm_blob:           { type: 'bytea', description: 'Permission rules and access control' },
  rule_blob:           { type: 'bytea', description: 'Business rules and validation logic' },
  runtime_blob:        { type: 'bytea', description: 'Runtime state and execution data' },
  memory_blob:         { type: 'bytea', description: 'AI memory and context data' },
  ui_blob:             { type: 'bytea', description: 'UI configuration and layout data' },
  sys_blob:            { type: 'bytea', description: 'System metadata and internal state' },

  // AI/Vector Data
  vec_embedding:       { type: 'vector', description: 'pgvector embedding for semantic search' },
  state_hash:          { type: 'text', description: 'Hash of current node state for change detection' },

  // Timestamps
  created_at:          { type: 'timestamp', description: 'Creation timestamp' },
  updated_at:          { type: 'timestamp', description: 'Last modification timestamp' },

  // Hierarchy & Relationships
  parent_nid_hash:     { type: 'text', nullable: true, description: 'Parent node identifier' },
  node_depth:          { type: 'integer', default: 0, description: 'Depth in node hierarchy' },

  // Archival System
  is_archived:         { type: 'boolean', default: false, description: 'Soft delete flag' },
  archived_at:         { type: 'timestamp', nullable: true, description: 'When node was archived' },

  // Trust & Karma System
  karma_score:         { type: 'integer', default: 0, min: -100, max: 100, description: 'User reputation score -100 to +100' },
  trust_score:         { type: 'integer', default: 50, min: 0, max: 100, description: 'System trust score 0-100' },
  reputation_level:    { type: 'text', default: 'neutral', description: 'Computed reputation tier' },

  // State Management
  node_state:          { type: 'text', default: 'active', description: 'Current operational state' },
  valid_until:         { type: 'timestamp', nullable: true, description: 'Expiration date' },
  can_execute:         { type: 'boolean', default: true, description: 'Execution permission flag' },
  can_update:          { type: 'boolean', default: true, description: 'Update permission flag' },
  external_access:     { type: 'boolean', default: false, description: 'External API access allowed' },

  // Health Monitoring
  health_score:        { type: 'integer', default: 100, min: 0, max: 100, description: 'System health score 0-100' },
  last_check:          { type: 'timestamp', nullable: true, description: 'Last health check timestamp' },

  // Sleep/Wake System
  sleep_after:         { type: 'timestamp', nullable: true, description: 'When to enter sleep mode' },
  wakeup_at:           { type: 'timestamp', nullable: true, description: 'When to wake from sleep' },
  is_cold:             { type: 'boolean', default: false, description: 'Cold storage flag' },

  // Financial System
  wallet_id:           { type: 'uuid', nullable: true, description: 'Associated wallet identifier' },

  // Gamification
  experience_level:    { type: 'integer', default: 1, description: 'User experience level' },
  exposure_mode:       { type: 'text', default: 'normal', description: 'Content exposure preferences' },

  // Security & Authentication
  pin_hash:            { type: 'text', nullable: true, description: 'Hashed PIN for local auth' },
  pin_expiry:          { type: 'timestamp', nullable: true, description: 'PIN expiration' },
  is_activated:        { type: 'boolean', default: true, description: 'Account activation status' },
  device_fingerprint:  { type: 'text', nullable: true, description: 'Device identification' },
  qr_token_hash:       { type: 'text', nullable: true, description: 'QR code authentication token' },
  qr_expiry:           { type: 'timestamp', nullable: true, description: 'QR token expiration' },
  recovery_qr_hash:    { type: 'text', nullable: true, description: 'Recovery QR token' },
  recovery_expiry:     { type: 'timestamp', nullable: true, description: 'Recovery token expiration' },

  // Synchronization
  sync_version:        { type: 'integer', default: 1, description: 'Version for conflict resolution' },
  last_sync_at:        { type: 'timestamp', nullable: true, description: 'Last synchronization timestamp' },

  // Node Type System
  node_type:           { type: 'node_type_enum', description: 'Type classification' },
  node_system_prompt:  { type: 'text', nullable: true, description: 'AI system prompt for this node' },
  prompt_version:      { type: 'integer', default: 1, description: 'Prompt version number' },
  prompt_last_update:  { type: 'timestamp', nullable: true, description: 'Last prompt modification' },

  // Performance
  hot_cache:           { type: 'boolean', default: false, description: 'Hot cache flag for frequently accessed nodes' },

  // Geolocation
  latitude:            { type: 'float8', nullable: true, description: 'GPS latitude coordinate' },
  longitude:           { type: 'float8', nullable: true, description: 'GPS longitude coordinate' },

  // Encryption
  encryption_key_ref:  { type: 'uuid', nullable: true, description: 'Reference to encryption key' },

  // Privacy & Permissions
  privacy_mode:        { type: 'privacy_mode_enum', default: 'standard', description: 'Privacy level setting' },
  permission_scope:    { type: 'permission_scope_enum', default: 'personal', description: 'Permission scope' },

  // Task Management
  task_status:         { type: 'task_status_enum', default: 'pending', description: 'Current task status' },
  status:              { type: 'tx_status_enum', default: 'active', description: 'Transaction/blockchain status' }
};

// ─── ENUM DEFINITIONS (match database enums) ─────────────────
const NODE_TYPE_ENUM = {
  brand_root: 'brand_root',
  user_node: 'user_node',
  nonliving_node: 'nonliving_node',
  dashboard_layout: 'dashboard_layout',
  widget: 'widget',
  permission_rule: 'permission_rule',
  role_node: 'role_node',
  data_template: 'data_template',
  relationship_rule: 'relationship_rule',
  theme_config: 'theme_config'
};

const PRIVACY_MODE_ENUM = {
  public: 'public',
  standard: 'standard',
  private: 'private',
  restricted: 'restricted'
};

const PERMISSION_SCOPE_ENUM = {
  personal: 'personal',
  family: 'family',
  group: 'group',
  organizational: 'organizational',
  public: 'public'
};

const TASK_STATUS_ENUM = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  blocked: 'blocked'
};

const TX_STATUS_ENUM = {
  active: 'active',
  pending: 'pending',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled'
};

// ─── NODE TYPE DEFINITIONS ───────────────────────────────────
function NODE_TYPES_REGISTRY() {
  return {
    // 1. Brand Root — one per brand
    brand_root: {
      label: 'Brand Root',
      db_node_type: 'nonliving',    // maps to node_core.node_type enum
      singleton_per_brand: true,
      metadata_schema: {
        required: ['brand_code', 'brand_name'],
        properties: {
          brand_code:     { type: 'string', enum: Object.keys(BRANDS) },
          brand_name:     { type: 'string' },
          default_layout: { type: 'uuid', nullable: true },
          theme_id:       { type: 'uuid', nullable: true },
          role_matrix:    { type: 'object', default: {} },
          feature_flags:  { type: 'object', default: {} }
        }
      }
    },

    // 2. User Node — living node (alias for user_node)
    user: {
      label: 'User (Living Node)',
      db_node_type: 'living',
      metadata_schema: {
        required: ['name', 'profile_type'],
        properties: {
          name:          { type: 'string' },
          email:         { type: 'string', nullable: true },
          age:           { type: 'integer', nullable: true },
          gender:        { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'], nullable: true },
          profile_type:  { type: 'string', enum: ['parent', 'student', 'employee', 'admin', 'child', 'teacher', 'personal'] },
          brand_default: { type: 'string', nullable: true },
          mobile:        { type: 'string', nullable: true },
          avatar_url:    { type: 'string', nullable: true }
        }
      }
    },

    // 2b. User Node (original)
    user_node: {
      label: 'User (Living Node)',
      db_node_type: 'living',
      metadata_schema: {
        required: ['name', 'profile_type'],
        properties: {
          name:          { type: 'string' },
          email:         { type: 'string', nullable: true },
          age:           { type: 'integer', nullable: true },
          gender:        { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'], nullable: true },
          profile_type:  { type: 'string', enum: ['parent', 'student', 'employee', 'admin', 'child', 'teacher', 'personal'] },
          brand_default: { type: 'string', nullable: true },
          mobile:        { type: 'string', nullable: true },
          avatar_url:    { type: 'string', nullable: true }
        }
      }
    },

    // 3. Non-Living Node — everything else
    nonliving_node: {
      label: 'Non-Living Node',
      db_node_type: 'nonliving',
      subtypes: ['business', 'family_group', 'document', 'course', 'task', 'video', 'company', 'post', 'homework'],
      metadata_schema: {
        required: ['subtype', 'name'],
        properties: {
          subtype:     { type: 'string' },
          name:        { type: 'string' },
          description: { type: 'string', nullable: true },
          status:      { type: 'string', enum: ['active', 'inactive', 'archived', 'draft'], default: 'active' },
          content:     { type: 'object', nullable: true },
          tags:        { type: 'array', items: 'string', default: [] },
          attachments: { type: 'array', items: 'object', default: [] }
        }
      }
    },

    // 3b. Specific Content Node Types
    post: {
      label: 'Post',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['title', 'content'],
        properties: {
          title:       { type: 'string' },
          content:     { type: 'string' },
          media:       { type: 'array', items: 'object', default: [] },
          visibility:  { type: 'string', enum: ['public', 'friends', 'family_only', 'private'], default: 'friends' },
          tags:        { type: 'array', items: 'string', default: [] },
          mentions:    { type: 'array', items: 'string', default: [] }
        }
      }
    },

    document: {
      label: 'Document',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['title', 'content_type'],
        properties: {
          title:         { type: 'string' },
          content_type:  { type: 'string', enum: ['pdf', 'doc', 'docx', 'txt', 'md', 'html'] },
          content:       { type: 'string' },
          version:       { type: 'string', default: '1.0' },
          visibility:    { type: 'string', enum: ['public', 'private'], default: 'private' },
          tags:          { type: 'array', items: 'string', default: [] }
        }
      }
    },

    video: {
      label: 'Video',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['title', 'url'],
        properties: {
          title:           { type: 'string' },
          description:     { type: 'string', nullable: true },
          url:             { type: 'string' },
          duration:        { type: 'integer', nullable: true },
          thumbnail:       { type: 'string', nullable: true },
          tags:            { type: 'array', items: 'string', default: [] },
          visibility:      { type: 'string', enum: ['public', 'private', 'student_only'], default: 'public' },
          age_restriction: { type: 'integer', nullable: true }
        }
      }
    },

    task: {
      label: 'Task',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['title'],
        properties: {
          title:         { type: 'string' },
          description:   { type: 'string', nullable: true },
          assigned_to:   { type: 'string', nullable: true },
          deadline:      { type: 'string', nullable: true },
          priority:      { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
          status:        { type: 'string', enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
          company_id:    { type: 'string', nullable: true },
          visibility:    { type: 'string', enum: ['owner', 'team'], default: 'owner' }
        }
      }
    },

    homework: {
      label: 'Homework',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['title', 'subject'],
        properties: {
          title:         { type: 'string' },
          description:   { type: 'string', nullable: true },
          subject:       { type: 'string' },
          class_id:      { type: 'string', nullable: true },
          deadline:      { type: 'string' },
          instructions:  { type: 'string', nullable: true },
          attachments:   { type: 'array', items: 'object', default: [] },
          visibility:    { type: 'string', enum: ['student_only', 'class_only'], default: 'student_only' },
          status:        { type: 'string', enum: ['published', 'draft', 'archived'], default: 'published' }
        }
      }
    },

    message: {
      label: 'Message',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['content'],
        properties: {
          content:      { type: 'string' },
          message_type: { type: 'string', enum: ['text', 'image', 'file', 'system'], default: 'text' },
          visibility:   { type: 'string', enum: ['recipient_only'], default: 'recipient_only' }
        }
      }
    },

    comment: {
      label: 'Comment',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['content'],
        properties: {
          content:    { type: 'string' },
          visibility: { type: 'string', enum: ['same_as_parent'], default: 'same_as_parent' }
        }
      }
    },

    course: {
      label: 'Course',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['title', 'subject'],
        properties: {
          title:         { type: 'string' },
          subject:       { type: 'string' },
          description:   { type: 'string', nullable: true },
          curriculum:    { type: 'object', default: {} },
          visibility:    { type: 'string', enum: ['public', 'students_enrolled'], default: 'public' },
          status:        { type: 'string', enum: ['active', 'inactive', 'archived'], default: 'active' }
        }
      }
    },

    event: {
      label: 'Event',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['title', 'start_time'],
        properties: {
          title:       { type: 'string' },
          description: { type: 'string', nullable: true },
          start_time:  { type: 'string' },
          end_time:    { type: 'string', nullable: true },
          location:    { type: 'string', nullable: true },
          rsvp_list:   { type: 'array', items: 'string', default: [] },
          visibility:  { type: 'string', enum: ['public', 'invited', 'private'], default: 'public' }
        }
      }
    },

    // 3c. Live Entity Node Types
    family_member: {
      label: 'Family Member',
      db_node_type: 'living',
      metadata_schema: {
        required: ['name', 'relation_type'],
        properties: {
          name:          { type: 'string' },
          relation_type: { type: 'string', enum: ['parent', 'sibling', 'child', 'spouse', 'grandparent', 'grandchild', 'aunt', 'uncle', 'cousin'] },
          age:           { type: 'integer', nullable: true },
          profile_picture: { type: 'string', nullable: true },
          visibility:    { type: 'string', enum: ['family_only', 'private'], default: 'family_only' }
        }
      }
    },

    friend: {
      label: 'Friend',
      db_node_type: 'living',
      metadata_schema: {
        required: ['name'],
        properties: {
          name:          { type: 'string' },
          profile_picture: { type: 'string', nullable: true },
          visibility:    { type: 'string', enum: ['friend_group', 'private'], default: 'friend_group' }
        }
      }
    },

    group: {
      label: 'Group',
      db_node_type: 'living',
      metadata_schema: {
        required: ['name'],
        properties: {
          name:          { type: 'string' },
          description:   { type: 'string', nullable: true },
          members:       { type: 'array', items: 'string', default: [] },
          visibility:    { type: 'string', enum: ['public', 'private', 'invite_only'], default: 'private' }
        }
      }
    },

    company: {
      label: 'Company',
      db_node_type: 'living',
      metadata_schema: {
        required: ['name'],
        properties: {
          name:          { type: 'string' },
          description:   { type: 'string', nullable: true },
          industry:      { type: 'string', nullable: true },
          size:          { type: 'string', enum: ['startup', 'small', 'medium', 'large', 'enterprise'], nullable: true },
          logo:          { type: 'string', nullable: true },
          visibility:    { type: 'string', enum: ['public', 'private'], default: 'public' }
        }
      }
    },

    employee: {
      label: 'Employee',
      db_node_type: 'living',
      metadata_schema: {
        required: ['name'],
        properties: {
          name:          { type: 'string' },
          position:      { type: 'string', nullable: true },
          department:    { type: 'string', nullable: true },
          visibility:    { type: 'string', enum: ['company_only'], default: 'company_only' }
        }
      }
    },

    // 3d. System Node Types
    vector_memory: {
      label: 'Vector Memory',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['memory_type'],
        properties: {
          memory_type:   { type: 'string', enum: ['user_context', 'conversation', 'document', 'pattern'] },
          embeddings:    { type: 'array', items: 'number', default: [] },
          last_updated:  { type: 'string' },
          context_size:  { type: 'integer', default: 100 }
        }
      }
    },

    relationship_map: {
      label: 'Relationship Map',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: [],
        properties: {
          relationships: { type: 'array', items: 'object', default: [] }
        }
      }
    },

    layout_schema: {
      label: 'Layout Schema',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['active_brand', 'ui_schema'],
        properties: {
          active_brand: { type: 'string' },
          ui_schema:    { type: 'object' }
        }
      }
    },

    permission_set: {
      label: 'Permission Set',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: [],
        properties: {
          role:         { type: 'string', default: 'basic_user' },
          permissions:  { type: 'object', default: {} },
          restrictions: { type: 'object', default: {} }
        }
      }
    },

    // 4. Dashboard Layout
    dashboard_layout: {
      label: 'Dashboard Layout',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['layout_type'],
        properties: {
          layout_type:    { type: 'string', enum: ['grid', 'feed', 'tree', 'kanban', 'timeline', 'split'] },
          widgets:        { type: 'array', items: 'uuid', default: [] },
          theme_override: { type: 'object', nullable: true },
          columns:        { type: 'integer', default: 12 },
          row_height:     { type: 'integer', default: 80 },
          breakpoints:    { type: 'object', default: { lg: 1200, md: 996, sm: 768, xs: 480 } },
          is_default:     { type: 'boolean', default: false }
        }
      }
    },

    // 5. Widget
    widget: {
      label: 'Widget',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['widget_type'],
        properties: {
          widget_type:       { type: 'string', enum: ['feed', 'tree', 'table', 'kanban', 'video', 'form', 'card', 'chart', 'calendar', 'chat', 'map', 'stats'] },
          data_source:       { type: 'object', default: {} },
          ui_schema:         { type: 'object', default: {} },
          filters:           { type: 'object', default: {} },
          interaction_rules: { type: 'object', default: {} },
          position:          { type: 'object', default: { x: 0, y: 0, w: 4, h: 3 } },
          refresh_interval:  { type: 'integer', nullable: true }
        }
      }
    },

    // 6. Permission Rule
    permission_rule: {
      label: 'Permission Rule',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['allowed_roles', 'allowed_actions'],
        properties: {
          allowed_roles:      { type: 'array', items: 'string' },
          allowed_actions:    { type: 'array', items: 'string', enum_items: ['read', 'write', 'delete', 'manage', 'share', 'execute'] },
          visibility_scope:   { type: 'string', enum: ['brand', 'private', 'public', 'group', 'family'] },
          trust_requirement:  { type: 'integer', default: 0, min: 0, max: 100 },
          karma_requirement:  { type: 'integer', default: 0 }
        }
      }
    },

    // 7. Role Node
    role_node: {
      label: 'Role Node',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['role_name', 'role_code'],
        properties: {
          role_name:           { type: 'string' },
          role_code:           { type: 'string' },
          inheritance:         { type: 'array', items: 'string', default: [] },
          default_permissions: { type: 'object', default: { read: true, write: false, delete: false, manage: false } },
          is_system:           { type: 'boolean', default: false }
        }
      }
    },

    // 8. Data Template
    data_template: {
      label: 'Data Template',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['template_name', 'required_fields'],
        properties: {
          template_name:    { type: 'string' },
          required_fields:  { type: 'array', items: 'object' },
          optional_fields:  { type: 'array', items: 'object', default: [] },
          validation_rules: { type: 'object', default: {} },
          version:          { type: 'integer', default: 1 }
        }
      }
    },

    // 9. Relationship Rule
    relationship_rule: {
      label: 'Relationship Rule',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['relationship_type'],
        properties: {
          relationship_type: { type: 'string', enum: ['parent-child', 'teacher-student', 'employer-employee', 'family-member', 'friend', 'colleague', 'mentor-mentee', 'sibling'] },
          bidirectional:     { type: 'boolean', default: false },
          validity_period:   { type: 'object', default: { start: null, end: null } },
          max_connections:   { type: 'integer', nullable: true },
          requires_approval: { type: 'boolean', default: false }
        }
      }
    },

    // 10. Theme Config
    theme_config: {
      label: 'Theme Configuration',
      db_node_type: 'nonliving',
      metadata_schema: {
        required: ['theme_name'],
        properties: {
          theme_name:      { type: 'string' },
          primary_color:   { type: 'string', default: '#6366f1' },
          secondary_color: { type: 'string', default: '#8b5cf6' },
          accent_color:    { type: 'string', default: '#06b6d4' },
          font:            { type: 'string', default: 'Inter' },
          dark_mode:       { type: 'boolean', default: false },
          animation_style: { type: 'string', enum: ['none', 'subtle', 'smooth', 'dynamic'], default: 'subtle' },
          spacing:         { type: 'string', enum: ['compact', 'normal', 'relaxed'], default: 'normal' },
          border_radius:   { type: 'string', enum: ['none', 'small', 'medium', 'large'], default: 'medium' }
        }
      }
    }
  };
}

// ─── SCHEMA VALIDATOR ────────────────────────────────────────
function validateNodeData(nodeType, metadata, brandScope) {
  const registry = NODE_TYPES_REGISTRY();
  const typeDef = registry[nodeType];
  if (!typeDef) {
    return { valid: false, errors: [`Unknown node_type: ${nodeType}`] };
  }

  const errors = [];

  // Brand validation
  if (brandScope && !BRANDS[brandScope]) {
    errors.push(`Invalid brand_scope: ${brandScope}. Valid: ${Object.keys(BRANDS).join(', ')}`);
  }

  // Required metadata fields
  const schema = typeDef.metadata_schema;
  if (schema.required) {
    for (const field of schema.required) {
      if (metadata[field] === undefined || metadata[field] === null || metadata[field] === '') {
        errors.push(`Missing required field: metadata.${field}`);
      }
    }
  }

  // Property type validation
  if (schema.properties && metadata) {
    for (const [key, def] of Object.entries(schema.properties)) {
      const val = metadata[key];
      if (val === undefined || val === null) continue; // skip optional

      if (def.enum && !def.enum.includes(val)) {
        errors.push(`Invalid value for metadata.${key}: "${val}". Valid: ${def.enum.join(', ')}`);
      }
      if (def.type === 'integer' && typeof val !== 'number') {
        errors.push(`metadata.${key} must be integer, got ${typeof val}`);
      }
      if (def.type === 'string' && typeof val !== 'string') {
        errors.push(`metadata.${key} must be string, got ${typeof val}`);
      }
      if (def.type === 'boolean' && typeof val !== 'boolean') {
        errors.push(`metadata.${key} must be boolean, got ${typeof val}`);
      }
      if (def.type === 'array' && !Array.isArray(val)) {
        errors.push(`metadata.${key} must be array, got ${typeof val}`);
      }
      if (def.min !== undefined && val < def.min) {
        errors.push(`metadata.${key} must be >= ${def.min}`);
      }
      if (def.max !== undefined && val > def.max) {
        errors.push(`metadata.${key} must be <= ${def.max}`);
      }
    }
  }

  // Subtype validation for nonliving_node
  if (nodeType === 'nonliving_node' && typeDef.subtypes) {
    if (metadata.subtype && !typeDef.subtypes.includes(metadata.subtype)) {
      errors.push(`Invalid subtype: "${metadata.subtype}". Valid: ${typeDef.subtypes.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── NID HASH GENERATOR ─────────────────────────────────────
function generateNidHash(ownerId, nodeType = 'user_node') {
  return crypto.createHash('sha256')
    .update(`${ownerId}:${nodeType}:${Date.now()}:${Math.random()}`)
    .digest('hex');
}

// ─── BLOB ENCODERS ───────────────────────────────────────────
function encodeToBlob(data) {
  return `\\x${Buffer.from(JSON.stringify(data)).toString('hex')}`;
}

function decodeFromBlob(hexStr) {
  try {
    if (!hexStr) return null;
    const clean = hexStr.startsWith('\\x') ? hexStr.slice(2) : hexStr;
    return JSON.parse(Buffer.from(clean, 'hex').toString('utf8'));
  } catch {
    return null;
  }
}

// ─── NODE BUILDER ────────────────────────────────────────────
// Transforms a clean node definition into a node_core DB row
function buildNodeCoreRow(nodeType, ownerId, metadata, options = {}) {
  const registry = NODE_TYPES_REGISTRY();
  const typeDef = registry[nodeType];
  if (!typeDef) throw new Error(`Unknown node_type: ${nodeType}`);

  const nidHash = options.nid_hash || generateNidHash(ownerId, nodeType);
  const now = new Date().toISOString();

  // DNA: core identity
  const dna = {
    node_type: nodeType,
    brand_scope: options.brand_scope || 'BOTMANTRA',
    owner_node_id: ownerId,
    parent_node_id: options.parent_node_id || null,
    created_at: now,
    version: options.version || 1
  };

  // Field map: searchable metadata
  const fieldMap = { ...metadata };

  // Perm blob: permissions
  const permBlob = options.permissions || {
    owner: ownerId,
    can_read: true,
    can_write: true,
    can_delete: true,
    visibility: options.visibility || 'private'
  };

  // Rule blob: business rules
  const ruleBlob = options.rules || {
    max_children: 100,
    auto_archive_days: null,
    requires_approval: false
  };

  // UI blob: display config
  const uiBlob = options.ui || {
    theme: 'default',
    layout: null,
    widget_ref: options.ui_reference || null
  };

  // Sys blob: system metadata
  const sysBlob = {
    version: options.version || 1,
    initialized_at: now,
    source: 'neural-os'
  };

  // Runtime blob: ephemeral state
  const runtimeBlob = {
    last_active: now,
    session_count: 0
  };

  // Memory blob: AI context
  const memoryBlob = {
    interactions: 0,
    last_context: null,
    preferences: {}
  };

  const stateHash = crypto.createHash('sha256')
    .update(`${ownerId}:${nidHash}:${now}`)
    .digest('hex');

  return {
    owner_id: ownerId,
    nid_hash: nidHash,
    dna_blob: encodeToBlob(dna),
    field_map: encodeToBlob(fieldMap),
    perm_blob: encodeToBlob(permBlob),
    rule_blob: encodeToBlob(ruleBlob),
    runtime_blob: encodeToBlob(runtimeBlob),
    memory_blob: encodeToBlob(memoryBlob),
    ui_blob: encodeToBlob(uiBlob),
    sys_blob: encodeToBlob(sysBlob),
    state_hash: stateHash,
    parent_nid_hash: options.parent_nid_hash || null,
    node_depth: options.node_depth || 0,
    node_type: typeDef.db_node_type,    // maps to PG enum: 'living' or 'nonliving'
    node_state: options.node_state || 'ACTIVE',
    karma_score: options.karma_score || 0,
    trust_score: options.trust_score || 50,
    reputation_level: 'NEW',
    can_execute: true,
    can_update: true,
    external_access: options.external_access !== false,
    health_score: 100,
    experience_level: 0,
    exposure_mode: options.exposure_mode || 'PRIVATE',
    privacy_mode: options.privacy_mode || 'CORE_ONLY',
    permission_scope: options.permission_scope || 'ALL',
    is_activated: true,
    sync_version: 1,
    node_system_prompt: options.system_prompt || null,
    encryption_key_ref: options.encryption_key_ref || uuid.v4(),
    last_check: now
  };
}

// ─── DEFAULT METADATA BUILDERS ───────────────────────────────
function defaultBrandRootMetadata(brandCode) {
  const brand = BRANDS[brandCode];
  if (!brand) throw new Error(`Unknown brand: ${brandCode}`);
  return {
    brand_code: brandCode,
    brand_name: brand.name,
    default_layout: null,
    theme_id: null,
    role_matrix: {
      owner:       { can_read: true, can_write: true, can_delete: true, can_manage: true },
      admin:       { can_read: true, can_write: true, can_delete: true, can_manage: false },
      member:      { can_read: true, can_write: true, can_delete: false, can_manage: false },
      viewer:      { can_read: true, can_write: false, can_delete: false, can_manage: false },
      guest:       { can_read: true, can_write: false, can_delete: false, can_manage: false }
    },
    feature_flags: {}
  };
}

function defaultUserMetadata(userData) {
  return {
    name: userData.full_name || userData.name || 'User',
    email: userData.email || null,
    age: userData.age || null,
    gender: userData.gender || null,
    profile_type: userData.profile_type || 'personal',
    brand_default: userData.brand_default || null,
    mobile: userData.mobile || null,
    avatar_url: userData.avatar_url || null
  };
}

function defaultDashboardLayoutMetadata(layoutType = 'grid') {
  return {
    layout_type: layoutType,
    widgets: [],
    theme_override: null,
    columns: 12,
    row_height: 80,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 },
    is_default: true
  };
}

function defaultThemeMetadata(brandCode) {
  const themes = {
    VANSHAWALI:  { theme_name: 'Vanshawali Default', primary_color: '#8B4513', secondary_color: '#DEB887', font: 'Georgia' },
    JEETMANTRA:  { theme_name: 'JeetMantra Default', primary_color: '#2563EB', secondary_color: '#3B82F6', font: 'Inter' },
    MANTRAVAT:   { theme_name: 'Mantravat Default',  primary_color: '#059669', secondary_color: '#10B981', font: 'Inter' },
    JUNIOR:      { theme_name: 'Junior Default',     primary_color: '#F59E0B', secondary_color: '#FBBF24', font: 'Nunito' },
    BOTMANTRA:   { theme_name: 'BotMantra Default',  primary_color: '#6366F1', secondary_color: '#8B5CF6', font: 'Inter' }
  };
  return {
    ...(themes[brandCode] || themes.BOTMANTRA),
    dark_mode: false,
    animation_style: 'subtle',
    spacing: 'normal',
    border_radius: 'medium',
    accent_color: '#06b6d4'
  };
}

// ─── EXPORTS ─────────────────────────────────────────────────
module.exports = {
  BRANDS,
  MASTER_NODE_SCHEMA,
  NODE_TYPES: NODE_TYPES_REGISTRY,
  validateNodeData,
  generateNidHash,
  encodeToBlob,
  decodeFromBlob,
  buildNodeCoreRow,
  defaultBrandRootMetadata,
  defaultUserMetadata,
  defaultDashboardLayoutMetadata,
  defaultThemeMetadata
};
