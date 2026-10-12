/**
 * AI Agent Templates Node Examples
 * Usage examples for the AI agent templates node system
 */

const AIAgentTemplatesNode = require('./ai-agent-templates');

/**
 * Example: Create a customer support AI agent template
 * @param {string} nodeCode - Node code for the template
 * @param {string} templateName - Name of the template
 */
async function createCustomerSupportTemplate(nodeCode, templateName) {
  try {
    const templateData = {
      name: templateName,
      description: `Customer support AI agent template for ${templateName}`,
      system_prompt: `You are a helpful customer support AI assistant for ${templateName}.
You should be polite, professional, and provide accurate information.
Always ask clarifying questions when needed and escalate complex issues to human agents.
Your goal is to resolve customer inquiries efficiently while maintaining high satisfaction.`,
      rag_enabled: true,
      tools: [
        {
          name: 'search_knowledge_base',
          description: 'Search the knowledge base for relevant information',
          type: 'function'
        },
        {
          name: 'create_support_ticket',
          description: 'Create a support ticket for complex issues',
          type: 'function'
        },
        {
          name: 'check_order_status',
          description: 'Check the status of a customer order',
          type: 'function'
        }
      ],
      model_config: {
        model: 'gpt-4',
        provider: 'openai'
      },
      temperature: 0.3,
      max_tokens: 1500,
      is_active: true,
      tags: ['customer-support', 'helpdesk', 'automated'],
      version: '1.0.0'
    };

    const node = await AIAgentTemplatesNode.createAgentTemplateNode(nodeCode, templateData);
    console.log('Created customer support template:', node.id);
    return node;
  } catch (error) {
    console.error('Error creating customer support template:', error);
    throw error;
  }
}

/**
 * Example: Create a data analysis AI agent template
 * @param {string} nodeCode - Node code for the template
 */
async function createDataAnalysisTemplate(nodeCode) {
  try {
    const templateData = {
      name: 'Data Analysis Assistant',
      description: 'AI agent specialized in data analysis and insights generation',
      system_prompt: `You are an expert data analyst AI assistant.
You excel at analyzing datasets, identifying patterns, and providing actionable insights.
Always explain your methodology clearly and provide confidence levels for your conclusions.
Use appropriate statistical methods and visualizations when explaining findings.`,
      rag_enabled: true,
      tools: [
        {
          name: 'analyze_dataset',
          description: 'Perform statistical analysis on datasets',
          type: 'function'
        },
        {
          name: 'generate_visualization',
          description: 'Create charts and graphs from data',
          type: 'function'
        },
        {
          name: 'predict_trends',
          description: 'Predict future trends based on historical data',
          type: 'function'
        },
        {
          name: 'export_report',
          description: 'Generate comprehensive analysis reports',
          type: 'function'
        }
      ],
      model_config: {
        model: 'gpt-4-turbo',
        provider: 'openai'
      },
      temperature: 0.1,
      max_tokens: 2000,
      is_active: true,
      tags: ['data-analysis', 'insights', 'statistics'],
      version: '2.1.0'
    };

    const node = await AIAgentTemplatesNode.createAgentTemplateNode(nodeCode, templateData);
    console.log('Created data analysis template:', node.id);
    return node;
  } catch (error) {
    console.error('Error creating data analysis template:', error);
    throw error;
  }
}

/**
 * Example: Query templates by tags
 * @param {Array} tags - Array of tags to filter by
 */
async function getTemplatesByTags(tags) {
  try {
    const nodes = await AIAgentTemplatesNode.queryAgentTemplateNodes({
      tags: tags,
      is_active: true
    });
    console.log(`Found ${nodes.length} active templates with tags: ${tags.join(', ')}`);
    return nodes;
  } catch (error) {
    console.error('Error querying templates by tags:', error);
    throw error;
  }
}

/**
 * Example: Clone and modify a template
 * @param {string} sourceNodeCode - Source template to clone
 * @param {string} newNodeCode - New node code for cloned template
 * @param {Object} modifications - Modifications to apply
 */
async function cloneAndModifyTemplate(sourceNodeCode, newNodeCode, modifications) {
  try {
    const clonedNode = await AIAgentTemplatesNode.cloneTemplate(sourceNodeCode, {
      node_code: newNodeCode,
      ...modifications
    });

    console.log(`Cloned template ${sourceNodeCode} to ${newNodeCode}`);
    return clonedNode;
  } catch (error) {
    console.error('Error cloning template:', error);
    throw error;
  }
}

/**
 * Example: Instantiate a template into a live agent
 * @param {string} templateNodeCode - Template to instantiate
 * @param {string} instanceNodeCode - Node code for the instance
 * @param {Object} instanceConfig - Instance-specific configuration
 */
async function instantiateTemplate(templateNodeCode, instanceNodeCode, instanceConfig = {}) {
  try {
    const liveNode = await AIAgentTemplatesNode.instantiateTemplate(templateNodeCode, {
      node_code: instanceNodeCode,
      instance_config: instanceConfig
    });

    console.log(`Instantiated template ${templateNodeCode} as live agent ${instanceNodeCode}`);
    return liveNode;
  } catch (error) {
    console.error('Error instantiating template:', error);
    throw error;
  }
}

