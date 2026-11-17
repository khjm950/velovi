Velovi — implementation status
==============================

Project
-------
Arabic-first, RTL family-finance PWA. Current working branch:
`feat/permissions-import-settings-restoration`. Do not merge to main until
browser end-to-end tests have been completed.

Live Supabase project
---------------------
- Project: Velovi (`rzxfsfexkduutlekcfwu`), eu-central-1, PostgreSQL 17.
- A live household exists with two active members: one administrator and one
  member. The member sees only their own membership row by default.
- Current financial account and transaction tables are empty; no financial
  records have been created yet.
- RLS is enabled on households, household_members, financial_accounts,
  financial_transactions, and audit_log.
- The Data API browser client uses the publishable key in
  `supabase-config.js`. Never place a service_role or secret key in browser
  code or send it in chat.

Implemented in this branch
--------------------------
- Household sign-in, household onboarding, member management, and permission
  editing through Supabase Auth and RPC functions.
- Separate read-only permission to view other members' account records.
  This does not grant access to their transaction history.
- Reactivation trigger resets all member permissions to the agreed defaults:
  add=true, edit=true, delete=false, view-other-accounts=false.
- RLS helper functions moved to a non-exposed `private` schema. Public helper
  RPC execution was revoked from anon and authenticated; the policies use the
  private helpers. The remaining public SECURITY DEFINER RPCs perform explicit
  authentication/admin checks.
- Account create/edit/archive UI backed by `financial_accounts`.
- Transaction create/edit/delete UI backed by `financial_transactions`,
  respecting member add/edit/delete permissions and account ownership.
- Account balances calculated from opening balances and recorded income/expense
  transactions. Negative opening balances are supported.
- Account-specific ISO currency is stored on accounts and transactions.
  Dashboard and transaction totals are grouped by currency; no silent FX
  conversion is performed.
- Import preview for PDF and JPG/PNG with local OCR (German, English, Arabic),
  editable rows, CSV export, account selection, duplicate filtering, and
  persistence into the selected account.
- Camera capture for statement photos and QR/barcode scanning where the browser
  supports the BarcodeDetector API and camera access.
- Historical-data forecast: analyzes the prior six completed months, detects
  regular categories using median values, uses weighted estimates for variable
  categories, supports excluding categories, and offers a 1–1200 month horizon.
  It displays a confidence indicator and historical volatility.
- Existing manual scenario calculator retained separately.
- Dashboard cards navigate to their respective sections. More menu closes on
  navigation.
- Transaction search by text and amount, date range, type filter, sortable
  columns, currency-separated net total, and transaction count.
- Settings for language, currency preference, theme, and independent chart
  palette. Currency preference is a default/display preference, not an FX
  conversion engine.
- PWA cache bumped to v9 so installed devices fetch the new application shell.

Important limitations
---------------------
- No financial data has been inserted into the live project yet. The new
  account/transaction forms must be tested from a signed-in browser session
  before the application is treated as ready for real household finances.
- Account visibility for a non-admin member is read-only. When viewing another
  member's account, the UI shows the opening balance only because transaction
  history remains private.
- Smart forecasting is a statistical heuristic based on available history,
  not an AI financial adviser. Sparse history lowers its confidence.
- The expense chart now uses actual transaction aggregates, selected time
  period, and the independent chart palette.
- Full translation of every UI string is not complete; the language preference
  currently stores the selected language and sets document direction.
- QR/barcode scanning reads a code and places it into the transaction
  description if empty; it does not automatically interpret every invoice or
  payment QR standard.
- Automatic Open Banking connections, bank-provider cost comparison, and
  bank synchronization are not implemented.
- Backups, recovery testing, and a production security review remain required.

Database migrations / SQL references
------------------------------------
- `SUPABASE_MEMBER_ACCOUNT_VISIBILITY.sql`: account visibility policy.
- `SUPABASE_FINANCIAL_SCHEMA_QUERY.sql`: catalog query for exact ordered
  composite foreign keys and schema inspection.
- `SUPABASE_RESET_MEMBER_PERMISSIONS_ON_REACTIVATION.sql`: live trigger
  function reset for all four permission defaults.
- `SUPABASE_HARDEN_RLS_HELPERS.sql`: private-schema RLS helpers and policy
  rewrites.
- `SUPABASE_MOVE_HOUSEHOLD_RPCS_TO_PRIVATE.sql`: moves privileged household
  operations into the non-exposed schema and leaves SECURITY INVOKER public
  RPC wrappers. All these changes were applied to the live project and tested
  with simulated admin/member JWT contexts.

Privacy model
-------------
- Members see their own transactions by default.
- Admins can see and manage all household financial records.
- Other-account visibility is a separate read-only permission for accounts.
- Transaction permissions remain separate: add, edit, and delete.
- Financial transactions must belong to the selected account's owner and
  household; database composite foreign keys enforce this.

PWA
---
- Serve over HTTPS (or localhost during development).
- The service worker caches the app shell and falls back to it when offline.
- Offline shell availability does not mean financial-data writes or sync are
  available offline.
