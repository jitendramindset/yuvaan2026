-- Migration: Add missing indexes based on Supabase index list
-- Date: 2026-02-06
-- Execution note: Success. No rows returned

-- Enable pgvector for embedding indexes (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ai_knowledge_base
CREATE INDEX IF NOT EXISTS ai_knowledge_base_doc_id_idx ON public.ai_knowledge_base (doc_id);
CREATE INDEX IF NOT EXISTS ai_knowledge_base_heading_idx ON public.ai_knowledge_base (heading);
CREATE INDEX IF NOT EXISTS ai_knowledge_base_sub_heading_idx ON public.ai_knowledge_base (sub_heading);
CREATE INDEX IF NOT EXISTS ai_knowledge_embedding_idx ON public.ai_knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- ai_websites
CREATE INDEX IF NOT EXISTS idx_ai_websites_created ON public.ai_websites (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_websites_published ON public.ai_websites (is_published);
CREATE INDEX IF NOT EXISTS idx_ai_websites_type ON public.ai_websites (website_type);
CREATE INDEX IF NOT EXISTS idx_ai_websites_user ON public.ai_websites (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_websites_user_created ON public.ai_websites (user_id, created_at);

-- auth_identity
CREATE INDEX IF NOT EXISTS idx_auth_phone_hash ON public.auth_identity (phone_hash);

-- business_functions
CREATE INDEX IF NOT EXISTS idx_business_functions_lookup ON public.business_functions (function_code, business_id, is_system);

-- data_model_registry
CREATE INDEX IF NOT EXISTS idx_data_model_business ON public.data_model_registry (business_id, table_name);
CREATE INDEX IF NOT EXISTS idx_registry_business ON public.data_model_registry (business_id);
CREATE INDEX IF NOT EXISTS idx_registry_table_lookup ON public.data_model_registry (table_name, module, is_active);
CREATE INDEX IF NOT EXISTS idx_registry_template ON public.data_model_registry (template_code);

-- ingestion_jobs
CREATE INDEX IF NOT EXISTS idx_ingest_owner ON public.ingestion_jobs (owner_id);

-- node_key_vault
CREATE INDEX IF NOT EXISTS idx_keyvault_nid ON public.node_key_vault (nid_hash);

-- node_devices
CREATE INDEX IF NOT EXISTS idx_node_devices_trust ON public.node_devices (nid_hash, trust_score);

-- node_core
CREATE INDEX IF NOT EXISTS idx_node_parent ON public.node_core (parent_nid_hash);
-- NOTE: idx_node_geo is an expression index; definition not provided in the index list.

-- node_permission
CREATE INDEX IF NOT EXISTS idx_perm_node ON public.node_permission (nid_hash);
CREATE INDEX IF NOT EXISTS idx_perm_target ON public.node_permission (target_owner_id);

-- ai_semantic_cache
CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding ON public.ai_semantic_cache USING ivfflat (query_embedding vector_cosine_ops);

-- ai_session_memory
CREATE INDEX IF NOT EXISTS idx_session_user ON public.ai_session_memory (user_id);

-- ai_summary_cache
CREATE INDEX IF NOT EXISTS idx_summary_updated ON public.ai_summary_cache (updated_at);

-- ui_function_templates
CREATE INDEX IF NOT EXISTS idx_ui_templates_lookup ON public.ui_function_templates (function_code, business_id, is_system);

-- vector_chunks
CREATE INDEX IF NOT EXISTS vector_chunks_embedding_idx ON public.vector_chunks USING ivfflat (embedding vector_cosine_ops);
