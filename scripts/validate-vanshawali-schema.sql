-- Read-only validation for the current NodeOS family MVP.
-- Validate only the active runtime target: node_core and node_relationships.

SELECT 'node_core' AS object_name,
       EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'node_core'
       ) AS exists;

SELECT 'node_relationships' AS object_name,
       EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'node_relationships'
       ) AS exists;

SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('node_core', 'node_relationships')
ORDER BY tablename, indexname;

SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN ('get_node_full', 'search_similar_vectors');

SELECT relname, relrowsecurity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN ('node_core', 'node_relationships');
