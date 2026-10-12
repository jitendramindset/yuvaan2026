-- Schema introspection (run in Supabase SQL editor)
-- 1) Tables + columns
select
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema in ('public')
order by c.table_schema, c.table_name, c.ordinal_position;

-- 2) Indexes
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname in ('public')
order by schemaname, tablename, indexname;

-- 3) Constraints
select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
from information_schema.table_constraints tc
where tc.table_schema in ('public')
order by tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name;

-- 4) Foreign keys detail
select
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema in ('public')
order by tc.table_schema, tc.table_name, tc.constraint_name;
