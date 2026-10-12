# Supabase API Examples (All Tables & Procedures)

Generated: February 4, 2026

This file provides **standard Supabase JS examples** for each table and stored procedure you listed.
Use your real columns/filters where needed.

---

## Tables

### admin_actions_log
**Select**
```
let { data, error } = await supabase.from('admin_actions_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('admin_actions_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('admin_actions_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('admin_actions_log').delete().eq('id', 'uuid')
```

### admin_node_runtime_prompt
**Select**
```
let { data, error } = await supabase.from('admin_node_runtime_prompt').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('admin_node_runtime_prompt').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('admin_node_runtime_prompt').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('admin_node_runtime_prompt').delete().eq('id', 'uuid')
```

### admin_permissions
**Select**
```
let { data, error } = await supabase.from('admin_permissions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('admin_permissions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('admin_permissions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('admin_permissions').delete().eq('id', 'uuid')
```

### admin_session
**Select**
```
let { data, error } = await supabase.from('admin_session').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('admin_session').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('admin_session').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('admin_session').delete().eq('id', 'uuid')
```

### admin_test_controls
**Select**
```
let { data, error } = await supabase.from('admin_test_controls').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('admin_test_controls').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('admin_test_controls').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('admin_test_controls').delete().eq('id', 'uuid')
```

### ai_action_logs
**Select**
```
let { data, error } = await supabase.from('ai_action_logs').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_action_logs').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_action_logs').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_action_logs').delete().eq('id', 'uuid')
```

### ai_action_requests
**Select**
```
let { data, error } = await supabase.from('ai_action_requests').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_action_requests').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_action_requests').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_action_requests').delete().eq('id', 'uuid')
```

### ai_action_whitelist
**Select**
```
let { data, error } = await supabase.from('ai_action_whitelist').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_action_whitelist').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_action_whitelist').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_action_whitelist').delete().eq('id', 'uuid')
```

### ai_agent_rules
**Select**
```
let { data, error } = await supabase.from('ai_agent_rules').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_agent_rules').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_agent_rules').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_agent_rules').delete().eq('id', 'uuid')
```

### ai_agent_templates
**Select**
```
let { data, error } = await supabase.from('ai_agent_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_agent_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_agent_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_agent_templates').delete().eq('id', 'uuid')
```

### ai_app_requests
**Select**
```
let { data, error } = await supabase.from('ai_app_requests').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_app_requests').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_app_requests').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_app_requests').delete().eq('id', 'uuid')
```

### ai_chat_messages
**Select**
```
let { data, error } = await supabase.from('ai_chat_messages').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_chat_messages').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_chat_messages').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_chat_messages').delete().eq('id', 'uuid')
```

### ai_chat_sessions
**Select**
```
let { data, error } = await supabase.from('ai_chat_sessions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_chat_sessions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_chat_sessions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_chat_sessions').delete().eq('id', 'uuid')
```

### ai_dashboard_requests
**Select**
```
let { data, error } = await supabase.from('ai_dashboard_requests').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_dashboard_requests').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_dashboard_requests').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_dashboard_requests').delete().eq('id', 'uuid')
```

### ai_generated_templates
**Select**
```
let { data, error } = await supabase.from('ai_generated_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_generated_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_generated_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_generated_templates').delete().eq('id', 'uuid')
```

### ai_knowledge_base
**Select**
```
let { data, error } = await supabase.from('ai_knowledge_base').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_knowledge_base').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_knowledge_base').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_knowledge_base').delete().eq('id', 'uuid')
```

### ai_model_router
**Select**
```
let { data, error } = await supabase.from('ai_model_router').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_model_router').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_model_router').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_model_router').delete().eq('id', 'uuid')
```

### ai_plugins
**Select**
```
let { data, error } = await supabase.from('ai_plugins').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_plugins').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_plugins').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_plugins').delete().eq('id', 'uuid')
```

### ai_semantic_cache
**Select**
```
let { data, error } = await supabase.from('ai_semantic_cache').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_semantic_cache').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_semantic_cache').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_semantic_cache').delete().eq('id', 'uuid')
```

### ai_session_memory
**Select**
```
let { data, error } = await supabase.from('ai_session_memory').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_session_memory').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_session_memory').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_session_memory').delete().eq('id', 'uuid')
```

### ai_summary_cache
**Select**
```
let { data, error } = await supabase.from('ai_summary_cache').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_summary_cache').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_summary_cache').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_summary_cache').delete().eq('id', 'uuid')
```

### ai_voice_logs
**Select**
```
let { data, error } = await supabase.from('ai_voice_logs').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ai_voice_logs').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ai_voice_logs').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ai_voice_logs').delete().eq('id', 'uuid')
```

### api_keys
**Select**
```
let { data, error } = await supabase.from('api_keys').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('api_keys').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('api_keys').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('api_keys').delete().eq('id', 'uuid')
```

### api_rate_limit
**Select**
```
let { data, error } = await supabase.from('api_rate_limit').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('api_rate_limit').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('api_rate_limit').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('api_rate_limit').delete().eq('id', 'uuid')
```

### api_routes
**Select**
```
let { data, error } = await supabase.from('api_routes').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('api_routes').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('api_routes').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('api_routes').delete().eq('id', 'uuid')
```

