-- Correct, table-safe schema inspection for Velovi.
-- Uses pg_constraint so composite foreign keys are returned once per real constraint,
-- with their exact ordered column pairs (no accidental cross-table joins).

SELECT
  c.conrelid::regclass AS source_table,
  c.conname AS constraint_name,
  c.confrelid::regclass AS target_table,
  pg_get_constraintdef(c.oid) AS definition,
  c.convalidated AS validated
FROM pg_constraint AS c
WHERE c.contype = 'f'
  AND c.conrelid IN (
    'public.financial_accounts'::regclass,
    'public.financial_transactions'::regclass
  )
ORDER BY source_table::text, c.conname;

SELECT
  table_name, ordinal_position, column_name, data_type,
  is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'household_members', 'financial_accounts', 'financial_transactions'
  )
ORDER BY table_name, ordinal_position;

-- Show the exact write/read policies separately.
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'household_members', 'financial_accounts', 'financial_transactions'
  )
ORDER BY tablename, cmd, policyname;
