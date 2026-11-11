Velovi UI prototype 0.1
========================
Open index.html in a modern browser for a clickable UI demonstration.

This is a front-end prototype only:
- Uses demonstration/sample values.
- Does not authenticate users.
- Does not connect to Supabase or ING.
- Does not persist financial records or sync devices.
- Permission controls are visual demonstrations only.
- Do not enter real financial or banking credentials.

To test installability/PWA behavior, serve this folder over HTTPS or localhost.
Next integration steps:
1. Configure Supabase project and Auth.
2. Apply and security-review SQL migrations 001 and 002.
3. Implement client-side encryption and recovery-key flow before syncing sensitive payloads.
4. Implement secure server-side email invitations and audit workflows.
5. Add transaction CRUD, encrypted offline queue, conflict handling and RLS tests.
6. Implement ING import parser and evaluate an authorized PSD2/FinTS provider for automatic sync.