### auth_identity
**Select**
```
let { data, error } = await supabase.from('auth_identity').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('auth_identity').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('auth_identity').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('auth_identity').delete().eq('id', 'uuid')
```

### business_automation_profiles
**Select**
```
let { data, error } = await supabase.from('business_automation_profiles').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_automation_profiles').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_automation_profiles').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_automation_profiles').delete().eq('id', 'uuid')
```

### business_branding
**Select**
```
let { data, error } = await supabase.from('business_branding').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_branding').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_branding').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_branding').delete().eq('id', 'uuid')
```

### business_data_sources
**Select**
```
let { data, error } = await supabase.from('business_data_sources').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_data_sources').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_data_sources').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_data_sources').delete().eq('id', 'uuid')
```

### business_documents
**Select**
```
let { data, error } = await supabase.from('business_documents').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_documents').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_documents').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_documents').delete().eq('id', 'uuid')
```

### business_domains
**Select**
```
let { data, error } = await supabase.from('business_domains').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_domains').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_domains').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_domains').delete().eq('id', 'uuid')
```

### business_functions
**Select**
```
let { data, error } = await supabase.from('business_functions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_functions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_functions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_functions').delete().eq('id', 'uuid')
```

### business_labels
**Select**
```
let { data, error } = await supabase.from('business_labels').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_labels').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_labels').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_labels').delete().eq('id', 'uuid')
```

### business_metadata
**Select**
```
let { data, error } = await supabase.from('business_metadata').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_metadata').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_metadata').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_metadata').delete().eq('id', 'uuid')
```

### business_modules
**Select**
```
let { data, error } = await supabase.from('business_modules').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_modules').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_modules').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_modules').delete().eq('id', 'uuid')
```

### business_plugins
**Select**
```
let { data, error } = await supabase.from('business_plugins').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_plugins').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_plugins').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_plugins').delete().eq('id', 'uuid')
```

### business_subscriptions
**Select**
```
let { data, error } = await supabase.from('business_subscriptions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_subscriptions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_subscriptions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_subscriptions').delete().eq('id', 'uuid')
```

### business_templates
**Select**
```
let { data, error } = await supabase.from('business_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_templates').delete().eq('id', 'uuid')
```

### business_users
**Select**
```
let { data, error } = await supabase.from('business_users').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('business_users').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('business_users').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('business_users').delete().eq('id', 'uuid')
```

### businesses
**Select**
```
let { data, error } = await supabase.from('businesses').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('businesses').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('businesses').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('businesses').delete().eq('id', 'uuid')
```

### chat_history
**Select**
```
let { data, error } = await supabase.from('chat_history').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('chat_history').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('chat_history').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('chat_history').delete().eq('id', 'uuid')
```

### clients
**Select**
```
let { data, error } = await supabase.from('clients').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('clients').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('clients').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('clients').delete().eq('id', 'uuid')
```

### column_role_permissions
**Select**
```
let { data, error } = await supabase.from('column_role_permissions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('column_role_permissions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('column_role_permissions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('column_role_permissions').delete().eq('id', 'uuid')
```

### dashboard_kpis
**Select**
```
let { data, error } = await supabase.from('dashboard_kpis').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('dashboard_kpis').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('dashboard_kpis').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('dashboard_kpis').delete().eq('id', 'uuid')
```

### dashboard_layouts
**Select**
```
let { data, error } = await supabase.from('dashboard_layouts').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('dashboard_layouts').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('dashboard_layouts').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('dashboard_layouts').delete().eq('id', 'uuid')
```

### dashboard_widgets
**Select**
```
let { data, error } = await supabase.from('dashboard_widgets').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('dashboard_widgets').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('dashboard_widgets').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('dashboard_widgets').delete().eq('id', 'uuid')
```

### data_model_registry
**Select**
```
let { data, error } = await supabase.from('data_model_registry').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('data_model_registry').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('data_model_registry').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('data_model_registry').delete().eq('id', 'uuid')
```

### data_model_relations
**Select**
```
let { data, error } = await supabase.from('data_model_relations').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('data_model_relations').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('data_model_relations').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('data_model_relations').delete().eq('id', 'uuid')
```

### device_registry
**Select**
```
let { data, error } = await supabase.from('device_registry').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('device_registry').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('device_registry').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('device_registry').delete().eq('id', 'uuid')
```

### device_sessions
**Select**
```
let { data, error } = await supabase.from('device_sessions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('device_sessions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('device_sessions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('device_sessions').delete().eq('id', 'uuid')
```

### dharma_rules
**Select**
```
let { data, error } = await supabase.from('dharma_rules').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('dharma_rules').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('dharma_rules').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('dharma_rules').delete().eq('id', 'uuid')
```

### domain_resolver
**Select**
```
let { data, error } = await supabase.from('domain_resolver').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('domain_resolver').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('domain_resolver').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('domain_resolver').delete().eq('id', 'uuid')
```

### enterprise_org
**Select**
```
let { data, error } = await supabase.from('enterprise_org').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('enterprise_org').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('enterprise_org').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('enterprise_org').delete().eq('id', 'uuid')
```

### function_templates
**Select**
```
let { data, error } = await supabase.from('function_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('function_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('function_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('function_templates').delete().eq('id', 'uuid')
```

### geography_columns
**Select**
```
let { data, error } = await supabase.from('geography_columns').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('geography_columns').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('geography_columns').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('geography_columns').delete().eq('id', 'uuid')
```

