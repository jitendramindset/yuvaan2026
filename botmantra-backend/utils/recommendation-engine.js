/**
 * 🎯 SMART RECOMMENDATION ENGINE
 * 
 * Vector-based recommendations for:
 *  • Similar content
 *  • Personalized feeds
 *  • Course suggestions
 *  • People connections
 *  • Product recommendations
 */

const { createClient } = require('@supabase/supabase-js');
const { cosineSimilarity, normalizeVector } = require('./vector-embeddings');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

/**
 * Get personalized content recommendations
 */
async function getContentRecommendations(userId, limit = 10) {
  try {
    // Get user's interaction history (posts they viewed/liked)
    const { data: userVectors } = await supabase
      .from('node_vector_memory')
      .select('embedding')
      .eq('node_id', userId)
      .limit(5);

    if (!userVectors || userVectors.length === 0) {
      // Return trending content if no history
      return await getTrendingContent(limit);
    }

    // Average user's vectors
    let userEmbeddingSum = new Array(1536).fill(0);
    for (const vec of userVectors) {
      for (let i = 0; i < vec.embedding.length; i++) {
        userEmbeddingSum[i] += vec.embedding[i];
      }
    }

    for (let i = 0; i < userEmbeddingSum.length; i++) {
      userEmbeddingSum[i] /= userVectors.length;
    }

    // Find similar content
    const { data: recommendations } = await supabase.rpc(
      'search_similar_vectors',
      {
        query_embedding: userEmbeddingSum,
        match_threshold: 0.6,
        match_count: limit * 2,
      }
    );

    // Filter and enrich
    const enriched = await enrichRecommendations(
      recommendations.slice(0, limit)
    );

    return {
      user_id: userId,
      count: enriched.length,
      recommendations: enriched,
      reason: 'personalized',
    };
  } catch (error) {
    console.error('Content recommendation error:', error.message);
    return { error: error.message };
  }
}

/**
 * Get similar users (for networking)
 */
async function getSimilarUsers(userId, limit = 10) {
  try {
    // Get user's profile vector
    const { data: userVectors } = await supabase
      .from('node_vector_memory')
      .select('embedding')
      .eq('node_id', userId)
      .limit(1);

    if (!userVectors || userVectors.length === 0) {
      return { error: 'User not found' };
    }

    // Find similar user vectors
    const { data: similarVectors } = await supabase.rpc(
      'search_similar_vectors',
      {
        query_embedding: userVectors[0].embedding,
        match_threshold: 0.65,
        match_count: limit * 3,
      }
    );

    // Get unique user nodes (exclude self)
    const userIds = new Set();
    const results = [];

    for (const vec of similarVectors) {
      if (vec.node_id !== userId && !userIds.has(vec.node_id)) {
        userIds.add(vec.node_id);
        results.push(vec);

        if (results.length >= limit) break;
      }
    }

    // Enrich with user details
    const enriched = await Promise.all(
      results.map(async (rec) => {
        const { data: nodeData } = await supabase
          .from('node_core')
          .select('node_id, node_name, metadata')
          .eq('node_id', rec.node_id)
          .eq('node_type', 'user')
          .single();

        return {
          node_id: rec.node_id,
          name: nodeData?.node_name,
          similarity: rec.similarity,
          interests: nodeData?.metadata?.interests || [],
          profession: nodeData?.metadata?.profession,
        };
      })
    );

    return {
      user_id: userId,
      count: enriched.length,
      similar_users: enriched,
    };
  } catch (error) {
    console.error('Similar users error:', error.message);
    return { error: error.message };
  }
}

/**
 * Get course recommendations for student
 */
async function getCourseRecommendations(studentId, limit = 5) {
  try {
    // Get student's interest vectors
    const { data: studentVectors } = await supabase
      .from('node_vector_memory')
      .select('embedding, content_type')
      .eq('node_id', studentId)
      .in('content_type', ['learning_interest', 'completed_course'])
      .limit(5);

    if (!studentVectors || studentVectors.length === 0) {
      // Return popular courses if no history
      return await getPopularCourses(limit);
    }

    // Average student interest vector
    let averageVec = new Array(1536).fill(0);
    for (const vec of studentVectors) {
      for (let i = 0; i < vec.embedding.length; i++) {
        averageVec[i] += vec.embedding[i];
      }
    }

    for (let i = 0; i < averageVec.length; i++) {
      averageVec[i] /= studentVectors.length;
    }

    // Find similar courses
    const { data: courseVectors } = await supabase
      .from('node_vector_memory')
      .select('node_id, content, heading, similarity')
      .rpc('search_similar_vectors', {
        query_embedding: averageVec,
        match_threshold: 0.6,
        match_count: limit * 2,
      });

    // Enrich with course details
    const enriched = await Promise.all(
      courseVectors.slice(0, limit).map(async (vec) => {
        const { data: courseData } = await supabase
          .from('node_core')
          .select('node_id, node_name, metadata')
          .eq('node_id', vec.node_id)
          .eq('node_type', 'course')
          .single();

        return {
          course_id: vec.node_id,
          course_name: courseData?.node_name,
          instructor: courseData?.metadata?.instructor,
          level: courseData?.metadata?.level || 'beginner',
          similarity_score: vec.similarity,
          description: vec.heading,
        };
      })
    );

    return {
      student_id: studentId,
      count: enriched.length,
      recommendations: enriched,
    };
  } catch (error) {
    console.error('Course recommendation error:', error.message);
    return { error: error.message };
  }
}

