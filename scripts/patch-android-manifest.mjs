import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('android/app/src/main/AndroidManifest.xml');
let manifest = readFileSync(manifestPath, 'utf8');

const cameraPermission = '    <uses-permission android:name="android.permission.CAMERA" />';
const cameraFeature = '    <uses-feature android:name="android.hardware.camera" android:required="false" />';

if (!manifest.includes('android.permission.CAMERA')) {
  manifest = manifest.replace(/(<application\b)/, cameraPermission + '\n' + cameraFeature + '\n    $1');
}
manifest = manifest.replace(/<application\b([^>]*)>/, (match, attributes) => {
  let updated = attributes;
  if (!/\bandroid:allowBackup=/.test(updated)) updated += ' android:allowBackup="false"';
  if (!/\bandroid:usesCleartextTraffic=/.test(updated)) updated += ' android:usesCleartextTraffic="false"';
  return '<application' + updated + '>';
});

if (!manifest.includes('android.permission.CAMERA') || !manifest.includes('android:allowBackup="false"')) {
  throw new Error('Android manifest hardening could not be applied.');
}

writeFileSync(manifestPath, manifest);
console.log('Android manifest hardened: camera permission, optional camera feature, backup disabled, cleartext traffic disabled.');