### geometry_columns
**Select**
```
let { data, error } = await supabase.from('geometry_columns').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('geometry_columns').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('geometry_columns').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('geometry_columns').delete().eq('id', 'uuid')
```

### ingestion_jobs
**Select**
```
let { data, error } = await supabase.from('ingestion_jobs').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ingestion_jobs').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ingestion_jobs').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ingestion_jobs').delete().eq('id', 'uuid')
```

### ingestion_raw_data
**Select**
```
let { data, error } = await supabase.from('ingestion_raw_data').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ingestion_raw_data').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ingestion_raw_data').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ingestion_raw_data').delete().eq('id', 'uuid')
```

### invoices
**Select**
```
let { data, error } = await supabase.from('invoices').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('invoices').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('invoices').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('invoices').delete().eq('id', 'uuid')
```

### marketplace_installs
**Select**
```
let { data, error } = await supabase.from('marketplace_installs').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('marketplace_installs').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('marketplace_installs').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('marketplace_installs').delete().eq('id', 'uuid')
```

### marketplace_public
**Select**
```
let { data, error } = await supabase.from('marketplace_public').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('marketplace_public').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('marketplace_public').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('marketplace_public').delete().eq('id', 'uuid')
```

### marketplace_templates
**Select**
```
let { data, error } = await supabase.from('marketplace_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('marketplace_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('marketplace_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('marketplace_templates').delete().eq('id', 'uuid')
```

### n8n_chat_histories
**Select**
```
let { data, error } = await supabase.from('n8n_chat_histories').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('n8n_chat_histories').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('n8n_chat_histories').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('n8n_chat_histories').delete().eq('id', 'uuid')
```

### node_ai_brain
**Select**
```
let { data, error } = await supabase.from('node_ai_brain').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_ai_brain').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_ai_brain').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_ai_brain').delete().eq('id', 'uuid')
```

### node_ai_cache
**Select**
```
let { data, error } = await supabase.from('node_ai_cache').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_ai_cache').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_ai_cache').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_ai_cache').delete().eq('id', 'uuid')
```

### node_ai_input
**Select**
```
let { data, error } = await supabase.from('node_ai_input').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_ai_input').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_ai_input').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_ai_input').delete().eq('id', 'uuid')
```

### node_ai_key_vault
**Select**
```
let { data, error } = await supabase.from('node_ai_key_vault').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_ai_key_vault').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_ai_key_vault').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_ai_key_vault').delete().eq('id', 'uuid')
```

### node_ai_task_queue
**Select**
```
let { data, error } = await supabase.from('node_ai_task_queue').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_ai_task_queue').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_ai_task_queue').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_ai_task_queue').delete().eq('id', 'uuid')
```

### node_api_keys
**Select**
```
let { data, error } = await supabase.from('node_api_keys').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_api_keys').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_api_keys').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_api_keys').delete().eq('id', 'uuid')
```

### node_audit_log
**Select**
```
let { data, error } = await supabase.from('node_audit_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_audit_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_audit_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_audit_log').delete().eq('id', 'uuid')
```

### node_billing_rules
**Select**
```
let { data, error } = await supabase.from('node_billing_rules').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_billing_rules').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_billing_rules').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_billing_rules').delete().eq('id', 'uuid')
```

### node_category_master
**Select**
```
let { data, error } = await supabase.from('node_category_master').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_category_master').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_category_master').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_category_master').delete().eq('id', 'uuid')
```

### node_core
**Select**
```
let { data, error } = await supabase.from('node_core').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_core').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_core').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_core').delete().eq('id', 'uuid')
```

### node_devices
**Select**
```
let { data, error } = await supabase.from('node_devices').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_devices').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_devices').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_devices').delete().eq('id', 'uuid')
```

### node_dharma_log
**Select**
```
let { data, error } = await supabase.from('node_dharma_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_dharma_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_dharma_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_dharma_log').delete().eq('id', 'uuid')
```

### node_dharma_profile
**Select**
```
let { data, error } = await supabase.from('node_dharma_profile').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_dharma_profile').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_dharma_profile').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_dharma_profile').delete().eq('id', 'uuid')
```

### node_event_queue
**Select**
```
let { data, error } = await supabase.from('node_event_queue').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_event_queue').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_event_queue').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_event_queue').delete().eq('id', 'uuid')
```

### node_execution_log
**Select**
```
let { data, error } = await supabase.from('node_execution_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_execution_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_execution_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_execution_log').delete().eq('id', 'uuid')
```

### node_external_actions
**Select**
```
let { data, error } = await supabase.from('node_external_actions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_external_actions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_external_actions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_external_actions').delete().eq('id', 'uuid')
```

### node_failure_log
**Select**
```
let { data, error } = await supabase.from('node_failure_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_failure_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_failure_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_failure_log').delete().eq('id', 'uuid')
```

### node_federation
**Select**
```
let { data, error } = await supabase.from('node_federation').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_federation').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_federation').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_federation').delete().eq('id', 'uuid')
```

### node_federation_peers
**Select**
```
let { data, error } = await supabase.from('node_federation_peers').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_federation_peers').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_federation_peers').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_federation_peers').delete().eq('id', 'uuid')
```

