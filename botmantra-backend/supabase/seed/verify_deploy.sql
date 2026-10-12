-- Verification queries after DEPLOY_ALL

-- 1) Core tables
SELECT 'users' AS table_name, COUNT(*) AS rows FROM users;
SELECT 'roles' AS table_name, COUNT(*) AS rows FROM roles;
SELECT 'permissions' AS table_name, COUNT(*) AS rows FROM permissions;
SELECT 'role_permissions' AS table_name, COUNT(*) AS rows FROM role_permissions;
SELECT 'core_node' AS table_name, COUNT(*) AS rows FROM core_node;
SELECT 'node_role' AS table_name, COUNT(*) AS rows FROM node_role;
SELECT 'node_permission' AS table_name, COUNT(*) AS rows FROM node_permission;
SELECT 'ui_template' AS table_name, COUNT(*) AS rows FROM ui_template;

-- 2) Economy system
SELECT 'wallets' AS table_name, COUNT(*) AS rows FROM wallets;
SELECT 'transactions' AS table_name, COUNT(*) AS rows FROM transactions;
SELECT 'revenue_share_pool' AS table_name, COUNT(*) AS rows FROM revenue_share_pool;
SELECT 'revenue_share_recipients' AS table_name, COUNT(*) AS rows FROM revenue_share_recipients;
SELECT 'wallet_balance_history' AS table_name, COUNT(*) AS rows FROM wallet_balance_history;

-- 3) Contribution graph
SELECT 'contribution_graph' AS table_name, COUNT(*) AS rows FROM contribution_graph;
SELECT 'revenue_distribution_log' AS table_name, COUNT(*) AS rows FROM revenue_distribution_log;
SELECT 'node_earnings_summary' AS table_name, COUNT(*) AS rows FROM node_earnings_summary;
SELECT 'contribution_weights_template' AS table_name, COUNT(*) AS rows FROM contribution_weights_template;

-- 4) RAG/vector
SELECT 'vector_documents' AS table_name, COUNT(*) AS rows FROM vector_documents;
SELECT 'vector_chunks' AS table_name, COUNT(*) AS rows FROM vector_chunks;
