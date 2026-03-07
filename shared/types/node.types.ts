// ─── Node Type Enum ─────────────────────────────────────────────────────────
export type NodeType =
  // Core identity
  | "user" | "device" | "organization" | "bot"
  // Content
  | "post" | "comment" | "media" | "document"
  // Graph & trust
  | "relation" | "permission" | "trust" | "gossip"
  // System
  | "event" | "vector" | "checkpoint" | "migration"
  // UI
  | "widget" | "layout"
  // Governance
  | "risk" | "dharma"
  // Economy & tasks
  | "wallet" | "task"
  // Legacy (kept for backward compat with existing node JSON files)
  | "system" | "profile" | "dashboard" | "data" | "workflow" | "agent"
  | "transaction" | "economy" | "plugin";

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