### node_federation_queue
**Select**
```
let { data, error } = await supabase.from('node_federation_queue').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_federation_queue').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_federation_queue').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_federation_queue').delete().eq('id', 'uuid')
```

### node_gateway_ips
**Select**
```
let { data, error } = await supabase.from('node_gateway_ips').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_gateway_ips').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_gateway_ips').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_gateway_ips').delete().eq('id', 'uuid')
```

### node_gateway_nonce
**Select**
```
let { data, error } = await supabase.from('node_gateway_nonce').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_gateway_nonce').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_gateway_nonce').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_gateway_nonce').delete().eq('id', 'uuid')
```

### node_group
**Select**
```
let { data, error } = await supabase.from('node_group').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_group').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_group').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_group').delete().eq('id', 'uuid')
```

### node_group_member
**Select**
```
let { data, error } = await supabase.from('node_group_member').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_group_member').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_group_member').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_group_member').delete().eq('id', 'uuid')
```

### node_handshake_log
**Select**
```
let { data, error } = await supabase.from('node_handshake_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_handshake_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_handshake_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_handshake_log').delete().eq('id', 'uuid')
```

### node_hardware
**Select**
```
let { data, error } = await supabase.from('node_hardware').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_hardware').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_hardware').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_hardware').delete().eq('id', 'uuid')
```

### node_internal_actions
**Select**
```
let { data, error } = await supabase.from('node_internal_actions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_internal_actions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_internal_actions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_internal_actions').delete().eq('id', 'uuid')
```

### node_karma_log
**Select**
```
let { data, error } = await supabase.from('node_karma_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_karma_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_karma_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_karma_log').delete().eq('id', 'uuid')
```

### node_key_vault
**Select**
```
let { data, error } = await supabase.from('node_key_vault').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_key_vault').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_key_vault').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_key_vault').delete().eq('id', 'uuid')
```

### node_load_state
**Select**
```
let { data, error } = await supabase.from('node_load_state').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_load_state').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_load_state').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_load_state').delete().eq('id', 'uuid')
```

### node_marketplace
**Select**
```
let { data, error } = await supabase.from('node_marketplace').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_marketplace').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_marketplace').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_marketplace').delete().eq('id', 'uuid')
```

### node_mobile_session
**Select**
```
let { data, error } = await supabase.from('node_mobile_session').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_mobile_session').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_mobile_session').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_mobile_session').delete().eq('id', 'uuid')
```

### node_offline_queue
**Select**
```
let { data, error } = await supabase.from('node_offline_queue').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_offline_queue').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_offline_queue').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_offline_queue').delete().eq('id', 'uuid')
```

### node_perm_index
**Select**
```
let { data, error } = await supabase.from('node_perm_index').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_perm_index').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_perm_index').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_perm_index').delete().eq('id', 'uuid')
```

### node_permission
**Select**
```
let { data, error } = await supabase.from('node_permission').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_permission').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_permission').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_permission').delete().eq('id', 'uuid')
```

### node_permission_effective
**Select**
```
let { data, error } = await supabase.from('node_permission_effective').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_permission_effective').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_permission_effective').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_permission_effective').delete().eq('id', 'uuid')
```

### node_permission_log
**Select**
```
let { data, error } = await supabase.from('node_permission_log').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_permission_log').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_permission_log').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_permission_log').delete().eq('id', 'uuid')
```

### node_plugin_access
**Select**
```
let { data, error } = await supabase.from('node_plugin_access').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_plugin_access').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_plugin_access').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_plugin_access').delete().eq('id', 'uuid')
```

### node_plugin_store
**Select**
```
let { data, error } = await supabase.from('node_plugin_store').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_plugin_store').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_plugin_store').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_plugin_store').delete().eq('id', 'uuid')
```

### node_prompt_registry
**Select**
```
let { data, error } = await supabase.from('node_prompt_registry').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_prompt_registry').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_prompt_registry').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_prompt_registry').delete().eq('id', 'uuid')
```

### node_prompt_store
**Select**
```
let { data, error } = await supabase.from('node_prompt_store').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_prompt_store').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_prompt_store').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_prompt_store').delete().eq('id', 'uuid')
```

### node_public_link
**Select**
```
let { data, error } = await supabase.from('node_public_link').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_public_link').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_public_link').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_public_link').delete().eq('id', 'uuid')
```

### node_rate_card
**Select**
```
let { data, error } = await supabase.from('node_rate_card').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_rate_card').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_rate_card').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_rate_card').delete().eq('id', 'uuid')
```

### node_region_registry
**Select**
```
let { data, error } = await supabase.from('node_region_registry').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_region_registry').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_region_registry').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_region_registry').delete().eq('id', 'uuid')
```

### node_replication_queue
**Select**
```
let { data, error } = await supabase.from('node_replication_queue').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_replication_queue').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_replication_queue').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_replication_queue').delete().eq('id', 'uuid')
```

### node_reputation
**Select**
```
let { data, error } = await supabase.from('node_reputation').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_reputation').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_reputation').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_reputation').delete().eq('id', 'uuid')
```

### node_responsibility
**Select**
```
let { data, error } = await supabase.from('node_responsibility').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_responsibility').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_responsibility').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_responsibility').delete().eq('id', 'uuid')
```