/**
 * Get product recommendations for customer
 */
async function getProductRecommendations(customerId, limit = 10) {
  try {
    // Get customer's browsing/purchase history
    const { data: customerVectors } = await supabase
      .from('node_vector_memory')
      .select('embedding')
      .eq('node_id', customerId)
      .in('content_type', ['viewed_product', 'purchased_product'])
      .limit(5);

    if (!customerVectors || customerVectors.length === 0) {
      return await getFeaturedProducts(limit);
    }

    // Average customer preference vector
    let customerPref = new Array(1536).fill(0);
    for (const vec of customerVectors) {
      for (let i = 0; i < vec.embedding.length; i++) {
        customerPref[i] += vec.embedding[i];
      }
    }

    for (let i = 0; i < customerPref.length; i++) {
      customerPref[i] /= customerVectors.length;
    }

    // Find similar products
    const { data: productVectors } = await supabase.rpc(
      'search_similar_vectors',
      {
        query_embedding: customerPref,
        match_threshold: 0.6,
        match_count: limit * 2,
      }
    );

    // Enrich with product details
    const enriched = await Promise.all(
      productVectors.slice(0, limit).map(async (vec) => {
        const { data: productData } = await supabase
          .from('node_core')
          .select('node_id, node_name, metadata')
          .eq('node_id', vec.node_id)
          .eq('node_type', 'product')
          .single();

        return {
          product_id: vec.node_id,
          product_name: productData?.node_name,
          price: productData?.metadata?.price,
          category: productData?.metadata?.category,
          rating: productData?.metadata?.rating || 0,
          similarity_score: vec.similarity,
        };
      })
    );

    return {
      customer_id: customerId,
      count: enriched.length,
      recommendations: enriched,
    };
  } catch (error) {
    console.error('Product recommendation error:', error.message);
    return { error: error.message };
  }
}

/**
 * Get trending content (by recency + engagement)
 */
async function getTrendingContent(limit = 10) {
  try {
    const { data: posts } = await supabase
      .from('node_core')
      .select('node_id, node_name, metadata')
      .eq('node_type', 'post')
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false })
      .limit(limit);

    return {
      count: posts.length,
      content: posts.map((p) => ({
        post_id: p.node_id,
        title: p.node_name,
        engagement: p.metadata?.engagement || 0,
        timestamp: p.metadata?.updated_at,
      })),
      reason: 'trending',
    };
  } catch (error) {
    console.error('Trending content error:', error.message);
    return { error: error.message };
  }
}

/**
 * Get popular courses
 */
async function getPopularCourses(limit = 5) {
  try {
    const { data: courses } = await supabase
      .from('node_core')
      .select('node_id, node_name, metadata')
      .eq('node_type', 'course')
      .order('metadata->enrollment_count', { ascending: false })
      .limit(limit);

    return {
      count: courses.length,
      courses: courses.map((c) => ({
        course_id: c.node_id,
        course_name: c.node_name,
        enrollments: c.metadata?.enrollment_count || 0,
        level: c.metadata?.level || 'beginner',
      })),
      reason: 'popular',
    };
  } catch (error) {
    console.error('Popular courses error:', error.message);
    return { error: error.message };
  }
}

/**
 * Get featured products
 */
async function getFeaturedProducts(limit = 10) {
  try {
    const { data: products } = await supabase
      .from('node_core')
      .select('node_id, node_name, metadata')
      .eq('node_type', 'product')
      .eq('metadata->featured', true)
      .limit(limit);

    return {
      count: products.length,
      products: products.map((p) => ({
        product_id: p.node_id,
        product_name: p.node_name,
        price: p.metadata?.price,
        rating: p.metadata?.rating || 0,
      })),
      reason: 'featured',
    };
  } catch (error) {
    console.error('Featured products error:', error.message);
    return { error: error.message };
  }
}

/**
 * Enrich recommendations with metadata
 */
async function enrichRecommendations(vectors) {
  return await Promise.all(
    vectors.map(async (vec) => {
      const { data: nodeData } = await supabase
        .from('node_core')
        .select('node_id, node_type, node_name, metadata')
        .eq('node_id', vec.node_id)
        .single();

      return {
        node_id: vec.node_id,
        node_type: nodeData?.node_type,
        node_name: nodeData?.node_name,
        similarity_score: vec.similarity,
        heading: vec.heading,
        preview: vec.content?.substring(0, 150),
        metadata: nodeData?.metadata,
      };
    })
  );
}

/**
 * Get recommendations for a node type
 */
async function getNodeTypeRecommendations(
  nodeId,
  nodeType,
  limit = 10
) {
  switch (nodeType) {
    case 'user':
      return await getSimilarUsers(nodeId, limit);
    case 'student':
      return await getCourseRecommendations(nodeId, limit);
    case 'customer':
      return await getProductRecommendations(nodeId, limit);
    default:
      return await getContentRecommendations(nodeId, limit);
  }
}

module.exports = {
  getContentRecommendations,
  getSimilarUsers,
  getCourseRecommendations,
  getProductRecommendations,
  getTrendingContent,
  getPopularCourses,
  getFeaturedProducts,
  getNodeTypeRecommendations,
};
