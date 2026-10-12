/**
 * Auto-generated Route Index
 * Generated: 2026-02-04T06:50:03.978Z
 */

const express = require('express');
const router = express.Router();

const ai_action_logsRoutes = require('./generated/ai_action_logs.routes');
const ai_action_requestsRoutes = require('./generated/ai_action_requests.routes');
const ai_action_whitelistRoutes = require('./generated/ai_action_whitelist.routes');
const ai_agent_rulesRoutes = require('./generated/ai_agent_rules.routes');
const ai_agent_templatesRoutes = require('./generated/ai_agent_templates.routes');
const ai_app_requestsRoutes = require('./generated/ai_app_requests.routes');
const ai_chat_messagesRoutes = require('./generated/ai_chat_messages.routes');
const ai_chat_sessionsRoutes = require('./generated/ai_chat_sessions.routes');
const ai_dashboard_requestsRoutes = require('./generated/ai_dashboard_requests.routes');
const ai_generated_templatesRoutes = require('./generated/ai_generated_templates.routes');
const ai_knowledge_baseRoutes = require('./generated/ai_knowledge_base.routes');
const ai_model_routerRoutes = require('./generated/ai_model_router.routes');
const ai_pluginsRoutes = require('./generated/ai_plugins.routes');
const ai_semantic_cacheRoutes = require('./generated/ai_semantic_cache.routes');
const ai_session_memoryRoutes = require('./generated/ai_session_memory.routes');
const ai_summary_cacheRoutes = require('./generated/ai_summary_cache.routes');
const ai_voice_logsRoutes = require('./generated/ai_voice_logs.routes');
const business_automation_profilesRoutes = require('./generated/business_automation_profiles.routes');
const business_brandingRoutes = require('./generated/business_branding.routes');
const business_data_sourcesRoutes = require('./generated/business_data_sources.routes');
const business_documentsRoutes = require('./generated/business_documents.routes');
const business_domainsRoutes = require('./generated/business_domains.routes');
const business_functionsRoutes = require('./generated/business_functions.routes');
const business_labelsRoutes = require('./generated/business_labels.routes');
const business_metadataRoutes = require('./generated/business_metadata.routes');
const business_modulesRoutes = require('./generated/business_modules.routes');
const business_pluginsRoutes = require('./generated/business_plugins.routes');
const business_subscriptionsRoutes = require('./generated/business_subscriptions.routes');
const business_templatesRoutes = require('./generated/business_templates.routes');
const business_usersRoutes = require('./generated/business_users.routes');
const clientsRoutes = require('./generated/clients.routes');
const invoicesRoutes = require('./generated/invoices.routes');
const paymentsRoutes = require('./generated/payments.routes');
const projectsRoutes = require('./generated/projects.routes');

// Mount routes
router.use('/', ai_action_logsRoutes);
router.use('/', ai_action_requestsRoutes);
router.use('/', ai_action_whitelistRoutes);
router.use('/', ai_agent_rulesRoutes);
router.use('/', ai_agent_templatesRoutes);
router.use('/', ai_app_requestsRoutes);
router.use('/', ai_chat_messagesRoutes);
router.use('/', ai_chat_sessionsRoutes);
router.use('/', ai_dashboard_requestsRoutes);
router.use('/', ai_generated_templatesRoutes);
router.use('/', ai_knowledge_baseRoutes);
router.use('/', ai_model_routerRoutes);
router.use('/', ai_pluginsRoutes);
router.use('/', ai_semantic_cacheRoutes);
router.use('/', ai_session_memoryRoutes);
router.use('/', ai_summary_cacheRoutes);
router.use('/', ai_voice_logsRoutes);
router.use('/', business_automation_profilesRoutes);
router.use('/', business_brandingRoutes);
router.use('/', business_data_sourcesRoutes);
router.use('/', business_documentsRoutes);
router.use('/', business_domainsRoutes);
router.use('/', business_functionsRoutes);
router.use('/', business_labelsRoutes);
router.use('/', business_metadataRoutes);
router.use('/', business_modulesRoutes);
router.use('/', business_pluginsRoutes);
router.use('/', business_subscriptionsRoutes);
router.use('/', business_templatesRoutes);
router.use('/', business_usersRoutes);
router.use('/', clientsRoutes);
router.use('/', invoicesRoutes);
router.use('/', paymentsRoutes);
router.use('/', projectsRoutes);

module.exports = router;