### node_rule_master
**Select**
```
let { data, error } = await supabase.from('node_rule_master').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_rule_master').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_rule_master').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_rule_master').delete().eq('id', 'uuid')
```

### node_runtime_session
**Select**
```
let { data, error } = await supabase.from('node_runtime_session').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_runtime_session').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_runtime_session').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_runtime_session').delete().eq('id', 'uuid')
```

### node_task_queue
**Select**
```
let { data, error } = await supabase.from('node_task_queue').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_task_queue').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_task_queue').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_task_queue').delete().eq('id', 'uuid')
```

### node_time_billing
**Select**
```
let { data, error } = await supabase.from('node_time_billing').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_time_billing').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_time_billing').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_time_billing').delete().eq('id', 'uuid')
```

### node_transaction
**Select**
```
let { data, error } = await supabase.from('node_transaction').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_transaction').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_transaction').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_transaction').delete().eq('id', 'uuid')
```

### node_trust_state
**Select**
```
let { data, error } = await supabase.from('node_trust_state').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_trust_state').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_trust_state').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_trust_state').delete().eq('id', 'uuid')
```

### node_usage_billing
**Select**
```
let { data, error } = await supabase.from('node_usage_billing').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_usage_billing').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_usage_billing').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_usage_billing').delete().eq('id', 'uuid')
```

### node_wallet
**Select**
```
let { data, error } = await supabase.from('node_wallet').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('node_wallet').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('node_wallet').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('node_wallet').delete().eq('id', 'uuid')
```

### org_node_map
**Select**
```
let { data, error } = await supabase.from('org_node_map').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('org_node_map').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('org_node_map').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('org_node_map').delete().eq('id', 'uuid')
```

### otp_store
**Select**
```
let { data, error } = await supabase.from('otp_store').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('otp_store').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('otp_store').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('otp_store').delete().eq('id', 'uuid')
```

### owner
**Select**
```
let { data, error } = await supabase.from('owner').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('owner').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('owner').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('owner').delete().eq('id', 'uuid')
```

### owner_key_vault
**Select**
```
let { data, error } = await supabase.from('owner_key_vault').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('owner_key_vault').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('owner_key_vault').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('owner_key_vault').delete().eq('id', 'uuid')
```

### owner_wallet
**Select**
```
let { data, error } = await supabase.from('owner_wallet').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('owner_wallet').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('owner_wallet').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('owner_wallet').delete().eq('id', 'uuid')
```

### payments
**Select**
```
let { data, error } = await supabase.from('payments').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('payments').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('payments').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('payments').delete().eq('id', 'uuid')
```

### permissions
**Select**
```
let { data, error } = await supabase.from('permissions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('permissions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('permissions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('permissions').delete().eq('id', 'uuid')
```

### plan_features
**Select**
```
let { data, error } = await supabase.from('plan_features').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('plan_features').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('plan_features').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('plan_features').delete().eq('id', 'uuid')
```

### plans
**Select**
```
let { data, error } = await supabase.from('plans').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('plans').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('plans').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('plans').delete().eq('id', 'uuid')
```

### plugin_permissions
**Select**
```
let { data, error } = await supabase.from('plugin_permissions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('plugin_permissions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('plugin_permissions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('plugin_permissions').delete().eq('id', 'uuid')
```

### projects
**Select**
```
let { data, error } = await supabase.from('projects').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('projects').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('projects').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('projects').delete().eq('id', 'uuid')
```

### query_cache
**Select**
```
let { data, error } = await supabase.from('query_cache').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('query_cache').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('query_cache').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('query_cache').delete().eq('id', 'uuid')
```

### query_templates
**Select**
```
let { data, error } = await supabase.from('query_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('query_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('query_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('query_templates').delete().eq('id', 'uuid')
```

### role_permissions
**Select**
```
let { data, error } = await supabase.from('role_permissions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('role_permissions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('role_permissions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('role_permissions').delete().eq('id', 'uuid')
```

### roles
**Select**
```
let { data, error } = await supabase.from('roles').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('roles').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('roles').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('roles').delete().eq('id', 'uuid')
```

### security_alerts
**Select**
```
let { data, error } = await supabase.from('security_alerts').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('security_alerts').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('security_alerts').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('security_alerts').delete().eq('id', 'uuid')
```

### security_policies
**Select**
```
let { data, error } = await supabase.from('security_policies').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('security_policies').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('security_policies').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('security_policies').delete().eq('id', 'uuid')
```

### services
**Select**
```
let { data, error } = await supabase.from('services').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('services').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('services').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('services').delete().eq('id', 'uuid')
```

### spatial_ref_sys
**Select**
```
let { data, error } = await supabase.from('spatial_ref_sys').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('spatial_ref_sys').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('spatial_ref_sys').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('spatial_ref_sys').delete().eq('id', 'uuid')
```

### sprints
**Select**
```
let { data, error } = await supabase.from('sprints').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('sprints').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('sprints').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('sprints').delete().eq('id', 'uuid')
```

### subscription_plans
**Select**
```
let { data, error } = await supabase.from('subscription_plans').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('subscription_plans').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('subscription_plans').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('subscription_plans').delete().eq('id', 'uuid')
```

### subscription_tiers
**Select**
```
let { data, error } = await supabase.from('subscription_tiers').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('subscription_tiers').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('subscription_tiers').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('subscription_tiers').delete().eq('id', 'uuid')
```

