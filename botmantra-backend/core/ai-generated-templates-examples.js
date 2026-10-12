/**
 * AI Generated Templates Node Examples
 * Usage examples for AI Generated Templates Management
 */

const { aiGeneratedTemplatesNode } = require('../core/ai-generated-templates');

/**
 * Example: Create a new AI-generated template
 */
async function createTemplateExample() {
  try {
    console.log('=== Creating AI Generated Template Example ===');

    const templateData = {
      request_id: 'dashboard-req-12345',
      template_code: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .content { margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Your AI Generated Page</h1>
        <p>This page was generated based on your request.</p>
    </div>
    <div class="content">
        <p>Content will be dynamically loaded here.</p>
    </div>
</body>
</html>`,
      config: {
        type: 'html',
        framework: 'vanilla',
        responsive: true,
        theme: 'light',
        components: ['header', 'content'],
        styling: 'inline-css'
      },
      metadata: {
        generator: 'ai-template-engine-v2',
        version: '1.0',
        tags: ['webpage', 'responsive', 'ai-generated'],
        estimated_complexity: 'medium'
      }
    };

    const result = await aiGeneratedTemplatesNode.createGeneratedTemplate(templateData);

    console.log('Template created successfully:');
    console.log('Node Code:', result.node.node_code);
    console.log('Database ID:', result.database_record.id);
    console.log('Request ID:', result.node.metadata.request_id);

    return result;
  } catch (error) {
    console.error('Error in create template example:', error);
  }
}

/**
 * Example: Query templates by request ID
 */
async function queryTemplatesByRequestExample(requestId) {
  try {
    console.log('=== Querying Templates by Request Example ===');

    const templates = await aiGeneratedTemplatesNode.getTemplatesByRequest(requestId);

    console.log(`Found ${templates.length} templates for request ${requestId}:`);
    templates.forEach((template, index) => {
      console.log(`${index + 1}. Node Code: ${template.node_code}`);
      console.log(`   Template Type: ${template.metadata.config?.type}`);
      console.log(`   Usage Count: ${template.metadata.usage_count || 0}`);
      console.log(`   Rating: ${template.metadata.rating || 'Not rated'}`);
      console.log('');
    });

    return templates;
  } catch (error) {
    console.error('Error in query templates example:', error);
  }
}

/**
 * Example: Update template usage and rating
 */
async function updateTemplateExample(nodeCode) {
  try {
    console.log('=== Updating Template Example ===');

    // Increment usage
    console.log('Incrementing usage count...');
    await aiGeneratedTemplatesNode.incrementUsage(nodeCode);

    // Rate the template
    console.log('Rating template...');
    const ratingResult = await aiGeneratedTemplatesNode.rateTemplate(nodeCode, 5, 'Excellent template!');

    console.log('Template updated:');
    console.log('Node Code:', ratingResult.node.node_code);
    console.log('Usage Count:', ratingResult.node.metadata.usage_count);
    console.log('Rating:', ratingResult.node.metadata.rating);
    console.log('Feedback:', ratingResult.node.metadata.feedback);

    return ratingResult;
  } catch (error) {
    console.error('Error in update template example:', error);
  }
}

/**
 * Example: Get popular templates
 */
async function getPopularTemplatesExample() {
  try {
    console.log('=== Getting Popular Templates Example ===');

    const popularTemplates = await aiGeneratedTemplatesNode.getPopularTemplates({ limit: 5 });

    console.log('Top 5 popular templates:');
    popularTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.node_code}`);
      console.log(`   Usage: ${template.metadata.usage_count || 0}`);
      console.log(`   Type: ${template.metadata.config?.type}`);
      console.log(`   Rating: ${template.metadata.rating || 'N/A'}`);
      console.log('');
    });

    return popularTemplates;
  } catch (error) {
    console.error('Error in popular templates example:', error);
  }
}

/**
 * Example: Get template statistics
 */
async function getTemplateStatsExample(requestId = null) {
  try {
    console.log('=== Getting Template Statistics Example ===');

    const stats = await aiGeneratedTemplatesNode.getTemplateStats(requestId);

    console.log('Template Statistics:');
    console.log(`Total Templates: ${stats.total_templates}`);
    console.log(`Active Templates: ${stats.active_templates}`);
    console.log(`Total Usage: ${stats.total_usage}`);
    console.log(`Average Rating: ${stats.avg_rating.toFixed(2)}`);

    console.log('\nRating Distribution:');
    Object.entries(stats.rating_distribution).forEach(([rating, count]) => {
      console.log(`  ${rating} stars: ${count}`);
    });

    console.log('\nTemplates by Request:');
    Object.entries(stats.templates_by_request).forEach(([reqId, count]) => {
      console.log(`  ${reqId}: ${count} templates`);
    });

    return stats;
  } catch (error) {
    console.error('Error in template stats example:', error);
  }
}

