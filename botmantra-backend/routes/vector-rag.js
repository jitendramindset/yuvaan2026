/**
 * 🧠 VECTOR RAG ENGINE
 * 
 * Complete Vector Memory Management + RAG (Retrieval Augmented Generation)
 * 
 * Features:
 *  ✅ Vector embedding generation (OpenAI)
 *  ✅ Similarity search (pgvector)
 *  ✅ RAG context retrieval
 *  ✅ Smart recommendations
 *  ✅ Auto-tagging
 *  ✅ Vector clustering
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

/**
 * ═════════════════════════════════════════════════════════════════
 * 1. EMBEDDING GENERATION
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text.substring(0, 8191), // OpenAI limit
        model: 'text-embedding-3-small',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error.response?.data || error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * POST /api/vectors/embed
 * Generate and store vector for a node
 */
router.post('/embed', async (req, res) => {
  try {
    const {
      nodeId,
      content,
      contentType = 'general',
      heading = '',
      subHeading = '',
      section = '',
      metadata = {},
    } = req.body;

    // Validation
    if (!nodeId || !content) {
      return res.status(400).json({ error: 'nodeId and content required' });
    }

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Store in database
    const { data, error } = await supabase
      .from('node_vector_memory')
      .insert([
        {
          node_id: nodeId,
          content: content.substring(0, 4000), // Store truncated content
          content_type: contentType,
          heading,
          sub_heading: subHeading,
          section,
          embedding,
          metadata: {
            ...metadata,
            generated_at: new Date().toISOString(),
            model: 'text-embedding-3-small',
            input_length: content.length,
          },
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      vector_id: data[0].vector_id,
      embedding_dimensions: embedding.length,
      message: 'Vector embedded and stored',
    });
  } catch (error) {
    console.error('Embed error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════
 * 2. SIMILARITY SEARCH & RAG
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * POST /api/vectors/search
 * Semantic similarity search using pgvector
 */
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      limit = 10,
      nodeType = null,
      brandId = null,
      includeMetadata = true,
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query cannot be empty' });
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Build search query
    let searchQuery = supabase.rpc('search_similar_vectors', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // Cosine similarity threshold
      match_count: Math.min(limit, 100),
    });

    // Optional filters
    if (nodeType) {
      searchQuery = searchQuery.eq('content_type', nodeType);
    }

    const { data, error } = await searchQuery;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Enrich results with node information
    const enrichedResults = await Promise.all(
      data.map(async (result) => {
        const { data: nodeData } = await supabase
          .from('node_core')
          .select('node_id, node_type, node_name, metadata')
          .eq('node_id', result.node_id)
          .single();

        return {
          vector_id: result.vector_id,
          node_id: result.node_id,
          node_name: nodeData?.node_name,
          node_type: nodeData?.node_type,
          content: result.content,
          content_type: result.content_type,
          heading: result.heading,
          similarity: result.similarity,
          metadata: includeMetadata
            ? {
                ...result.metadata,
                node_metadata: nodeData?.metadata,
              }
            : undefined,
        };
      })
    );

    res.json({
      success: true,
      query,
      count: enrichedResults.length,
      results: enrichedResults,
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vectors/rag
 * RAG Pipeline: Search -> Retrieve Context -> Generate Response
 */
router.post('/rag', async (req, res) => {
  try {
    const {
      query,
      contextLimit = 5,
      systemPrompt = 'You are a helpful assistant.',
      temperature = 0.7,
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query cannot be empty' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Step 1: Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Search for similar vectors
    const { data: similarVectors, error: searchError } = await supabase.rpc(
      'search_similar_vectors',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.65,
        match_count: contextLimit,
      }
    );

    if (searchError) {
      return res.status(500).json({ error: searchError.message });
    }

    // Step 3: Build context from retrieved vectors
    let context = '';
    if (similarVectors && similarVectors.length > 0) {
      context = similarVectors
        .map(
          (vec, idx) =>
            `[Context ${idx + 1}]\nHeading: ${vec.heading}\nContent: ${vec.content}\n`
        )
        .join('\n---\n\n');
    }

    // Step 4: Build prompt for LLM
    const finalPrompt = `${systemPrompt}

${context ? `Context Information:\n${context}\n` : ''}

User Query: ${query}

Please provide a helpful response based on the context provided above.`;

    // Step 5: Call OpenAI GPT
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: finalPrompt }],
        temperature,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const gptResponse = response.data.choices[0].message.content;

    res.json({
      success: true,
      query,
      context_sources: similarVectors?.length || 0,
      response: gptResponse,
      sources: similarVectors
        ? similarVectors.map((v) => ({
            heading: v.heading,
            similarity: v.similarity,
          }))
        : [],
    });
  } catch (error) {
    console.error('RAG error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════
 * 3. SMART RECOMMENDATIONS
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * GET /api/vectors/recommend/:nodeId
 * Get recommendations based on node similarity
 */
router.get('/recommend/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { limit = 5, nodeType = null } = req.query;

    // Get the node's vectors
    const { data: nodeVectors, error: vectorError } = await supabase
      .from('node_vector_memory')
      .select('embedding')
      .eq('node_id', nodeId)
      .limit(1);

    if (vectorError || !nodeVectors || nodeVectors.length === 0) {
      return res.status(404).json({ error: 'Node vectors not found' });
    }

    // Use first vector for recommendations
    const nodeEmbedding = nodeVectors[0].embedding;

    // Search for similar vectors (excluding current node)
    const { data: similarVectors, error: searchError } = await supabase.rpc(
      'search_similar_vectors',
      {
        query_embedding: nodeEmbedding,
        match_threshold: 0.6,
        match_count: parseInt(limit) * 2, // Get extra to exclude current node
      }
    );

    if (searchError) {
      return res.status(500).json({ error: searchError.message });
    }

    // Filter out current node and limit
    const recommendations = similarVectors
      .filter((v) => v.node_id !== nodeId)
      .slice(0, limit);

    // Enrich with node details
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const { data: nodeData } = await supabase
          .from('node_core')
          .select('node_id, node_type, node_name, metadata')
          .eq('node_id', rec.node_id)
          .single();

        return {
          node_id: rec.node_id,
          node_name: nodeData?.node_name,
          node_type: nodeData?.node_type,
          similarity_score: rec.similarity,
          heading: rec.heading,
          content_preview: rec.content?.substring(0, 150),
        };
      })
    );

    res.json({
      success: true,
      node_id: nodeId,
      count: enrichedRecommendations.length,
      recommendations: enrichedRecommendations,
    });
  } catch (error) {
    console.error('Recommendation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════
 * 4. AUTO-TAGGING
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * POST /api/vectors/auto-tag
 * Automatically categorize content using semantic similarity
 */
router.post('/auto-tag', async (req, res) => {
  try {
    const { nodeId, content } = req.body;

    if (!nodeId || !content) {
      return res.status(400).json({ error: 'nodeId and content required' });
    }

    // Generate embedding for content
    const embedding = await generateEmbedding(content);

    // Predefined tag vectors (these would be stored in DB)
    const tagDefinitions = {
      personal_story: 'A personal story or autobiography',
      educational: 'Educational content, lectures, learning materials',
      social: 'Social media content, updates, announcements',
      business: 'Business content, products, services, invoices',
      family: 'Family related, genealogy, relationships, events',
      entertainment: 'Entertainment, videos, stories, games',
    };

    // Score each tag by similarity
    const tagScores = {};
    for (const [tag, description] of Object.entries(tagDefinitions)) {
      const tagEmbedding = await generateEmbedding(description);

      // Calculate cosine similarity
      let similarity = 0;
      for (let i = 0; i < embedding.length; i++) {
        similarity += embedding[i] * tagEmbedding[i];
      }

      tagScores[tag] = similarity;
    }

    // Sort tags by relevance
    const sortedTags = Object.entries(tagScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) // Top 3 tags
      .map(([tag, score]) => ({ tag, score }));

    // Update node metadata with tags
    const { data: nodeData } = await supabase
      .from('node_core')
      .select('metadata')
      .eq('node_id', nodeId)
      .single();

    const updatedMetadata = {
      ...nodeData.metadata,
      auto_tags: sortedTags.map((t) => t.tag),
      tag_scores: tagScores,
      tagged_at: new Date().toISOString(),
    };

    await supabase
      .from('node_core')
      .update({ metadata: updatedMetadata })
      .eq('node_id', nodeId);

    res.json({
      success: true,
      node_id: nodeId,
      tags: sortedTags,
      all_scores: tagScores,
    });
  } catch (error) {
    console.error('Auto-tag error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════
 * 5. VECTOR CLUSTERING
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * POST /api/vectors/cluster
 * Group similar vectors into clusters
 */
router.post('/cluster', async (req, res) => {
  try {
    const { brandId, contentType = null, minSimilarity = 0.75 } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: 'brandId required' });
    }

    // Get all vectors for a brand
    let query = supabase
      .from('node_vector_memory')
      .select('vector_id, node_id, embedding, heading, content_type');

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data: vectors, error: vectorError } = await query;

    if (vectorError) {
      return res.status(500).json({ error: vectorError.message });
    }

    if (vectors.length < 2) {
      return res.json({
        success: true,
        clusters: [],
        message: 'Not enough vectors to cluster',
      });
    }

    // Simple clustering: group vectors by similarity
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < vectors.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [vectors[i]];
      visited.add(i);

      for (let j = i + 1; j < vectors.length; j++) {
        if (visited.has(j)) continue;

        // Calculate similarity
        const similarity = calculateCosineSimilarity(
          vectors[i].embedding,
          vectors[j].embedding
        );

        if (similarity >= minSimilarity) {
          cluster.push(vectors[j]);
          visited.add(j);
        }
      }

      if (cluster.length > 0) {
        clusters.push({
          cluster_id: `cluster_${clusters.length}`,
          size: cluster.length,
          heading: cluster[0].heading,
          vectors: cluster.map((v) => ({
            vector_id: v.vector_id,
            node_id: v.node_id,
            heading: v.heading,
          })),
        });
      }
    }

    res.json({
      success: true,
      brand_id: brandId,
      cluster_count: clusters.length,
      clusters,
    });
  } catch (error) {
    console.error('Cluster error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════
 * 6. VECTOR MANAGEMENT
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * GET /api/vectors/node/:nodeId
 * Get all vectors for a node
 */
router.get('/node/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;

    const { data, error } = await supabase
      .from('node_vector_memory')
      .select(
        `
        vector_id,
        node_id,
        content,
        content_type,
        heading,
        sub_heading,
        section,
        metadata,
        created_at
      `
      )
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      node_id: nodeId,
      vector_count: data.length,
      vectors: data,
    });
  } catch (error) {
    console.error('Get vectors error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/vectors/:vectorId
 * Delete a specific vector
 */
router.delete('/:vectorId', async (req, res) => {
  try {
    const { vectorId } = req.params;

    const { error } = await supabase
      .from('node_vector_memory')
      .delete()
      .eq('vector_id', vectorId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Vector deleted',
      vector_id: vectorId,
    });
  } catch (error) {
    console.error('Delete vector error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vectors/stats
 * Get vector storage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('node_vector_memory')
      .select('content_type', { count: 'exact' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Count by type
    const typeStats = {};
    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        typeStats[item.content_type] =
          (typeStats[item.content_type] || 0) + 1;
      });
    }

    res.json({
      success: true,
      total_vectors: data?.length || 0,
      by_type: typeStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ═════════════════════════════════════════════════════════════════
 * UTILITY FUNCTIONS
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Batch embed multiple texts
 */
async function batchEmbed(texts, nodeIds) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i++) {
    try {
      const embedding = await generateEmbedding(texts[i]);
      embeddings.push({
        nodeId: nodeIds[i],
        embedding,
        text: texts[i],
      });
    } catch (error) {
      console.error(`Failed to embed text ${i}:`, error.message);
    }
  }

  return embeddings;
}

module.exports = router;
module.exports.generateEmbedding = generateEmbedding;
module.exports.calculateCosineSimilarity = calculateCosineSimilarity;
module.exports.batchEmbed = batchEmbed;