### subscriptions
**Select**
```
let { data, error } = await supabase.from('subscriptions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('subscriptions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('subscriptions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('subscriptions').delete().eq('id', 'uuid')
```

### system_mode
**Select**
```
let { data, error } = await supabase.from('system_mode').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('system_mode').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('system_mode').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('system_mode').delete().eq('id', 'uuid')
```

### system_permissions
**Select**
```
let { data, error } = await supabase.from('system_permissions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('system_permissions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('system_permissions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('system_permissions').delete().eq('id', 'uuid')
```

### system_prompt_templates
**Select**
```
let { data, error } = await supabase.from('system_prompt_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('system_prompt_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('system_prompt_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('system_prompt_templates').delete().eq('id', 'uuid')
```

### system_role_permissions
**Select**
```
let { data, error } = await supabase.from('system_role_permissions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('system_role_permissions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('system_role_permissions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('system_role_permissions').delete().eq('id', 'uuid')
```

### system_roles
**Select**
```
let { data, error } = await supabase.from('system_roles').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('system_roles').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('system_roles').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('system_roles').delete().eq('id', 'uuid')
```

### table_relationships
**Select**
```
let { data, error } = await supabase.from('table_relationships').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('table_relationships').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('table_relationships').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('table_relationships').delete().eq('id', 'uuid')
```

### tasks
**Select**
```
let { data, error } = await supabase.from('tasks').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('tasks').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('tasks').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('tasks').delete().eq('id', 'uuid')
```

### template_reviews
**Select**
```
let { data, error } = await supabase.from('template_reviews').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('template_reviews').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('template_reviews').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('template_reviews').delete().eq('id', 'uuid')
```

### template_table_map
**Select**
```
let { data, error } = await supabase.from('template_table_map').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('template_table_map').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('template_table_map').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('template_table_map').delete().eq('id', 'uuid')
```

### template_versions
**Select**
```
let { data, error } = await supabase.from('template_versions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('template_versions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('template_versions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('template_versions').delete().eq('id', 'uuid')
```

### ui_context_cache
**Select**
```
let { data, error } = await supabase.from('ui_context_cache').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_context_cache').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_context_cache').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_context_cache').delete().eq('id', 'uuid')
```

### ui_function_templates
**Select**
```
let { data, error } = await supabase.from('ui_function_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_function_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_function_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_function_templates').delete().eq('id', 'uuid')
```

### ui_labels
**Select**
```
let { data, error } = await supabase.from('ui_labels').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_labels').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_labels').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_labels').delete().eq('id', 'uuid')
```

### ui_template_theme_map
**Select**
```
let { data, error } = await supabase.from('ui_template_theme_map').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_template_theme_map').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_template_theme_map').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_template_theme_map').delete().eq('id', 'uuid')
```

### ui_template_widgets
**Select**
```
let { data, error } = await supabase.from('ui_template_widgets').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_template_widgets').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_template_widgets').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_template_widgets').delete().eq('id', 'uuid')
```

### ui_templates
**Select**
```
let { data, error } = await supabase.from('ui_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_templates').delete().eq('id', 'uuid')
```

### ui_theme_settings
**Select**
```
let { data, error } = await supabase.from('ui_theme_settings').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_theme_settings').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_theme_settings').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_theme_settings').delete().eq('id', 'uuid')
```

### ui_themes
**Select**
```
let { data, error } = await supabase.from('ui_themes').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_themes').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_themes').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_themes').delete().eq('id', 'uuid')
```

### ui_user_preferences
**Select**
```
let { data, error } = await supabase.from('ui_user_preferences').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_user_preferences').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_user_preferences').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_user_preferences').delete().eq('id', 'uuid')
```

### ui_widget_layouts
**Select**
```
let { data, error } = await supabase.from('ui_widget_layouts').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('ui_widget_layouts').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('ui_widget_layouts').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('ui_widget_layouts').delete().eq('id', 'uuid')
```

### usage_meter
**Select**
```
let { data, error } = await supabase.from('usage_meter').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('usage_meter').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('usage_meter').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('usage_meter').delete().eq('id', 'uuid')
```

### usage_metrics
**Select**
```
let { data, error } = await supabase.from('usage_metrics').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('usage_metrics').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('usage_metrics').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('usage_metrics').delete().eq('id', 'uuid')
```

### user_consents
**Select**
```
let { data, error } = await supabase.from('user_consents').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('user_consents').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('user_consents').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('user_consents').delete().eq('id', 'uuid')
```

### user_labels
**Select**
```
let { data, error } = await supabase.from('user_labels').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('user_labels').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('user_labels').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('user_labels').delete().eq('id', 'uuid')
```

### user_preferences
**Select**
```
let { data, error } = await supabase.from('user_preferences').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('user_preferences').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('user_preferences').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('user_preferences').delete().eq('id', 'uuid')
```

### user_templates
**Select**
```
let { data, error } = await supabase.from('user_templates').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('user_templates').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('user_templates').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('user_templates').delete().eq('id', 'uuid')
```

### user_theme_preferences
**Select**
```
let { data, error } = await supabase.from('user_theme_preferences').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('user_theme_preferences').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('user_theme_preferences').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('user_theme_preferences').delete().eq('id', 'uuid')
```

