-- Run after the member-visibility migration to inspect exact financial table structure.
SELECT table_name, ordinal_position, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('financial_accounts','financial_transactions')
ORDER BY table_name, ordinal_position;

SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name, tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
 ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema
JOIN information_schema.constraint_column_usage ccu
 ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.constraint_schema
WHERE tc.constraint_schema='public'
 AND tc.table_name IN ('financial_accounts','financial_transactions')
 AND tc.constraint_type='FOREIGN KEY'
ORDER BY tc.table_name,kcu.ordinal_position;
