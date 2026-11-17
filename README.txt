Velovi — current implementation status
======================================

Project
-------
Velovi is an Arabic-first, RTL family-finance PWA. The current working branch is
`feat/permissions-import-settings-restoration`. Changes are kept off `main`
until database integration and end-to-end checks are complete.

Implemented in the current branch
---------------------------------
- Responsive PWA shell and navigation, including closing the mobile More menu
  when navigating to another section.
- Dashboard cards navigate to the corresponding income, expense, report, or
  account section.
- Transaction list controls: text and numeric amount search, type filter,
  optional from/to date range, sortable columns, filtered net total, and
  filtered transaction count. Internal transfers are excluded from income/
  expense net totals.
- Negative current balances and sign-toggle controls for the forecast balance
  and monthly surplus inputs.
- Language, ISO currency, app theme, chart type/period, and an independent
  chart color palette in Settings. Currency display is not stored as a symbol;
  ILS is not offered in the currency selector.
- Supabase Auth household onboarding and member administration through RPCs.
- Member permissions for adding, editing, deleting transactions, and a
  separate read-only permission to view other members' account records.
- SQL migration for account visibility. Reactivating a member resets the
  permissions to the agreed defaults: add=true, edit=true, delete=false,
  view-other-accounts=false.
- Local statement extraction preview for PDF and JPG/PNG. PDF text is extracted
  directly where available; scanned pages and images use OCR (German, English,
  Arabic). Extracted rows can be reviewed/edited and exported to CSV. The source
  file is processed in the browser and is not uploaded by this import flow.

Not yet complete — do not treat as production-ready
---------------------------------------------------
- Financial account CRUD and durable transaction CRUD/synchronization through
  Supabase. The UI's demo transactions and balances are still illustrative;
  new demo transactions do not persist after refresh.
- The import-to-transactions save action. It remains disabled until the exact
  financial_transactions schema and foreign-key relationships are verified
  and the write path is connected to the correct account/member.
- Smart forecasting from categorized historical transactions, recurring
  patterns, and user-selected exclusions. The current calculator is still a
  simple hypothetical balance/monthly-surplus projection and is not the agreed
  intelligent forecast.
- Camera capture, receipt/QR/barcode scanning, and automatic bank/Open Banking
  connections. Bank-provider costs and coverage must be evaluated before
  choosing a provider.
- Security review, real-data privacy testing, backup/recovery, and an
  encryption design suitable for real family financial data.

Database notes
--------------
- Supabase project URL and browser publishable key are configured in
  `supabase-config.js`. Never place a service_role or secret key in browser
  code or send it in chat.
- RLS is enabled for households, household_members, financial_accounts,
  financial_transactions, and audit_log.
- The account-visibility migration is in
  `SUPABASE_MEMBER_ACCOUNT_VISIBILITY.sql`.
- The financial schema inspection query is in
  `SUPABASE_FINANCIAL_SCHEMA_QUERY.sql`. It uses PostgreSQL catalog metadata
  and ordinality to report composite foreign keys accurately. The earlier
  information_schema join was incorrect because it could match constraints
  sharing names across tables.
- Before connecting financial CRUD/import writes, verify the exact columns,
  keys, RLS policies, and RPCs directly against the live Supabase project.

Agreed product behavior
-----------------------
- A member sees their own financial data by default; the household admin can
  see and manage the household. Viewing other members' accounts is a separate
  optional read-only permission and does not grant access to their transactions.
- Currency is selected per user and displayed consistently across the app.
- Transaction columns are: type, category, description, date, amount. There is
  no sequence-number column. The filtered net and count are shown above the
  list; date range filters are blank by default.
- Forecast horizon is user-selectable and not capped at the original 120-month
  idea; the agreed forecast should use real transaction history and allow
  excluding selected items.
- Android and iPhone use the same cloud household data once financial
  persistence is implemented and verified.

PWA
---
- Serve over HTTPS (or localhost during development).
- The service worker caches the app shell and prefers network updates, with a
  cached-shell fallback when offline.
- Offline shell availability does not imply offline financial-data sync.