### users
**Select**
```
let { data, error } = await supabase.from('users').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('users').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('users').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('users').delete().eq('id', 'uuid')
```

### v_ai_tasks
**Select**
```
let { data, error } = await supabase.from('v_ai_tasks').select('*')
```

### v_event_queue
**Select**
```
let { data, error } = await supabase.from('v_event_queue').select('*')
```

### v_labels
**Select**
```
let { data, error } = await supabase.from('v_labels').select('*')
```

### v_node_state
**Select**
```
let { data, error } = await supabase.from('v_node_state').select('*')
```

### v_permissions
**Select**
```
let { data, error } = await supabase.from('v_permissions').select('*')
```

### v_role_id
**Select**
```
let { data, error } = await supabase.from('v_role_id').select('*')
```

### v_templates
**Select**
```
let { data, error } = await supabase.from('v_templates').select('*')
```

### v_ui_schema
**Select**
```
let { data, error } = await supabase.from('v_ui_schema').select('*')
```

### v_widgets
**Select**
```
let { data, error } = await supabase.from('v_widgets').select('*')
```

### vector_chunks
**Select**
```
let { data, error } = await supabase.from('vector_chunks').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('vector_chunks').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('vector_chunks').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('vector_chunks').delete().eq('id', 'uuid')
```

### vector_documents
**Select**
```
let { data, error } = await supabase.from('vector_documents').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('vector_documents').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('vector_documents').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('vector_documents').delete().eq('id', 'uuid')
```

### whatsapp_messages
**Select**
```
let { data, error } = await supabase.from('whatsapp_messages').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('whatsapp_messages').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('whatsapp_messages').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('whatsapp_messages').delete().eq('id', 'uuid')
```

### whatsapp_sessions
**Select**
```
let { data, error } = await supabase.from('whatsapp_sessions').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('whatsapp_sessions').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('whatsapp_sessions').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('whatsapp_sessions').delete().eq('id', 'uuid')
```

### work_orders
**Select**
```
let { data, error } = await supabase.from('work_orders').select('*')
```
**Insert**
```
const { data, error } = await supabase.from('work_orders').insert([{ /* columns */ }]).select()
```
**Update**
```
const { data, error } = await supabase.from('work_orders').update({ /* columns */ }).eq('id', 'uuid').select()
```
**Delete**
```
const { error } = await supabase.from('work_orders').delete().eq('id', 'uuid')
```

---

## Stored Procedures (RPC)

Use `supabase.rpc()` for the following procedures:

```
const { data, error } = await supabase.rpc('procedure_name', { /* params */ })
```

