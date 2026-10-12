-- ╔════════════════════════════════════════════════════════════════╗
-- ║  NODE_CORE SQL VERIFICATION QUERIES                             ║
-- ║  Run directly in your Supabase/PostgreSQL client                ║
-- ║  Paste into: https://app.supabase.com/project/_.../sql/new      ║
-- ╚════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- QUERY 1: Total node count (should be > 0)
-- ============================================================================
SELECT 
  COUNT(*) as total_nodes,
  COUNT(DISTINCT owner_id) as unique_users,
  COUNT(DISTINCT node_type) as unique_node_types
FROM node_core;

-- Expected Output (after 1+ signup):
-- total_nodes | unique_users | unique_node_types
-- 5+          | 1+           | 5
-- ============================================================================


-- ============================================================================
-- QUERY 2: Nodes per user (each should have 5 complete set)
-- ============================================================================
SELECT 
  owner_id,
  COUNT(*) as node_count,
  COUNT(DISTINCT node_type) as node_type_count,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM node_core
GROUP BY owner_id
ORDER BY created_at DESC;

-- Expected Output (for each user):
-- owner_id | node_count | node_type_count | first_created | last_updated
-- {uuid}   | 5          | 5               | {timestamp}   | {timestamp}
-- ============================================================================


-- ============================================================================
-- QUERY 3: Node types distribution
-- ============================================================================
SELECT 
  node_type,
  COUNT(*) as count,
  COUNT(DISTINCT owner_id) as users_with_type
FROM node_core
GROUP BY node_type
ORDER BY count DESC;

-- Expected Output (if all 5 types created):
-- node_type           | count | users_with_type
-- user                | 1+    | 1+
-- vector_memory       | 1+    | 1+
-- relationship_map    | 1+    | 1+
-- layout_schema       | 1+    | 1+
-- permission_set      | 1+    | 1+
-- ============================================================================


-- ============================================================================
-- QUERY 4: Brand root distribution by user
-- ============================================================================
SELECT DISTINCT ON (owner_id)
  owner_id,
  brand_root,
  COUNT(*) OVER (PARTITION BY brand_root) as users_with_brand
FROM node_core
ORDER BY owner_id, node_type;

-- Expected Output:
-- owner_id | brand_root    | users_with_brand
-- {uuid1}  | jeetmantra    | 1+ (age 10-17)
-- {uuid2}  | mantravat     | 1+ (age 18-65)
-- {uuid3}  | junior_mantra | 1+ (age < 10)
-- {uuid4}  | vanshawali    | 1+ (age 65+ or default)
-- ============================================================================


-- ============================================================================
-- QUERY 5: Sample user with all nodes
-- ============================================================================
SELECT 
  owner_id,
  nid_hash,
  node_type,
  node_state,
  brand_root,
  karma_score,
  trust_score,
  parent_nid_hash,
  created_at
FROM node_core
WHERE owner_id = (SELECT owner_id FROM node_core LIMIT 1)
ORDER BY node_type;

-- Expected Output (5 rows, one per type):
-- owner_id | nid_hash | node_type | node_state | brand_root | karma | trust | parent_nid | created_at
-- {uuid}   | {hash}   | user      | ACTIVE     | {brand}    | 0     | 50    | NULL      | {time}
-- {uuid}   | {hash2}  | vector_.. | ACTIVE     | {brand}    | 0     | 50    | {parent}  | {time}
-- {uuid}   | {hash3}  | relation..| ACTIVE     | {brand}    | 0     | 50    | {parent}  | {time}
-- {uuid}   | {hash4}  | layout_.. | ACTIVE     | {brand}    | 0     | 50    | {parent}  | {time}
-- {uuid}   | {hash5}  | permiss.. | ACTIVE     | {brand}    | 0     | 50    | {parent}  | {time}
-- ============================================================================


-- ============================================================================
-- QUERY 6: Check brand_root consistency within a user
-- ============================================================================
SELECT 
  owner_id,
  COUNT(DISTINCT brand_root) as distinct_brands,
  STRING_AGG(DISTINCT brand_root, ', ') as brands_list
