import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const fail = message => { console.error('FAIL:', message); process.exitCode = 1; };
const html = read('index.html');
const app = read('app.js');
const auth = read('auth.js');
const install = read('install.js');
const bridge = read('capacitor-bridge.js');
const buildScript = read('scripts/build-web.mjs');
const workflow = read('.github/workflows/android-apk.yml');
const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) fail('Duplicate HTML IDs: ' + duplicateIds.join(', '));

const swRegistrations = (app.match(/serviceWorker\.register/g) || []).length +
  (install.match(/serviceWorker\.register/g) || []).length;
if (swRegistrations !== 1) fail('Expected one Service Worker registration, found ' + swRegistrations);

if (!auth.includes('query.range(from, from + pageSize - 1)') || !auth.includes('page.length < pageSize')) {
  fail('Household financial records must be fetched with stable pagination.');
}
if (!app.includes('result = x.signedAmount - y.signedAmount')) {
  fail('Transaction amount sorting must use signed ledger amounts.');
}
if (!html.includes('./i18n.js')) fail('i18n.js is not loaded by index.html.');
if (!html.includes('./capacitor-bridge.js')) fail('Native bridge loader is not loaded by index.html.');
if (!buildScript.includes('capacitor-native.js')) fail('Android native bridge is not bundled for APK builds.');
if (!workflow.includes('node scripts/patch-android-manifest.mjs')) fail('Android manifest hardening is missing from the APK workflow.');
if (!workflow.includes('node scripts/patch-android-theme.mjs')) fail('Android system bar theme is missing from the APK workflow.');
if (!workflow.includes('npx @capacitor/assets generate --android')) fail('Branded Android asset generation is missing from the APK workflow.');
if (!bridge.includes('isNativePlatform')) fail('Native bridge loader is not restricted to native platforms.');
if (!html.includes('@supabase/supabase-js@2.119.0')) fail('Supabase JS CDN version is not pinned.');
if (!html.includes('crossorigin="anonymous"') || !sw.includes('EXTERNAL_APP_SHELL')) fail('Pinned CDN libraries are not configured for offline caching.');
if (!sw.includes('velovi-shell-v23')) fail('Service Worker cache version is not current.');
if (!html.includes('tesseract.js@5.1.1')) fail('Tesseract.js CDN version is not pinned.');

const shellAssets = [...sw.matchAll(/['"](\.\/[^'"]+)['"]/g)]
  .map(match => match[1])
  .filter(path => path !== './');
for (const asset of shellAssets) {
  if (!existsSync(asset.slice(2))) fail('Service Worker asset does not exist: ' + asset);
}

for (const key of ['name', 'short_name', 'start_url', 'scope', 'display', 'icons']) {
  if (!(key in manifest)) fail('Manifest is missing required field: ' + key);
}
if (manifest.display !== 'standalone') fail('PWA manifest must use standalone display mode.');

const browserCode = [app, auth, read('i18n.js'), install, read('supabase-config.js')].join('\n');
if (/sb_secret_[A-Za-z0-9_-]{20,}/i.test(browserCode) || /service_role\s*[:=]\s*['"]eyJ/i.test(browserCode)) {
  fail('A privileged Supabase key pattern was found in browser code.');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('Velovi static integrity checks passed.');