### activate_template_version
### addauth
### addgeometrycolumn
### ai_decide
### api_get_handler
### api_post_handler
### apply_billing
### apply_karma
### apply_pagination_sorting
### build_ai_context
### build_ai_prompt
### build_auto_join_clause
### build_kpi_query
### build_rag_context
### build_safe_insert
### build_template_query
### calculate_node_bill
### check_action_permission
### check_feature_access
### check_registry_duplicate
### check_usage_limit
### chunk_text
### cleanup_query_cache
### create_mobile_session
### create_runtime_session
### create_widgets_from_ai
### custom_access_token_hook
### decrypt_payload
### disablelongtransactions
### dropgeometrycolumn
### dropgeometrytable
### enablelongtransactions
### encrypt_payload
### equals
### evaluate_agent_rules
### evaluate_dharma
### execute_ai_action
### execute_plugin
### expand_context
### find_nearest_node
### firewall_prompt_check
### fn_build_business_tables_v1
### fn_create_business_schema_v1
### fn_create_business_tables
### fn_initialize_business_v1
### fn_register_business_v1
### fn_seed_business_templates_v1
### gateway_execute
### gdpr_delete_user
### generate_cache_key
### generate_dynamic_query
### generate_embedding
### generate_event_hash
### generate_node_hash
### generate_node_id
### generate_pin
### generate_qr_token
### generate_schema_from_blueprint
### generate_summary_hash
### geography
### geometry
### geometry_above
### geometry_below
### geometry_cmp
### geometry_contained_3d
### geometry_contains
### geometry_contains_3d
### geometry_distance_box
### geometry_distance_centroid
### geometry_eq
### geometry_ge
### geometry_gist_same_2d
### geometry_gt
### geometry_le
### geometry_left
### geometry_lt
### geometry_overabove
### geometry_overbelow
### geometry_overlaps
### geometry_overlaps_3d
### geometry_overleft
### geometry_overright
### geometry_right
### geometry_same
### geometry_same_3d
### geometry_within
### geomfromewkb
### geomfromewkt
### get_active_dashboard_template
### get_branding
### get_cached_result
### get_cached_summary
### get_my_business_id
### get_sortable_columns
### get_template_columns
### get_template_filters
### get_ui_context
### get_ui_schema
### get_widget_data
### gettransactionid
### has_table_permission
### hash_text
### increase_usage
### increment_semantic_hit
### increment_usage
### infer_ui_component
### ingest_web_source
### install_marketplace_template
### load_dashboard
### load_dashboard_kpis
### load_dashboard_kpis_cached
### load_dashboard_widget
### load_dynamic_template_ui
### load_template_data
### load_user_memory
### load_widget_layout
### log_node_execution
### longtransactionsenabled
### node_event_ingest
### node_health_check
### node_runtime_execute
### populate_geometry_columns
### postgis_constraint_dims
### postgis_constraint_srid
### postgis_constraint_type
### postgis_extensions_upgrade
### postgis_full_version
### postgis_geos_version
### postgis_lib_build_date
### postgis_lib_revision
### postgis_lib_version
### postgis_libjson_version
### postgis_liblwgeom_version
### postgis_libprotobuf_version
### postgis_libxml_version
### postgis_proj_version
### postgis_scripts_build_date
### postgis_scripts_installed
### postgis_scripts_released
### postgis_svn_version
### postgis_transform_geometry
### postgis_type_name
### postgis_version
### postgis_wagyu_version
### rate_limit_check
### resolve_active_template
### resolve_dashboard_query
### resolve_plugin
### resolve_template_context
### run_kpi
### run_rag_engine
### run_secure_template
### run_template_count
### run_template_query
### run_template_query_cached
### run_template_query_paged
### save_cached_result
### save_semantic_cache
### save_summary_cache
### save_user_memory
### save_widget_layout
### search_ai_context
### search_knowledge
### search_primary_context
### select_best_node
### semantic_cache_lookup
### set_user_default_template
### st_3dclosestpoint
### st_3ddfullywithin
### st_3ddistance
### st_3ddwithin
### st_3dintersects
### st_3dlongestline
### st_3dmakebox
### st_3dmaxdistance
### st_3dshortestline
### st_addpoint
### st_angle
### st_area
### st_asencodedpolyline
### st_asewkt
### st_asgeojson
### st_asgml
### st_askml
### st_aslatlontext
### st_asmarc21
### st_asmvtgeom
### st_assvg
### st_astext
### st_astwkb
### st_asx3d
### st_azimuth
### st_boundingdiagonal
### st_buffer
### st_centroid
### st_clipbybox2d
### st_closestpoint
### st_collect
### st_concavehull
### st_contains
### st_containsproperly
### st_coorddim
### st_coveredby
### st_covers
### st_crosses
### st_curvetoline
### st_delaunaytriangles
### st_dfullywithin
### st_difference
### st_disjoint
### st_distance
### st_distancesphere
### st_distancespheroid
### st_dwithin
### st_equals
### st_expand
### st_force3d
### st_force3dm
### st_force3dz
### st_force4d
### st_forcesfs
### st_frechetdistance
### st_generatepoints
### st_geogfromtext
### st_geogfromwkb
### st_geographyfromtext
### st_geohash
### st_geomcollfromtext
### st_geomcollfromwkb
### st_geometricmedian
### st_geometryfromtext
### st_geomfromewkb
### st_geomfromewkt
### st_geomfromgeojson
### st_geomfromgml
### st_geomfromkml
### st_geomfrommarc21
### st_geomfromtext
### st_geomfromtwkb
### st_geomfromwkb
### st_gmltosql
### st_hasarc
### st_hausdorffdistance
### st_hexagon
### st_hexagongrid
### st_interpolatepoint
### st_intersection
### st_intersects
### st_isvaliddetail
### st_length
### st_letters
### st_linecrossingdirection
### st_linefromencodedpolyline
### st_linefromtext
### st_linefromwkb
### st_lineinterpolatepoints
### st_linelocatepoint
### st_linestringfromwkb
### st_linetocurve
### st_locatealong
### st_locatebetween
### st_locatebetweenelevations
### st_longestline
### st_makebox2d
### st_makeline
### st_makevalid
### st_maxdistance
### st_maximuminscribedcircle
### st_minimumboundingcircle
### st_minimumboundingradius
### st_mlinefromtext
### st_mlinefromwkb
### st_mpointfromtext
### st_mpointfromwkb
### st_mpolyfromtext
### st_mpolyfromwkb
### st_multilinefromwkb
### st_multilinestringfromtext
### st_multipointfromtext
### st_multipointfromwkb
### st_multipolyfromwkb
### st_multipolygonfromtext
### st_node
### st_normalize
### st_offsetcurve
### st_orderingequals
### st_overlaps
### st_perimeter
### st_point
### st_pointfromtext
### st_pointfromwkb
### st_pointm
### st_pointz
### st_pointzm
### st_polyfromtext
### st_polyfromwkb
### st_polygonfromtext
### st_polygonfromwkb
### st_project
### st_quantizecoordinates
### st_reduceprecision
### st_relate
### st_removerepeatedpoints
### st_scale
### st_segmentize
### st_setsrid
### st_sharedpaths
### st_shortestline
### st_simplifypolygonhull
### st_snap
### st_snaptogrid
### st_split
### st_square
### st_squaregrid
### st_srid
### st_subdivide
### st_swapordinates
### st_symdifference
### st_symmetricdifference
### st_tileenvelope
### st_touches
### st_transform
### st_triangulatepolygon
### st_unaryunion
### st_union
### st_voronoilines
### st_voronoipolygons
### st_within
### st_wkbtosql
### st_wkttosql
### st_wrapx
### sync_data_model_registry
### sync_template_registry
### unlockrows
### update_reputation
### updategeometrysrid
### validate_api_access
### validate_device_trust
### validate_node_action
### validate_node_execution
### validate_runtime_session
### validate_template_schema
### verify_gateway_ip
### verify_gateway_key
### verify_nonce
### wallet_transfer
### wallet_transfer_node
