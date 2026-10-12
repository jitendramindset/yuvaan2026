-- ═══════════════════════════════════════════════════════════════
-- BotMantra Two-API System - Database Schema
-- ═══════════════════════════════════════════════════════════════
-- Created: 2026-01-29
-- Purpose: Support for BotMantra AI Framework & NodeCore Chat APIs
-- ═══════════════════════════════════════════════════════════════

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- ───────────────────────────────────────────────────────────────
-- Table: api_logs
-- Purpose: Log all API requests and responses
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(50) DEFAULT 'success',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp DESC);

-- ───────────────────────────────────────────────────────────────
-- Table: user_roles
-- Purpose: Assign roles to users for permission management
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- ───────────────────────────────────────────────────────────────
-- Table: vector_documents
-- Purpose: Store documents for RAG system
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vector_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    document_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vector_documents_user_id ON vector_documents(user_id);
CREATE INDEX idx_vector_documents_name ON vector_documents(document_name);

-- ───────────────────────────────────────────────────────────────
-- Table: vector_chunks
-- Purpose: Store text chunks with embeddings for RAG retrieval
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vector_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES vector_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vector_chunks_document_id ON vector_chunks(document_id);
-- Vector similarity search index (requires pgvector extension)
-- CREATE INDEX idx_vector_chunks_embedding ON vector_chunks 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ───────────────────────────────────────────────────────────────
-- Table: ui_templates (Enhanced)
-- Purpose: Store AI-generated UI frameworks
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ui_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    layout JSONB NOT NULL,
    business_type VARCHAR(50),
    theme JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

CREATE INDEX idx_ui_templates_code ON ui_templates(template_code);
CREATE INDEX idx_ui_templates_business_type ON ui_templates(business_type);
CREATE INDEX idx_ui_templates_public ON ui_templates(is_public);

-- ───────────────────────────────────────────────────────────────
-- Function: Auto-update updated_at timestamp
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_vector_documents_updated_at
    BEFORE UPDATE ON vector_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ui_templates_updated_at
    BEFORE UPDATE ON ui_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────
-- Sample Data for Testing
-- ───────────────────────────────────────────────────────────────

-- Sample UI Template
INSERT INTO ui_templates (id, template_code, template_name, layout, business_type, theme, is_public, created_at)
VALUES (
    gen_random_uuid(),
    'sample_ecommerce_ui',
    'E-commerce Product Form',
    '{
        "fields": [
            {"name": "product_name", "type": "text", "widget": "input", "required": true},
            {"name": "price", "type": "number", "widget": "input", "required": true},
            {"name": "description", "type": "text", "widget": "editor", "required": false},
            {"name": "category", "type": "select", "widget": "dropdown", "required": true}
        ],
        "layout": {"type": "grid", "columns": 2},
        "theme": {"primary": "#4F46E5", "accent": "#10B981"}
    }'::JSONB,
    'ecommerce',
    '{"primary": "#4F46E5", "accent": "#10B981", "style": "modern"}'::JSONB,
    TRUE,
    NOW()
) ON CONFLICT (template_code) DO NOTHING;

-- Sample Vector Document for RAG
INSERT INTO vector_documents (id, user_id, document_name, content, created_at)
VALUES (
    gen_random_uuid(),
    NULL,
    'BotMantra AI Framework Guide',
    'The BotMantra AI Framework allows you to convert any data into beautiful UI components. Simply provide your data as JSON or specify a table name, and the AI will intelligently map fields and suggest the best layout for your use case. You can preview, adjust, and save your UI without requiring login.',
    NOW()
) ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────
-- Views for Easy Querying
-- ───────────────────────────────────────────────────────────────

-- View: User Permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    r.role_code,
    r.role_name,
    p.permission_code,
    p.permission_name,
    p.resource_type,
    p.action
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id;

-- View: API Usage Statistics
CREATE OR REPLACE VIEW api_usage_stats AS
SELECT 
    endpoint,
    COUNT(*) as total_requests,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_rate,
    DATE_TRUNC('day', timestamp) as date
FROM api_logs
GROUP BY endpoint, DATE_TRUNC('day', timestamp)
ORDER BY date DESC, total_requests DESC;

-- ───────────────────────────────────────────────────────────────
-- Grants (Adjust based on your security model)
-- ───────────────────────────────────────────────────────────────
-- GRANT SELECT, INSERT, UPDATE ON api_logs TO authenticated;
-- GRANT SELECT ON user_permissions_view TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON ui_templates TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Schema Creation Complete
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE api_logs IS 'Logs all API requests for monitoring and debugging';
COMMENT ON TABLE user_roles IS 'Maps users to their assigned roles';
COMMENT ON TABLE vector_documents IS 'Stores documents for RAG-based AI responses';
COMMENT ON TABLE vector_chunks IS 'Text chunks with embeddings for semantic search';
COMMENT ON TABLE ui_templates IS 'AI-generated UI frameworks and templates';
