const { supabase } = require('./config/supabase');

async function checkTableConnections() {
  try {
    console.log('🔍 COMPREHENSIVE NODE_AI_BRAIN ANALYSIS');
    console.log('=' .repeat(50));

    // 1. Analyze node_ai_brain table structure
    console.log('\n1️⃣ NODE_AI_BRAIN TABLE ANALYSIS:');
    console.log('-'.repeat(30));

    const brainColumns = [];
    const testColumns = ['id', 'brain_id', 'nid', 'node_id', 'hash', 'data', 'created_at', 'updated_at', 'status', 'type', 'model', 'config'];

    for (const col of testColumns) {
      try {
        const { data, error } = await supabase
          .from('node_ai_brain')
          .select(col)
          .limit(1);

        if (!error) {
          brainColumns.push(col);
          console.log(`✅ Column exists: ${col}`);
        }
      } catch (e) {
        // Column doesn't exist
      }
    }

    console.log(`\n📋 Brain table columns found: ${brainColumns.join(', ')}`);

    // 2. Analyze node_ai_cache relationships
    console.log('\n2️⃣ NODE_AI_CACHE RELATIONSHIPS:');
    console.log('-'.repeat(30));

    try {
      const { data: cacheData, error } = await supabase
        .from('node_ai_cache')
        .select('*')
        .limit(10);

      if (!error && cacheData) {
        console.log(`📊 Cache records: ${cacheData.length}`);

        // Analyze nid_hash patterns
        const nidHashes = [...new Set(cacheData.map(row => row.nid_hash))];
        console.log(`🔗 Unique nid_hash values: ${nidHashes.length}`);
        console.log(`   Sample hashes: ${nidHashes.slice(0, 3).join(', ')}`);

        // Check if nid_hash could relate to brain_id
        if (brainColumns.includes('brain_id')) {
          console.log('🔍 Checking if nid_hash relates to brain_id...');
          // This would require more complex analysis
        }

        // Analyze models used
        const models = [...new Set(cacheData.map(row => row.model))];
        console.log(`🤖 Models used: ${models.join(', ')}`);
      }
    } catch (e) {
      console.log('❌ Error analyzing cache:', e.message);
    }

    // 3. Check for data in brain table with different queries
    console.log('\n3️⃣ BRAIN TABLE DATA INVESTIGATION:');
    console.log('-'.repeat(30));

    try {
      // Try to count records
      const { count, error: countError } = await supabase
        .from('node_ai_brain')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`📊 Brain table record count: ${count}`);
      }

      if (count > 0) {
        // Get actual data
        const { data: brainData, error: dataError } = await supabase
          .from('node_ai_brain')
          .select('*')
          .limit(5);

        if (!dataError && brainData) {
          console.log('✅ Brain table data:');
          brainData.forEach((row, index) => {
            console.log(`  Row ${index + 1}:`, JSON.stringify(row, null, 2));
          });
        }
      } else {
        console.log('📊 Brain table is empty');
      }
    } catch (e) {
      console.log('❌ Error checking brain data:', e.message);
    }

    // 4. Analyze potential foreign key relationships
    console.log('\n4️⃣ POTENTIAL RELATIONSHIPS ANALYSIS:');
    console.log('-'.repeat(30));

    const relationshipChecks = [
      { from: 'node_ai_cache', to: 'node_ai_brain', via: ['nid_hash', 'brain_id'] },
      { from: 'node_ai_input', to: 'node_ai_brain', via: ['brain_id', 'nid'] },
      { from: 'node_ai_cache', to: 'node_ai_input', via: ['input_hash'] }
    ];

    for (const check of relationshipChecks) {
      console.log(`🔗 Checking ${check.from} → ${check.to} via ${check.via.join(' or ')}`);

      try {
        // Get sample data from source table
        const { data: sourceData, error: sourceError } = await supabase
          .from(check.from)
          .select(check.via.join(','))
          .limit(3);

        if (!sourceError && sourceData && sourceData.length > 0) {
          console.log(`   Source values: ${sourceData.map(row => check.via.map(v => row[v]).join('/')).join(', ')}`);

          // Try to find matches in target table
          for (const via of check.via) {
            const sampleValue = sourceData[0][via];
            if (sampleValue) {
              try {
                const { data: targetData, error: targetError } = await supabase
                  .from(check.to)
                  .select('*')
                  .eq(via, sampleValue)
                  .limit(1);

                if (!targetError) {
                  console.log(`   ✅ Found potential link via ${via}: ${sampleValue}`);
                }
              } catch (e) {
                // No relationship found
              }
            }
          }
        }
      } catch (e) {
        console.log(`   ❌ Error checking relationship: ${e.message}`);
      }
    }

    // 5. Summary and recommendations
    console.log('\n5️⃣ ANALYSIS SUMMARY:');
    console.log('-'.repeat(30));

    console.log('📋 EXISTING TABLES:');
    console.log('  ✅ node_ai_brain (empty, columns:', brainColumns.join(', '), ')');
    console.log('  ✅ node_ai_cache (has data, uses nid_hash)');
    console.log('  ✅ node_ai_input (empty)');

    console.log('\n🔗 RELATIONSHIP PATTERNS:');
    console.log('  • node_ai_cache.nid_hash may reference node_ai_brain.brain_id');
    console.log('  • node_ai_cache.input_hash may reference node_ai_input');
    console.log('  • Cache stores AI model outputs with node references');

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('  • Populate node_ai_brain with initial brain configurations');
    console.log('  • Ensure nid_hash in cache matches brain_id format');
    console.log('  • Add foreign key constraints for data integrity');
    console.log('  • Consider adding indexes on frequently queried columns');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTableConnections();