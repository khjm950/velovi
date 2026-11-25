Velovi — current implementation and launch status
================================================

Project
-------
Velovi is an Arabic-first, RTL family-finance PWA with an Android Capacitor
build path. Current development branch: feat/velovi-launch-suite.
Draft pull request: https://github.com/khjm950/velovi/pull/45

Live Supabase project
---------------------
- Project ref: rzxfsfexkduutlekcfwu.
- Existing household and membership records are retained.
- At the latest schema inspection, one household and one active membership
  (administrator) were present. Financial accounts and transactions were empty.
- New planning tables exist and are empty; no test records were retained.
- RLS is enabled on all household, financial, audit, and planning tables.
- Never place a service_role or secret key in browser code.

Existing application functionality
----------------------------------
- Household authentication, onboarding, member invitations, membership
  management, and permission editing.
- Separate permissions for adding, editing, deleting transactions and
  read-only visibility of other members' accounts.
- Members see their own transactions by default; admins can manage household
  financial records.
- Accounts support individual currencies, opening balances (including negative
  balances), and ownership. No silent currency conversion is performed.
- Transactions support income, expense, and transfer records, with account
  ownership and household consistency enforced by composite foreign keys.
- Transaction table includes search by text/amount, date range, type filtering,
  sortable columns, currency-aware net totals, and transaction counts.
- Statement import supports PDF and JPG/PNG, local OCR (German, English,
  Arabic), editable review rows, CSV export, account selection, duplicate
  filtering, and persistence after review.
- Camera capture and QR/barcode reading are available where browser support and
  permissions allow.
- Historical smart forecast uses recent category patterns, weighted estimates
  for variable categories, category exclusions, and a 1–1200 month horizon.
  It now also accounts for active recurring schedules and future-dated
  one-off transactions. Forecasts remain estimates, not guarantees.
- Settings include language, preferred currency, theme, and chart palette.
- PWA service worker cache is currently velovi-shell-v28.

Family planning features added in this branch
---------------------------------------------
- Monthly category budgets with actual-versus-limit progress.
- Personal savings goals and explicitly family-shared savings goals.
- Individual contribution records for shared goals.
- Recurring income/expense templates with weekly, monthly, quarterly, and
  yearly schedules, optional end dates, seven-day in-app reminders, and a manual
  "record due" action. Overdue occurrences advance one at a time, so missed
  periods are not silently skipped.
- Recording a due recurring item and advancing its next due date are performed
  by one database RPC transaction, preventing duplicate creation on retry.
- The four new tables are monthly_budgets, savings_goals,
  savings_goal_contributions, and recurring_entries.
- Three additive migrations have been applied to the live Supabase project:
  family_planning_features, optimize_planning_rls_and_indexes, and
  record_recurring_one_period_at_a_time.
- New planning data is owner/admin scoped by RLS. Only goals explicitly marked
  as family-visible can be read and contributed to by other active members.
- A rollback-only database test passed for budget, goal, contribution, recurring
  entry creation, and due-transaction recording. All test rows were rolled back.
- French and Spanish translations are included for the new planning screens.
  Full translation of every existing application screen remains unfinished.

Android and Google Play
-----------------------
- Android Capacitor build pipeline is present.
- The Android debug APK workflow completed successfully for the current web
  bundle, including source syntax checks, web staging, Android project creation,
  manifest hardening, package identity checks, APK signature verification,
  and artifact upload.
- A manual signed AAB workflow is provided at
  .github/workflows/android-release-aab.yml.
- The AAB workflow requires a private upload keystore and these GitHub Actions
  repository secrets:
    ANDROID_UPLOAD_KEYSTORE_BASE64
    ANDROID_UPLOAD_KEYSTORE_PASSWORD
    ANDROID_UPLOAD_KEY_ALIAS
    ANDROID_UPLOAD_KEY_PASSWORD
- Never commit the keystore or its passwords. Back up the upload key securely
  outside GitHub. The signed AAB workflow cannot run until these secrets exist.
- The debug APK is not the Play Store release package. Google Play requires the
  signed Android App Bundle (AAB) for the release workflow.

Outstanding before public release
---------------------------------
- Finish French and Spanish translation across all existing screens, not only
  the new planning pages.
- Run signed-in browser tests with at least two real household members to verify
  owner-only visibility and the family-shared-goal exception end to end.
- Perform visual testing on Android and iPhone-sized screens.
- Complete Play Console listing, Data safety declarations, privacy policy
  contact/retention details, content rating, and internal testing.
- Create and securely configure the Android upload keystore before generating
  the signed AAB.
- Review Supabase Auth security settings: the security advisor currently warns
  that leaked-password protection is disabled.
- Automatic Open Banking connections and bank synchronization are not enabled;
  provider research and consent flows remain a separate feature.
- Offline shell caching does not imply offline financial writes or sync.

Safety notes
------------
- The applied planning migrations are additive. They did not delete or rewrite
  existing financial records.
- The database test transactions were rolled back; new planning tables remain
  empty until users create real budgets, goals, contributions, and schedules.
- Manual confirmation is required before a recurring template creates a real
  financial transaction.
