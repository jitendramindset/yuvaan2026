/**
 * AI Knowledge Base Node Examples
 * Usage examples for AI Knowledge Base Management
 */

const { aiKnowledgeBaseNode } = require('../core/ai-knowledge-base');

/**
 * Example: Create a new AI knowledge base entry
 */
async function createKnowledgeEntryExample() {
  try {
    console.log('=== Creating AI Knowledge Base Entry Example ===');

    const knowledgeData = {
      business_id: 'business-12345',
      source_type: 'document',
      source_id: 'doc-001',
      content: 'This is a sample knowledge base entry containing information about artificial intelligence and machine learning. It covers topics such as neural networks, deep learning algorithms, and their applications in various industries.',
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5], // Mock embedding vector
      metadata: {
        author: 'AI Assistant',
        tags: ['AI', 'ML', 'neural-networks'],
        confidence_score: 0.95,
        processing_date: new Date().toISOString(),
        language: 'en'
      },
      is_active: true,
      doc_id: 'kb-doc-001',
      heading: 'Introduction to Artificial Intelligence',
      sub_heading: 'Neural Networks and Deep Learning',
      chunk_index: 0,
      user_id: 'user-12345'
    };

    const result = await aiKnowledgeBaseNode.createKnowledgeEntry(knowledgeData);

    console.log('Knowledge entry created successfully:');
    console.log('Node Code:', result.node.node_code);
    console.log('Database ID:', result.database_record.id);
    console.log('Source Type:', result.node.metadata.source_type);
    console.log('Document ID:', result.node.metadata.doc_id);

    return result;
  } catch (error) {
    console.error('Error in create knowledge entry example:', error);
  }
}

/**
 * Example: Query knowledge entries by criteria
 */
async function queryKnowledgeEntriesExample(businessId) {
  try {
    console.log('=== Querying Knowledge Entries Example ===');

    const criteria = {
      business_id: businessId,
      is_active: true
    };

    const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries(criteria, { limit: 5 });

    console.log(`Found ${entries.length} knowledge entries for business ${businessId}:`);
    entries.forEach((entry, index) => {
      console.log(`${index + 1}. Node Code: ${entry.node_code}`);
      console.log(`   Source Type: ${entry.metadata.source_type}`);
      console.log(`   Document ID: ${entry.metadata.doc_id}`);
      console.log(`   Heading: ${entry.metadata.heading}`);
      console.log(`   Access Count: ${entry.metadata.access_count || 0}`);
      console.log('');
    });

    return entries;
  } catch (error) {
    console.error('Error in query knowledge entries example:', error);
  }
}

/**
 * Example: Search by semantic similarity
 */
async function searchBySimilarityExample() {
  try {
    console.log('=== Searching by Semantic Similarity Example ===');

    // Mock query embedding (in real implementation, this would be generated from user query)
    const queryEmbedding = [0.15, 0.25, 0.35, 0.45, 0.55];

    const filters = {
      business_id: 'business-12345',
      source_type: 'document'
    };

    const results = await aiKnowledgeBaseNode.searchBySimilarity(queryEmbedding, filters, 3);

    console.log('Top 3 similar knowledge entries:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. Similarity: ${result.similarity_score?.toFixed(3)}`);
      console.log(`   Node Code: ${result.node_code}`);
      console.log(`   Heading: ${result.metadata.heading}`);
      console.log(`   Content Preview: ${result.metadata.content?.substring(0, 100)}...`);
      console.log('');
    });

    return results;
  } catch (error) {
    console.error('Error in search by similarity example:', error);
  }
}

/**
 * Example: Search by text content
 */