/**
 * Example: Update template configuration
 * @param {string} nodeCode - Node code to update
 * @param {Object} newConfig - New configuration
 */
async function updateTemplateConfig(nodeCode, newConfig) {
  try {
    const updates = {};

    if (newConfig.model_config) {
      updates['metadata.model_config'] = newConfig.model_config;
    }
    if (newConfig.temperature !== undefined) {
      updates['metadata.temperature'] = newConfig.temperature;
    }
    if (newConfig.max_tokens !== undefined) {
      updates['metadata.max_tokens'] = newConfig.max_tokens;
    }
    if (newConfig.tools) {
      updates['metadata.tools'] = newConfig.tools;
    }

    const node = await AIAgentTemplatesNode.updateAgentTemplateNode(nodeCode, updates);
    console.log('Updated template configuration for:', node.node_code);
    return node;
  } catch (error) {
    console.error('Error updating template config:', error);
    throw error;
  }
}

/**
 * Example: Get template statistics
 */
async function getTemplateStats() {
  try {
    const stats = await AIAgentTemplatesNode.getTemplateStatistics();
    console.log('Template statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting template stats:', error);
    throw error;
  }
}

/**
 * Example: Create a comprehensive AI agent template library
 */
async function createTemplateLibrary() {
  const templates = [
    {
      nodeCode: 'template_support_basic',
      name: 'Basic Support Agent',
      type: 'support',
      config: {
        system_prompt: 'You are a basic customer support assistant.',
        tools: ['search_faq', 'create_ticket'],
        temperature: 0.5
      }
    },
    {
      nodeCode: 'template_sales_pro',
      name: 'Professional Sales Agent',
      type: 'sales',
      config: {
        system_prompt: 'You are a professional sales representative.',
        tools: ['product_search', 'pricing_calc', 'schedule_demo'],
        temperature: 0.7
      }
    },
    {
      nodeCode: 'template_hr_assistant',
      name: 'HR Assistant',
      type: 'hr',
      config: {
        system_prompt: 'You are an HR assistant helping with employee inquiries.',
        tools: ['policy_search', 'benefits_calc', 'schedule_interview'],
        temperature: 0.3
      }
    },
    {
      nodeCode: 'template_tech_writer',
      name: 'Technical Writer',
      type: 'content',
      config: {
        system_prompt: 'You are a technical writer creating documentation.',
        tools: ['code_analysis', 'diagram_gen', 'format_docs'],
        temperature: 0.2
      }
    }
  ];

  const createdTemplates = [];

  for (const template of templates) {
    try {
      const node = await createCustomerSupportTemplate(template.nodeCode, template.name);

      // Update with specific configuration
      await updateTemplateConfig(template.nodeCode, template.config);

      createdTemplates.push({ ...template, node_id: node.id });
    } catch (error) {
      console.error(`Failed to create template ${template.name}:`, error);
    }
  }

  console.log(`Created ${createdTemplates.length} AI agent templates`);
  return createdTemplates;
}

/**
 * Example: Simulate template workflow (create → clone → instantiate)
 * @param {string} baseNodeCode - Base node code for the workflow
 */
async function simulateTemplateWorkflow(baseNodeCode) {
  try {
    console.log('=== Starting Template Workflow Simulation ===');

    // 1. Create base template
    const baseTemplate = await createCustomerSupportTemplate(baseNodeCode, 'Workflow Base Template');
    console.log('✓ Created base template');

    // 2. Clone template with modifications
    const clonedNodeCode = `${baseNodeCode}_premium`;
    const clonedTemplate = await cloneAndModifyTemplate(baseNodeCode, clonedNodeCode, {
      name: 'Premium Support Template',
      temperature: 0.2,
      max_tokens: 2000,
      tags: ['premium', 'advanced']
    });
    console.log('✓ Cloned and modified template');

    // 3. Instantiate the premium template
    const instanceNodeCode = `${clonedNodeCode}_instance_001`;
    const liveAgent = await instantiateTemplate(clonedNodeCode, instanceNodeCode, {
      customer_id: 'CUST_001',
      priority_level: 'high',
      custom_instructions: 'Handle premium customers with extra care'
    });
    console.log('✓ Instantiated template as live agent');

    // 4. Get final statistics
    const stats = await getTemplateStats();
    console.log('✓ Retrieved final statistics');

    return {
      base_template: baseTemplate,
      cloned_template: clonedTemplate,
      live_agent: liveAgent,
      final_stats: stats
    };
  } catch (error) {
    console.error('Error in template workflow simulation:', error);
    throw error;
  }
}

// Export example functions for testing
module.exports = {
  createCustomerSupportTemplate,
  createDataAnalysisTemplate,
  getTemplatesByTags,
  cloneAndModifyTemplate,
  instantiateTemplate,
  updateTemplateConfig,
  getTemplateStats,
  createTemplateLibrary,
  simulateTemplateWorkflow
};

// Example usage (uncomment to test):
/*
async function runExamples() {
  // Create a comprehensive template library
  await createTemplateLibrary();

  // Run workflow simulation
  const workflowResult = await simulateTemplateWorkflow('workflow_template_' + Date.now());

  console.log('Workflow completed:', workflowResult);

  // Get final statistics
  await getTemplateStats();
}

runExamples().catch(console.error);
*/