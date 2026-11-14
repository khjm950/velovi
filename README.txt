Velovi — prototype status
========================

This repository currently contains an Arabic-first, front-end PWA prototype.

What works in this prototype:
- Navigation between the interface sections.
- Add a temporary income or expense row in the current page session.
- Search, type filtering, date-range filtering, sortable transaction columns, visible-row count and net total.
- A standalone hypothetical balance calculator.
- PWA install prompt where supported and offline shell fallback after the first successful load.

What is NOT implemented:
- User accounts, authentication, household membership or real permissions.
- Supabase/PostgreSQL connection, financial data persistence, device synchronization or backup.
- Actual bank statement parsing/import, Open Banking or bank synchronization.
- Receipt OCR, QR/barcode processing, intelligent forecasting or account CRUD.
- Encryption architecture and security testing for real financial records.

Important:
- All balances, accounts and sample transactions shown are illustrative demo values.
- Newly added transactions exist only in page memory and disappear on refresh.
- The file picker only selects a local file name; it does not read or upload its contents.
- Do not enter real financial information, bank credentials, passwords or OTPs.

PWA:
- Serve the repository over HTTPS (or localhost during development).
- The service worker caches the app shell and prefers network updates, using the cached shell when offline.

Suggested next engineering phases:
1. Review and document the existing Supabase schema and policies separately from this UI prototype.
2. Design authentication, household membership, permissions and row-level security; test policies before connecting the UI.
3. Define the financial transaction model, including internal transfers and currencies.
4. Implement secure persistence and synchronization, with a reviewed encryption and recovery design.
5. Add validated statement import, then receipt OCR and QR/barcode capture.
6. Build forecasts from categorized historical transactions with user-controlled exclusions and clear assumptions.
7. Evaluate regulated Open Banking providers and costs before selecting a provider.
