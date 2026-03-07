-- ════════════════════════════════════════════════════════════
-- YUVAAN NodeOS — node_core TABLE
-- Migration: 0001_create_node_core.sql
-- ════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector

DO $$
BEGIN
  -- ENUMS
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'node_type_enum') THEN
    CREATE TYPE node_type_enum AS ENUM (
      'system', 'profile', 'dashboard', 'widget', 'data',
      'workflow', 'agent', 'device', 'wallet', 'transaction',
      'economy', 'plugin'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_status_enum') THEN
    CREATE TYPE tx_status_enum AS ENUM ('active', 'pending', 'locked', 'archived', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_scope_enum') THEN
    CREATE TYPE permission_scope_enum AS ENUM ('self', 'family', 'network', 'public');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_mode_enum') THEN
    CREATE TYPE privacy_mode_enum AS ENUM ('private', 'protected', 'public');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
    CREATE TYPE task_status_enum AS ENUM ('idle', 'running', 'paused', 'done', 'error');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS node_core (

  -- ── Primary Identity ──────────────────────────────────────
  row_id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id            UUID            NOT NULL,
  nid_hash            TEXT            NOT NULL UNIQUE,
  node_type           node_type_enum  NOT NULL,

  -- ── Encrypted Binary Blobs ────────────────────────────────
  dna_blob            BYTEA,
  field_map           BYTEA,
  perm_blob           BYTEA,
  rule_blob           BYTEA,
  runtime_blob        BYTEA,
  memory_blob         BYTEA,
  ui_blob             BYTEA,
  sys_blob            BYTEA,
  encryption_key_ref  UUID,

  -- ── Vector Embedding ──────────────────────────────────────
  vec_embedding       VECTOR(384),

  -- ── Versioning & Immutability ─────────────────────────────
  state_hash          TEXT,
  version_hash        TEXT,
  previous_version_hash TEXT,
  is_head             BOOLEAN         NOT NULL DEFAULT TRUE,
  sync_version        INTEGER         NOT NULL DEFAULT 0,
  last_sync_at        TIMESTAMP,
  prompt_version      INTEGER         NOT NULL DEFAULT 1,
  prompt_last_update  TIMESTAMP,

  -- ── Tree Structure ────────────────────────────────────────
  parent_nid_hash     TEXT            REFERENCES node_core(nid_hash) ON DELETE SET NULL,
  node_depth          INTEGER         NOT NULL DEFAULT 0,

  -- ── Lifecycle ─────────────────────────────────────────────
  status              tx_status_enum  NOT NULL DEFAULT 'active',
  node_state          TEXT,
  created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
  valid_until         TIMESTAMP,
  is_archived         BOOLEAN         NOT NULL DEFAULT FALSE,
  archived_at         TIMESTAMP,

  -- ── Sleep / Wake Cycle ────────────────────────────────────
  is_cold             BOOLEAN         NOT NULL DEFAULT FALSE,
  sleep_after         TIMESTAMP,
  wakeup_at           TIMESTAMP,
  hot_cache           BOOLEAN         NOT NULL DEFAULT FALSE,

  -- ── Scores & Reputation ───────────────────────────────────
  karma_score         INTEGER         NOT NULL DEFAULT 0,
  trust_score         INTEGER         NOT NULL DEFAULT 50,
  reputation_level    TEXT            NOT NULL DEFAULT 'seed',
  health_score        INTEGER         NOT NULL DEFAULT 100,
  last_check          TIMESTAMP,
  experience_level    INTEGER         NOT NULL DEFAULT 0,

  -- ── Capabilities ──────────────────────────────────────────
  can_execute         BOOLEAN         NOT NULL DEFAULT FALSE,
  can_update          BOOLEAN         NOT NULL DEFAULT TRUE,
  external_access     BOOLEAN         NOT NULL DEFAULT FALSE,
  permission_scope    permission_scope_enum NOT NULL DEFAULT 'self',

  -- ── Privacy & Exposure ────────────────────────────────────
  privacy_mode        privacy_mode_enum NOT NULL DEFAULT 'protected',
  exposure_mode       TEXT,

  -- ── Task State ────────────────────────────────────────────
  task_status         task_status_enum NOT NULL DEFAULT 'idle',

  -- ── Auth / PIN / QR ───────────────────────────────────────
  pin_hash            TEXT,
  pin_expiry          TIMESTAMP,
  is_activated        BOOLEAN         NOT NULL DEFAULT FALSE,
  device_fingerprint  TEXT,
  qr_token_hash       TEXT,
  qr_expiry           TIMESTAMP,
  recovery_qr_hash    TEXT,
  recovery_expiry     TIMESTAMP,

  -- ── Location ──────────────────────────────────────────────
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,

  -- ── Economy ───────────────────────────────────────────────
  wallet_id           UUID,

  -- ── AI / Kernel Prompt ────────────────────────────────────
  node_system_prompt  TEXT

);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nc_owner    ON node_core(owner_id);
CREATE INDEX IF NOT EXISTS idx_nc_parent   ON node_core(parent_nid_hash);
CREATE INDEX IF NOT EXISTS idx_nc_type     ON node_core(node_type);
CREATE INDEX IF NOT EXISTS idx_nc_status   ON node_core(status);
CREATE INDEX IF NOT EXISTS idx_nc_sync     ON node_core(sync_version);
CREATE INDEX IF NOT EXISTS idx_nc_is_head  ON node_core(is_head);
CREATE INDEX IF NOT EXISTS idx_nc_is_cold  ON node_core(is_cold);
CREATE INDEX IF NOT EXISTS idx_nc_hot      ON node_core(hot_cache);
CREATE INDEX IF NOT EXISTS idx_nc_task     ON node_core(task_status);
CREATE INDEX IF NOT EXISTS idx_nc_location ON node_core(latitude, longitude)
    WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nc_privacy  ON node_core(privacy_mode);
CREATE INDEX IF NOT EXISTS idx_nc_karma    ON node_core(karma_score DESC);
CREATE INDEX IF NOT EXISTS idx_nc_trust    ON node_core(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_nc_health   ON node_core(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_nc_wallet   ON node_core(wallet_id);
CREATE INDEX IF NOT EXISTS idx_nc_valid    ON node_core(valid_until)
    WHERE valid_until IS NOT NULL;

-- pgvector IVFFlat index
CREATE INDEX IF NOT EXISTS idx_nc_vec ON node_core
  USING ivfflat (vec_embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Auto-update trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION _fn_update_nc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nc_updated_at ON node_core;
CREATE TRIGGER trg_nc_updated_at
  BEFORE UPDATE ON node_core
  FOR EACH ROW EXECUTE FUNCTION _fn_update_nc_timestamp();

-- ── Auto-depth trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION _fn_set_node_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_nid_hash IS NULL THEN
    NEW.node_depth = 0;
  ELSE
    SELECT node_depth + 1 INTO NEW.node_depth
    FROM node_core WHERE nid_hash = NEW.parent_nid_hash;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nc_depth ON node_core;
CREATE TRIGGER trg_nc_depth
  BEFORE INSERT ON node_core
  FOR EACH ROW EXECUTE FUNCTION _fn_set_node_depth();
