// ─── Node Type Enum ─────────────────────────────────────────────────────────
// 120-type Digital Human Node Library
// Groups: Core System | Identity & Vanshawali | Professional | Company |
//         Finance | Integration | Workflow | UI/Widget | Builder |
//         AI/Agent | Device | Community/Social
export type NodeType =
  // ── 1. Core System (12) ──────────────────────────────────────────────────
  | "system" | "kernel" | "device" | "session"
  | "user" | "preference" | "notification" | "log"
  | "audit" | "permission" | "role" | "profile"
  // ── 2. Identity & Vanshawali (14) ────────────────────────────────────────
  | "identity" | "personal" | "contact" | "location"
  | "social" | "family" | "family_member" | "relationship"
  | "education" | "skill" | "interest" | "media"
  | "timeline" | "trust"
  // ── 3. Professional & Career (10) ────────────────────────────────────────
  | "professional" | "work_experience" | "project" | "certification"
  | "portfolio" | "resume" | "reference" | "achievement"
  | "availability" | "network"
  // ── 4. Company & Organization (14) ───────────────────────────────────────
  | "company" | "company_profile" | "department" | "employee"
  | "team" | "partner" | "customer" | "supplier"
  | "product" | "service" | "inventory" | "order"
  | "invoice" | "contract"
  // ── 5. Finance & Dravyam (12) ────────────────────────────────────────────
  | "wallet" | "bank_account" | "card" | "transaction"
  | "ledger" | "payment_order" | "refund" | "subscription"
  | "pricing" | "tax" | "currency" | "economy"
  // ── 6. Application & Integration (10) ────────────────────────────────────
  | "app" | "integration" | "api" | "webhook"
  | "dataset" | "file" | "document" | "message"
  | "calendar" | "task"
  // ── 7. Workflow & Automation (10) ────────────────────────────────────────
  | "workflow" | "trigger" | "condition" | "action"
  | "schedule" | "queue" | "pipeline" | "automation"
  | "event" | "activity"
  // ── 8. UI & Widget (12) ──────────────────────────────────────────────────
  | "dashboard" | "layout" | "widget"
  | "card_widget" | "table_widget" | "chart_widget"
  | "form_widget" | "feed_widget" | "tree_widget"
  | "timeline_widget" | "chat_widget" | "canvas_widget"
  // ── 9. Builder & Customization (8) ───────────────────────────────────────
  | "builder" | "theme" | "style" | "template"
  | "component" | "script" | "validation" | "localization"
  // ── 10. AI & Agent (8) ───────────────────────────────────────────────────
  | "agent" | "memory" | "prompt" | "tool"
  | "intent" | "suggestion" | "insight" | "assistant"
  // ── 11. Device & Environment (6) ─────────────────────────────────────────
  | "sensor" | "monitor" | "filesystem" | "process"
  | "network" | "backup"
  // ── 12. Community & Social (6) ───────────────────────────────────────────
  | "group" | "post" | "comment" | "reaction"
  | "follow" | "notification_feed"
  // ── Legacy aliases (kept for backward compat) ────────────────────────────
  | "organization" | "bot" | "vector" | "checkpoint"
  | "migration" | "risk" | "dharma" | "gossip"
  | "data" | "plugin" | "profile_seed";

// ─── Enum Types ──────────────────────────────────────────────────────────────
export type PrivacyMode = "public" | "protected" | "private" | "stealth" | "encrypted";

export type PermissionScope = "self" | "children" | "peer" | "global" | "delegated" | "brand" | "none";

export type TaskStatus = "idle" | "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";

export type TxStatus = "draft" | "active" | "suspended" | "archived" | "migrated" | "revoked" | "cold";

export type ReputationLevel = "seed" | "sprout" | "root" | "elder";

// ─── Blob Shapes (runtime-decrypted; stored as AES-256-GCM bytea) ─────────────

/** Identity fingerprint blob */
export interface DnaBlob {
  brand_scope: string;
  archetype: string;
  intent_tags: string[];
  dharma_tags: string[];
  trait_vector: number[];
  origin_type: string;
  soul_id: string;
}

/** Dynamic field schema registry */
export interface FieldMapEntry {
  key: string;
  type: "text" | "number" | "boolean" | "json" | "blob";
  encrypted: boolean;
  searchable: boolean;
  vector_partition: string | null;
}
export interface FieldMapBlob {
  fields: FieldMapEntry[];
  version: string;
}

/** Fine-grained permission grants */
export interface PermGrant {
  subject_nid_hash: string;
  actions: Array<"READ" | "WRITE" | "DELETE" | "SHARE" | "GRANT" | "EXECUTE">;
  effect: "ALLOW" | "DENY";
  conditions: Record<string, unknown>;
  expires_at: string | null;
}
export interface PermBlob {
  grants: PermGrant[];
  default_effect: "ALLOW" | "DENY";
}

/** Business logic / execution rules */
export interface RuleStep {
  trigger: "on_update" | "on_access" | "on_schedule" | "on_event";
  condition: Record<string, unknown>;
  action: Record<string, unknown>;
  priority: number;
}
export interface RuleBlob {
  rules: RuleStep[];
  can_self_modify: boolean;
}