async function searchByTextExample(query) {
  try {
    console.log('=== Searching by Text Content Example ===');

    const filters = {
      business_id: 'business-12345'
    };

    const results = await aiKnowledgeBaseNode.searchByText(query, filters, 5);

    console.log(`Found ${results.length} entries matching "${query}":`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.metadata.heading}`);
      console.log(`   Content: ${result.metadata.content?.substring(0, 150)}...`);
      console.log(`   Source: ${result.metadata.source_type} - ${result.metadata.doc_id}`);
      console.log('');
    });

    return results;
  } catch (error) {
    console.error('Error in search by text example:', error);
  }
}

/**
 * Example: Get entries by document
 */
async function getEntriesByDocumentExample(docId) {
  try {
    console.log('=== Getting Entries by Document Example ===');

    const entries = await aiKnowledgeBaseNode.getEntriesByDocument(docId);

    console.log(`Found ${entries.length} entries for document ${docId}:`);
    entries.forEach((entry, index) => {
      console.log(`${index + 1}. Chunk ${entry.metadata.chunk_index}: ${entry.metadata.heading}`);
      console.log(`   Content Length: ${entry.metadata.content?.length || 0} characters`);
      console.log('');
    });

    return entries;
  } catch (error) {
    console.error('Error in get entries by document example:', error);
  }
}

/**
 * Example: Update knowledge entry and track access
 */
async function updateKnowledgeEntryExample(nodeCode) {
  try {
    console.log('=== Updating Knowledge Entry Example ===');

    // First, increment access count
    console.log('Incrementing access count...');
    await aiKnowledgeBaseNode.incrementAccessCount(nodeCode);

    // Then update with new metadata
    console.log('Updating metadata...');
    const updateData = {
      metadata: {
        last_reviewed: new Date().toISOString(),
        review_notes: 'Content verified and updated',
        version: 2
      }
    };

    const result = await aiKnowledgeBaseNode.updateKnowledgeEntry(nodeCode, updateData);

    console.log('Knowledge entry updated:');
    console.log('Node Code:', result.node.node_code);
    console.log('Access Count:', result.node.metadata.access_count);
    console.log('Last Reviewed:', result.node.metadata.last_reviewed);

    return result;
  } catch (error) {
    console.error('Error in update knowledge entry example:', error);
  }
}

/**
 * Example: Get knowledge base statistics
 */
async function getKnowledgeStatsExample(businessId = null) {
  try {
    console.log('=== Getting Knowledge Base Statistics Example ===');

    const stats = await aiKnowledgeBaseNode.getKnowledgeStats(businessId);

    console.log('Knowledge Base Statistics:');
    console.log(`Total Entries: ${stats.total_entries}`);
    console.log(`Active Entries: ${stats.active_entries}`);
    console.log(`Total Access Count: ${stats.total_access}`);
    console.log(`Average Access per Entry: ${stats.avg_access_per_entry.toFixed(2)}`);

    console.log('\nSource Types:');
    Object.entries(stats.source_types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\nDocuments:');
    Object.entries(stats.documents).forEach(([docId, count]) => {
      console.log(`  ${docId}: ${count} chunks`);
    });

    if (!businessId) {
      console.log('\nBusinesses:');
      Object.entries(stats.businesses).forEach(([bizId, count]) => {
        console.log(`  ${bizId}: ${count} entries`);
      });
    }

    return stats;
  } catch (error) {
    console.error('Error in knowledge stats example:', error);
  }
}

/**
 * Example: Clone a knowledge entry
 */
async function cloneKnowledgeEntryExample(originalNodeCode, modifications = {}) {
  try {
    console.log('=== Cloning Knowledge Entry Example ===');

    // Get the original entry
    const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries();
    const originalEntry = entries.find(node => node.node_code === originalNodeCode);

    if (!originalEntry) {
      console.log('Original entry not found');
      return;
    }

    // Create cloned entry data
    const clonedData = {
      business_id: modifications.business_id || originalEntry.metadata.business_id,
      source_type: originalEntry.metadata.source_type,
      source_id: `${originalEntry.metadata.source_id}-clone-${Date.now()}`,
      content: modifications.content || originalEntry.metadata.content,
      embedding: originalEntry.metadata.embedding, // Keep same embedding
      metadata: {
        ...originalEntry.metadata,
        cloned_from: originalNodeCode,
        cloned_at: new Date().toISOString(),
        purpose: modifications.purpose || 'backup',
        ...modifications.metadata
      },
      is_active: true,
      doc_id: `${originalEntry.metadata.doc_id}-clone`,
      heading: modifications.heading || `${originalEntry.metadata.heading} (Clone)`,
      sub_heading: originalEntry.metadata.sub_heading,
      chunk_index: originalEntry.metadata.chunk_index,
      user_id: originalEntry.metadata.user_id
    };

    const result = await aiKnowledgeBaseNode.createKnowledgeEntry(clonedData);

    console.log('Knowledge entry cloned successfully:');
    console.log('Original Node Code:', originalNodeCode);
    console.log('New Node Code:', result.node.node_code);
    console.log('Cloned At:', result.node.metadata.cloned_at);

    return result;
  } catch (error) {
    console.error('Error in clone knowledge entry example:', error);
  }
}

/**
 * Example: Batch knowledge entry creation
 */
async function batchKnowledgeCreationExample() {
  try {
    console.log('=== Batch Knowledge Entry Creation Example ===');

    // Create multiple entries for a document
    const baseData = {
      business_id: 'business-12345',
      source_type: 'document',
      source_id: 'batch-doc-001',
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      metadata: {
        batch_id: 'batch-001',
        created_via: 'batch_import'
      },
      is_active: true,
      doc_id: 'batch-doc-001',
      user_id: 'user-12345'
    };

    const entries = [
      {
        ...baseData,
        content: 'This is the first chunk of content from the document. It contains introductory information about the topic.',
        heading: 'Introduction',
        sub_heading: 'Overview of the Topic',
        chunk_index: 0
      },
      {
        ...baseData,
        content: 'This is the second chunk that continues the discussion with more detailed information and examples.',
        heading: 'Main Content',
        sub_heading: 'Detailed Analysis',
        chunk_index: 1
      },
      {
        ...baseData,
        content: 'This final chunk concludes the document with summary points and recommendations.',
        heading: 'Conclusion',
        sub_heading: 'Summary and Recommendations',
        chunk_index: 2
      }
    ];

    console.log('Creating batch knowledge entries...');
    const results = [];

    for (const entryData of entries) {
      const result = await aiKnowledgeBaseNode.createKnowledgeEntry(entryData);
      results.push(result);
      console.log(`Created: ${result.node.node_code} (Chunk ${result.node.metadata.chunk_index})`);
    }

    console.log(`Successfully created ${results.length} knowledge entries`);

    return results;
  } catch (error) {
    console.error('Error in batch creation example:', error);
  }
}

/**
 * Example: Knowledge base lifecycle management
 */
async function knowledgeBaseLifecycleExample() {
  try {
    console.log('=== Knowledge Base Lifecycle Management Example ===');

    // 1. Create an entry
    console.log('1. Creating knowledge entry...');
    const createResult = await createKnowledgeEntryExample();
    const nodeCode = createResult.node.node_code;

    // 2. Query the entry
    console.log('2. Querying knowledge entry...');
    const entries = await aiKnowledgeBaseNode.queryKnowledgeEntries();
    const entry = entries.find(node => node.node_code === nodeCode);
    console.log('Entry found:', entry.node_code);

    // 3. Update access and metadata
    console.log('3. Updating access and metadata...');
    await updateKnowledgeEntryExample(nodeCode);

    // 4. Search by similarity
    console.log('4. Searching by similarity...');
    await searchBySimilarityExample();

    // 5. Search by text
    console.log('5. Searching by text...');
    await searchByTextExample('artificial intelligence');

    // 6. Clone the entry
    console.log('6. Cloning entry...');
    await cloneKnowledgeEntryExample(nodeCode, {
      metadata: {
        purpose: 'version_backup',
        version: '1.1'
      }
    });

    // 7. Get statistics
    console.log('7. Getting statistics...');
    await getKnowledgeStatsExample();

    // 8. Soft delete
    console.log('8. Soft deleting entry...');
    await aiKnowledgeBaseNode.deleteKnowledgeEntry(nodeCode);

    console.log('Knowledge base lifecycle completed successfully');

  } catch (error) {
    console.error('Error in knowledge base lifecycle example:', error);
  }
}

// Export examples for external use
module.exports = {
  createKnowledgeEntryExample,
  queryKnowledgeEntriesExample,
  searchBySimilarityExample,
  searchByTextExample,
  getEntriesByDocumentExample,
  updateKnowledgeEntryExample,
  getKnowledgeStatsExample,
  cloneKnowledgeEntryExample,
  batchKnowledgeCreationExample,
  knowledgeBaseLifecycleExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running AI Knowledge Base Examples...\n');

  // Run examples sequentially
  setTimeout(async () => {
    await knowledgeBaseLifecycleExample();
    console.log('\n' + '='.repeat(50) + '\n');
    await batchKnowledgeCreationExample();
    console.log('\nExamples completed.');
  }, 1000);
}