FROM node_core
GROUP BY owner_id
HAVING COUNT(DISTINCT brand_root) > 1;

-- Expected Output (should be EMPTY - all nodes from same user have same brand):
-- (no rows returned = good!)
-- ============================================================================


-- ============================================================================
-- QUERY 7: Verify nid_hash uniqueness
-- ============================================================================
SELECT 
  nid_hash,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(owner_id) as owners
FROM node_core
GROUP BY nid_hash
HAVING COUNT(*) > 1;

-- Expected Output (should be EMPTY - all nid_hash are unique):
-- (no rows returned = good!)
-- ============================================================================


-- ============================================================================
-- QUERY 8: Check blob fields (dna_blob, field_map, perm_blob, memory_blob)
-- ============================================================================
SELECT 
  owner_id,
  node_type,
  dna_blob IS NOT NULL as has_dna,
  field_map IS NOT NULL as has_field_map,
  perm_blob IS NOT NULL as has_perm,
  memory_blob IS NOT NULL as has_memory,
  ARRAY[
    CASE WHEN dna_blob IS NOT NULL THEN 'dna' END,
    CASE WHEN field_map IS NOT NULL THEN 'field_map' END,
    CASE WHEN perm_blob IS NOT NULL THEN 'perm' END,
    CASE WHEN memory_blob IS NOT NULL THEN 'memory' END
  ] FILTER (WHERE 1=1) as blobs_present
FROM node_core
WHERE owner_id = (SELECT owner_id FROM node_core LIMIT 1)
ORDER BY node_type;

-- Expected Output:
-- owner_id | node_type | has_dna | has_field_map | has_perm | has_memory | blobs_present
-- {uuid}   | user      | true    | true          | true     | false      | {dna,field_map,perm}
-- {uuid}   | vector_.. | true    | true          | false    | true       | {dna,field_map,memory}
-- (etc)
-- ============================================================================


-- ============================================================================
-- QUERY 9: Recovery indicator (nodes created in last N hours)
-- ============================================================================
SELECT 
  owner_id,
  COUNT(*) as nodes_created_recently,
  COUNT(DISTINCT node_type) as node_types,
  MIN(created_at) as first_node_time,
  MAX(updated_at) as last_update_time,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))::INTEGER as creation_span_seconds
FROM node_core
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY owner_id
ORDER BY created_at DESC;

-- Expected if recovery triggered:
-- owner_id | nodes_created_recently | node_types | first_node_time | last_update_time | creation_span_seconds
-- {uuid}   | 5                      | 5          | {time1}         | {time2}          | 2-10 (nodes created quickly)
-- 
-- Interpretation:
--   - 0 rows = no recent activity (normal after initial signup)
--   - 5 nodes with span < 10 sec = normal signup
--   - 5 nodes with span > 1 sec = possible recovery
--   - Less than 5 nodes = incomplete recovery
-- ============================================================================


-- ============================================================================
-- QUERY 10: All node_state values validation
-- ============================================================================
SELECT DISTINCT 
  node_state,
  COUNT(*) as count
FROM node_core
GROUP BY node_state;

-- Expected Output:
-- node_state | count
-- ACTIVE     | {all or most}
-- 
-- If you see other states (INACTIVE, DELETED, etc), they might be from
-- previous tests or should be investigated
-- ============================================================================


-- ============================================================================
-- QUERY 11: Timestamp checks (created_at <= updated_at)
-- ============================================================================
SELECT 
  owner_id,
  node_type,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at))::INTEGER as age_seconds,
  CASE 
    WHEN updated_at < created_at THEN 'ERROR'
    WHEN updated_at = created_at THEN 'FRESH'
    ELSE 'UPDATED'
  END as status
FROM node_core
WHERE owner_id = (SELECT owner_id FROM node_core LIMIT 1)
ORDER BY node_type;

