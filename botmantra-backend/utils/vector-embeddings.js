/**
 * 🧠 VECTOR EMBEDDING UTILITIES
 * 
 * Helper functions for embeddings, caching, and vector operations
 */

const axios = require('axios');
const crypto = require('crypto');

// Simple in-memory cache for embeddings (in production, use Redis)
const embeddingCache = new Map();

/**
 * Generate embedding with caching
 */
async function getOrGenerateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  // Hash text for cache key
  const cacheKey = crypto
    .createHash('md5')
    .update(text.substring(0, 8191))
    .digest('hex');

  // Check cache first
  if (embeddingCache.has(cacheKey)) {
    return {
      embedding: embeddingCache.get(cacheKey),
      cached: true,
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Generate new embedding
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text.substring(0, 8191),
        model: 'text-embedding-3-small',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const embedding = response.data.data[0].embedding;

    // Cache it
    embeddingCache.set(cacheKey, embedding);

    return {
      embedding,
      cached: false,
      dimensions: embedding.length,
    };
  } catch (error) {
    console.error('OpenAI error:', error.response?.data || error.message);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity
 */
function cosineSimilarity(vecA, vecB) {
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
 * Calculate Euclidean distance
 */
function euclideanDistance(vecA, vecB) {
  let sumSquares = 0;

  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sumSquares += diff * diff;
  }

  return Math.sqrt(sumSquares);
}

/**
 * Batch embed texts with rate limiting
 */
async function batchEmbedWithRateLimit(texts, delayMs = 100) {
  const results = [];

  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await getOrGenerateEmbedding(texts[i]);
      results.push({
        text: texts[i],
        embedding: result.embedding,
        cached: result.cached,
      });

      // Rate limit
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Batch embed error for text ${i}:`, error.message);
      results.push({
        text: texts[i],
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Find top-k similar vectors
 */
function findTopKSimilar(queryVec, vectorSet, k = 10, threshold = 0) {
  const similarities = vectorSet.map((item, idx) => ({
    idx,
    ...item,
    similarity: cosineSimilarity(queryVec, item.embedding),
  }));

  return similarities
    .filter((s) => s.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/**
 * Extract important sentences for RAG context
 */
function extractImportantSentences(text, count = 3) {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length <= count) {
    return sentences;
  }

  // Simple heuristic: take first, middle, and last
  const result = [sentences[0]];

  if (count > 1) {
    const middle = Math.floor(sentences.length / 2);
    result.push(sentences[middle]);
  }

  if (count > 2) {
    result.push(sentences[sentences.length - 1]);
  }

  return result.slice(0, count);
}

/**
 * Build RAG context from vectors
 */
function buildRAGContext(vectors, maxLength = 2000) {
  let context = '';
  let currentLength = 0;

  for (const vector of vectors) {
    const section = `[${vector.heading || 'Section'}]\n${vector.content}\n\n`;

    if (currentLength + section.length <= maxLength) {
      context += section;
      currentLength += section.length;
    } else {
      break;
    }
  }

  return context;
}

/**
 * Vector cache management
 */
function clearEmbeddingCache() {
  const size = embeddingCache.size;
  embeddingCache.clear();
  return { cleared: true, count: size };
}

function getCacheStats() {
  return {
    total_cached: embeddingCache.size,
    cache_size_estimate: embeddingCache.size * 6144, // ~1536 dimensions * 4 bytes
  };
}

/**
 * Normalize vector to unit length
 */
function normalizeVector(vec) {
  let magnitude = 0;

  for (const val of vec) {
    magnitude += val * val;
  }

  magnitude = Math.sqrt(magnitude);

  if (magnitude === 0) {
    return vec;
  }

  return vec.map((val) => val / magnitude);
}

/**
 * Average multiple vectors
 */
function averageVectors(vectors) {
  if (!vectors || vectors.length === 0) {
    return null;
  }

  const dimensions = vectors[0].length;
  const average = new Array(dimensions).fill(0);

  for (const vec of vectors) {
    for (let i = 0; i < dimensions; i++) {
      average[i] += vec[i];
    }
  }

  for (let i = 0; i < dimensions; i++) {
    average[i] /= vectors.length;
  }

  return average;
}

/**
 * Create vector metadata
 */
function createVectorMetadata(options = {}) {
  return {
    generated_at: new Date().toISOString(),
    model: 'text-embedding-3-small',
    dimensions: 1536,
    ...options,
  };
}

module.exports = {
  getOrGenerateEmbedding,
  cosineSimilarity,
  euclideanDistance,
  batchEmbedWithRateLimit,
  findTopKSimilar,
  extractImportantSentences,
  buildRAGContext,
  clearEmbeddingCache,
  getCacheStats,
  normalizeVector,
  averageVectors,
  createVectorMetadata,
};
