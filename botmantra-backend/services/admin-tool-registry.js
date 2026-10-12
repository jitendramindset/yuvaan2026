const TOOL_REGISTRY = [
  {
    name: 'create_role',
    description: 'Create a role for a business/brand',
    rpc: 'create_role',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        role_name: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } }
      },
      required: ['business_id', 'role_name']
    }
  },
  {
    name: 'update_permission',
    description: 'Update permissions for a role',
    rpc: 'update_permission',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        role_id: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } }
      },
      required: ['business_id', 'role_id', 'permissions']
    }
  },
  {
    name: 'create_template',
    description: 'Create a UI template',
    rpc: 'create_template',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        template_code: { type: 'string' },
        schema: { type: 'object' }
      },
      required: ['business_id', 'template_code']
    }
  },
  {
    name: 'generate_schema_from_blueprint',
    description: 'Generate DB schema from blueprint',
    rpc: 'generate_schema_from_blueprint',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        blueprint: { type: 'object' }
      },
      required: ['business_id', 'blueprint']
    }
  },
  {
    name: 'sync_data_model_registry',
    description: 'Sync data model registry entries',
    rpc: 'sync_data_model_registry',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        entries: { type: 'array' }
      },
      required: ['business_id']
    }
  },
  {
    name: 'create_widgets_from_ai',
    description: 'Create widgets from AI instructions',
    rpc: 'create_widgets_from_ai',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        widgets: { type: 'array' }
      },
      required: ['business_id', 'widgets']
    }
  },
  {
    name: 'set_user_default_template',
    description: 'Set default template for user',
    rpc: 'set_user_default_template',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        template_code: { type: 'string' }
      },
      required: ['user_id', 'template_code']
    }
  },
  {
    name: 'validate_template_schema',
    description: 'Validate template schema',
    rpc: 'validate_template_schema',
    parameters: {
      type: 'object',
      properties: {
        template_code: { type: 'string' }
      },
      required: ['template_code']
    }
  },
  {
    name: 'install_marketplace_template',
    description: 'Install a marketplace template',
    rpc: 'install_marketplace_template',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        template_code: { type: 'string' }
      },
      required: ['business_id', 'template_code']
    }
  }
];

const registryMap = TOOL_REGISTRY.reduce((acc, tool) => {
  acc[tool.name] = tool;
  return acc;
}, {});

const getAdminTools = () => TOOL_REGISTRY;

const executeAdminTool = async (supabase, toolCall) => {
  const toolName = toolCall?.name;
  const tool = registryMap[toolName];
  if (!tool) {
    return { name: toolName, success: false, error: 'Unknown tool' };
  }

  try {
    const { data, error } = await supabase.rpc(tool.rpc, toolCall.arguments || {});
    if (error) {
      return { name: toolName, success: false, error: error.message };
    }
    return { name: toolName, success: true, data };
  } catch (err) {
    return { name: toolName, success: false, error: err.message };
  }
};

const executeAdminTools = async (supabase, toolCalls = []) => {
  const results = [];
  for (const call of toolCalls) {
    results.push(await executeAdminTool(supabase, call));
  }
  return results;
};

module.exports = {
  getAdminTools,
  executeAdminTool,
  executeAdminTools
};