/**
 * Example: Clone a template with modifications
 */
async function cloneTemplateExample(originalNodeCode, modifications = {}) {
  try {
    console.log('=== Cloning Template Example ===');

    // Get the original template
    const templates = await aiGeneratedTemplatesNode.queryGeneratedTemplates();
    const originalTemplate = templates.find(node => node.node_code === originalNodeCode);

    if (!originalTemplate) {
      console.log('Original template not found');
      return;
    }

    // Create cloned template data
    const clonedData = {
      request_id: modifications.request_id || originalTemplate.metadata.request_id,
      template_code: modifications.template_code || originalTemplate.metadata.template_code,
      config: modifications.config || originalTemplate.metadata.config,
      metadata: {
        ...originalTemplate.metadata,
        cloned_from: originalNodeCode,
        cloned_at: new Date().toISOString(),
        ...modifications.metadata
      }
    };

    const result = await aiGeneratedTemplatesNode.createGeneratedTemplate(clonedData);

    console.log('Template cloned successfully:');
    console.log('Original Node Code:', originalNodeCode);
    console.log('New Node Code:', result.node.node_code);
    console.log('Cloned At:', result.node.metadata.cloned_at);

    return result;
  } catch (error) {
    console.error('Error in clone template example:', error);
  }
}

/**
 * Example: Template lifecycle management
 */
async function templateLifecycleExample() {
  try {
    console.log('=== Template Lifecycle Management Example ===');

    // 1. Create a template
    console.log('1. Creating template...');
    const createResult = await createTemplateExample();
    const nodeCode = createResult.node.node_code;

    // 2. Query the template
    console.log('2. Querying template...');
    const templates = await aiGeneratedTemplatesNode.queryGeneratedTemplates();
    const template = templates.find(node => node.node_code === nodeCode);
    console.log('Template found:', template.node_code);

    // 3. Update usage and rating
    console.log('3. Updating usage and rating...');
    await updateTemplateExample(nodeCode);

    // 4. Clone the template
    console.log('4. Cloning template...');
    await cloneTemplateExample(nodeCode, {
      metadata: {
        purpose: 'modified_version',
        changes: 'Updated styling and layout'
      }
    });

    // 5. Get statistics
    console.log('5. Getting statistics...');
    await getTemplateStatsExample();

    // 6. Mark as inactive (soft delete)
    console.log('6. Deactivating template...');
    await aiGeneratedTemplatesNode.updateGeneratedTemplate(nodeCode, { is_active: false });

    console.log('Template lifecycle completed successfully');

  } catch (error) {
    console.error('Error in template lifecycle example:', error);
  }
}

/**
 * Example: Batch template operations
 */
async function batchOperationsExample() {
  try {
    console.log('=== Batch Template Operations Example ===');

    // Create multiple templates
    const templates = [
      {
        request_id: 'batch-req-1',
        template_code: '<div>Template 1</div>',
        config: { type: 'component' },
        metadata: { batch_id: 'batch-001' }
      },
      {
        request_id: 'batch-req-2',
        template_code: '<div>Template 2</div>',
        config: { type: 'page' },
        metadata: { batch_id: 'batch-001' }
      },
      {
        request_id: 'batch-req-3',
        template_code: '<div>Template 3</div>',
        config: { type: 'layout' },
        metadata: { batch_id: 'batch-001' }
      }
    ];

    console.log('Creating batch templates...');
    const createdTemplates = [];

    for (const templateData of templates) {
      const result = await aiGeneratedTemplatesNode.createGeneratedTemplate(templateData);
      createdTemplates.push(result);
      console.log(`Created: ${result.node.node_code}`);
    }

    // Query batch templates
    console.log('Querying batch templates...');
    const batchTemplates = await aiGeneratedTemplatesNode.queryGeneratedTemplates({
      is_active: true
    });

    const batchOnes = batchTemplates.filter(t => t.metadata.batch_id === 'batch-001');
    console.log(`Found ${batchOnes.length} templates in batch`);

    // Update all batch templates
    console.log('Updating batch templates...');
    for (const template of batchOnes) {
      await aiGeneratedTemplatesNode.incrementUsage(template.node_code);
    }

    console.log('Batch operations completed');

  } catch (error) {
    console.error('Error in batch operations example:', error);
  }
}

// Export examples for external use
module.exports = {
  createTemplateExample,
  queryTemplatesByRequestExample,
  updateTemplateExample,
  getPopularTemplatesExample,
  getTemplateStatsExample,
  cloneTemplateExample,
  templateLifecycleExample,
  batchOperationsExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running AI Generated Templates Examples...\n');

  // Run examples sequentially
  setTimeout(async () => {
    await templateLifecycleExample();
    console.log('\n' + '='.repeat(50) + '\n');
    await batchOperationsExample();
    console.log('\nExamples completed.');
  }, 1000);
}