-- Expected Output:
-- owner_id | node_type | created_at | updated_at | age_seconds | status
-- {uuid}   | user      | {time}     | {time}     | 0           | FRESH
-- {uuid}   | vector_.. | {time}     | {time}     | 0-30        | FRESH/UPDATED
-- ============================================================================


-- ============================================================================
-- QUERY 12: Permissions blob structure check
-- ============================================================================
SELECT 
  owner_id,
  node_type,
  CASE 
    WHEN node_type = 'permission_set' THEN 'Has permission data'
    WHEN perm_blob IS NOT NULL THEN 'Has perm_blob'
    ELSE 'No permissions'
  END as perm_status,
  perm_blob::text as perm_content
FROM node_core
WHERE owner_id = (SELECT owner_id FROM node_core LIMIT 1)
AND (node_type = 'permission_set' OR perm_blob IS NOT NULL);

-- Expected Output:
-- At least one row with permission data (either in permission_set node or perm_blob)
-- ============================================================================


-- ============================================================================
-- QUERY 13: Cache/index efficiency check
-- ============================================================================
EXPLAIN ANALYZE
SELECT * 
FROM node_core 
WHERE owner_id = '{PASTE_USER_UUID_HERE}'::uuid
LIMIT 10;

-- Expected: Index scan on owner_id (not sequential scan)
-- ============================================================================


-- ============================================================================
-- QUERY 14: Recent logins/executions (activity)
-- ============================================================================
SELECT 
  owner_id,
  DATE(updated_at) as activity_date,
  COUNT(*) as updates_today,
  MIN(updated_at) as first_update,
  MAX(updated_at) as last_update
FROM node_core
WHERE updated_at > NOW() - INTERVAL '7 days'
GROUP BY owner_id, DATE(updated_at)
ORDER BY activity_date DESC, owner_id;

-- Expected Output (after tests):
-- owner_id | activity_date | updates_today | first_update | last_update
-- {uuid}   | 2026-02-14    | 1-10+         | {time}       | {time}
-- ============================================================================


-- ============================================================================
-- QUERY 15: Data integrity summary
-- ============================================================================
WITH node_stats AS (
  SELECT
    COUNT(*) as total_nodes,
    COUNT(DISTINCT owner_id) as unique_users,
    COUNT(DISTINCT node_type) as unique_types,
    COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as missing_owner_id,
    COUNT(CASE WHEN nid_hash IS NULL THEN 1 END) as missing_nid_hash,
    COUNT(CASE WHEN node_state != 'ACTIVE' THEN 1 END) as non_active,
    COUNT(CASE WHEN brand_root IS NULL THEN 1 END) as missing_brand,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as missing_created_at,
    COUNT(CASE WHEN updated_at IS NULL THEN 1 END) as missing_updated_at
  FROM node_core
)
SELECT
  total_nodes,
  unique_users,
  unique_types,
  CASE 
    WHEN missing_owner_id = 0 AND missing_nid_hash = 0 AND missing_brand = 0 AND missing_created_at = 0
    THEN '✅ ALL CHECKS PASSED'
    ELSE '❌ DATA ISSUES FOUND'
  END as integrity_status,
  missing_owner_id,
  missing_nid_hash,
  non_active,
  missing_brand,
  missing_created_at,
  missing_updated_at
FROM node_stats;

-- Expected Output:
-- total_nodes | unique_users | unique_types | integrity_status | missing_owner_id | missing_nid_hash | non_active | missing_brand | missing_created_at | missing_updated_at
-- 5+          | 1+           | 5            | ✅ ALL CHECKS... | 0                | 0                | 0          | 0             | 0                  | 0
-- ============================================================================


-- ============================================================================
-- OPTIONAL: Clean up test data
-- ============================================================================
-- WARNING: Only run if you want to delete test data!
-- DELETE FROM node_core WHERE owner_id IN (
--   SELECT id FROM users WHERE email LIKE 'test-%@botmantra.com'
-- );
-- ============================================================================