/** Runtime kernel state */
export interface RuntimeBlob {
  active_widgets: string[];
  active_layout_id: string;
  kernel_flags: Record<string, unknown>;
  last_heartbeat: string;
  execution_context: Record<string, unknown>;
  open_sessions: string[];
}

/** Working memory (LRU-evicted) */
export interface MemoryBlobEntry {
  key: string;
  value: unknown;
  ttl_ms: number;
  created_at: string;
}
export interface MemoryBlob {
  short_term: MemoryBlobEntry[];
  context_window: string[];
  intent_stack: Record<string, unknown>[];
}

/** UI layout and widget configuration */
export interface UiBlob {
  theme: string;
  layout_id: string;
  widgets: Record<string, unknown>[];
  dashboard_mode: string;
  custom_css: string;
  locale: string;
}

/** System / kernel internal metadata */
export interface SysBlob {
  kernel_version: string;
  boot_count: number;
  last_boot: string;
  integrity_status: string;
  audit_log_hash: string;
  subsystem_states: Record<string, unknown>;
}

// ─── Legacy Permission Structure (kept for existing node JSON files) ──────────
export interface NodePermissions {
  read: string[];
  write: string[];
  execute: string[];
}

// ─── Node Action ─────────────────────────────────────────────────────────────
export interface NodeAction {
  name: string;
  type: string;
  input?: Record<string, unknown>;
}

// ─── Full Node Record (maps to node_core production table) ───────────────────
export interface NodeRecord {
  // ── Primary Identity ──────────────────────────────────────────────────────
  nid_hash: string;
  owner_id: string;
  node_type: NodeType;

  // ── Encrypted Blobs ───────────────────────────────────────────────────────
  dna_blob?: DnaBlob;
  field_map?: FieldMapBlob;
  perm_blob?: PermBlob;
  rule_blob?: RuleBlob;
  runtime_blob?: RuntimeBlob;
  memory_blob?: MemoryBlob;
  ui_blob?: UiBlob;
  sys_blob?: SysBlob;
  encryption_key_ref?: string;

  // ── Vector ────────────────────────────────────────────────────────────────
  vec_embedding?: number[];

  // ── Versioning ────────────────────────────────────────────────────────────
  state_hash: string;
  version_hash?: string;
  previous_version_hash?: string;
  is_head: boolean;
  sync_version: number;
  last_sync_at?: string;
  prompt_version: number;
  prompt_last_update?: string;

  // ── Tree ──────────────────────────────────────────────────────────────────
  parent_nid_hash?: string;
  node_depth: number;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  status: TxStatus;
  node_state?: string;
  created_at: string;
  updated_at: string;
  valid_until?: string;
  is_archived: boolean;
  archived_at?: string;

  // ── Sleep / Wake ──────────────────────────────────────────────────────────
  is_cold: boolean;
  sleep_after?: string;
  wakeup_at?: string;
  hot_cache: boolean;

  // ── Scores ────────────────────────────────────────────────────────────────
  karma_score: number;
  trust_score: number;
  reputation_level: ReputationLevel;
  health_score: number;
  last_check?: string;
  experience_level: number;

  // ── Capabilities ──────────────────────────────────────────────────────────
  can_execute: boolean;
  can_update: boolean;
  external_access: boolean;
  permission_scope: PermissionScope;

  // ── Privacy ───────────────────────────────────────────────────────────────
  privacy_mode: PrivacyMode;
  exposure_mode?: string;

  // ── Tasks ─────────────────────────────────────────────────────────────────
  task_status: TaskStatus;

  // ── Auth ──────────────────────────────────────────────────────────────────
  pin_hash?: string;
  pin_expiry?: string;
  is_activated: boolean;
  device_fingerprint?: string;
  qr_token_hash?: string;
  qr_expiry?: string;
  recovery_qr_hash?: string;
  recovery_expiry?: string;

  // ── Location ──────────────────────────────────────────────────────────────
  latitude?: number;
  longitude?: number;

  // ── Economy ───────────────────────────────────────────────────────────────
  wallet_id?: string;

  // ── AI Prompt ─────────────────────────────────────────────────────────────
  node_system_prompt?: string;

  // ── Legacy Compat (used by existing .node.json files on disk) ────────────
  /** @deprecated use nid_hash */
  node_id?: string;
  /** @deprecated use owner_id */
  owner?: string;
  /** @deprecated use perm_blob */
  permissions?: NodePermissions;
  ui_schema?: Record<string, unknown>;
  data?: Record<string, unknown>;
  actions?: NodeAction[];
  children?: string[];
  logs?: Array<Record<string, unknown>>;
  /** @deprecated use sync_version */
  version?: number;

  [key: string]: unknown;
}

// ─── Kernel API Types ─────────────────────────────────────────────────────────
export interface KernelExecutionRequest {
  nodeId: string;
  actorId: string;
  /** Device originating the request. Used in audit log. */
  deviceId?: string;
}

export interface KernelExecutionResult {
  nodeId: string;
  success: boolean;
  message: string;
  stateHash: string;
  /** Karma score computed during this execution. */
  karmaScore?: number;
}