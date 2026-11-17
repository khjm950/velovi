-- Velovi: accurate financial schema inspection.
-- This query intentionally uses pg_constraint and array ordinality so composite
-- foreign keys are reported once per real column pair, without cross-joining
-- unrelated constraints that happen to share a name.

-- 1) Exact columns and defaults.
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('financial_accounts', 'financial_transactions')
ORDER BY table_name, ordinal_position;

-- 2) Exact foreign-key column pairs, including composite-key order.
SELECT
  c.conrelid::regclass::text AS table_name,
  c.conname AS constraint_name,
  src.ord AS key_position,
  src_col.attname AS column_name,
  c.confrelid::regclass::text AS foreign_table_name,
  dst_col.attname AS foreign_column_name,
  pg_catalog.pg_get_constraintdef(c.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint AS c
CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS src(attnum, ord)
JOIN LATERAL unnest(c.confkey) WITH ORDINALITY AS dst(attnum, ord)
  ON dst.ord = src.ord
JOIN pg_catalog.pg_attribute AS src_col
  ON src_col.attrelid = c.conrelid
 AND src_col.attnum = src.attnum
JOIN pg_catalog.pg_attribute AS dst_col
  ON dst_col.attrelid = c.confrelid
 AND dst_col.attnum = dst.attnum
WHERE c.contype = 'f'
  AND c.connamespace = 'public'::regnamespace
  AND c.conrelid IN (
    'public.financial_accounts'::regclass,
    'public.financial_transactions'::regclass
  )
ORDER BY table_name, constraint_name, key_position;

-- 3) Primary/unique constraints, useful for confirming the account/member keys.
SELECT
  c.conrelid::regclass::text AS table_name,
  c.conname AS constraint_name,
  CASE c.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    ELSE c.contype::text
  END AS constraint_type,
  pg_catalog.pg_get_constraintdef(c.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint AS c
WHERE c.contype IN ('p', 'u')
  AND c.connamespace = 'public'::regnamespace
  AND c.conrelid IN (
    'public.financial_accounts'::regclass,
    'public.financial_transactions'::regclass
  )
ORDER BY table_name, constraint_type, constraint_name;
