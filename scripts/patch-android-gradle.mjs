import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const versionCode = Number(process.env.VELOVI_VERSION_CODE || 1);
if (!Number.isInteger(versionCode) || versionCode < 1) throw new Error('VELOVI_VERSION_CODE must be a positive integer.');
const path = resolve('android/app/build.gradle');
let gradle = readFileSync(path, 'utf8');

gradle = gradle.replace(/namespace\s*=\s*["'][^"']+["']/, 'namespace = "' + config.appId + '"');
gradle = gradle.replace(/applicationId\s+["'][^"']+["']/, 'applicationId "' + config.appId + '"');
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode ' + versionCode);
gradle = gradle.replace(/versionName\s+["'][^"']+["']/, 'versionName "' + packageJson.version + '"');

const signingKeys = ['VELOVI_SIGNING_STORE_FILE','VELOVI_SIGNING_STORE_PASSWORD','VELOVI_SIGNING_KEY_ALIAS','VELOVI_SIGNING_KEY_PASSWORD'];
const hasReleaseSigning = signingKeys.every(key => Boolean(process.env[key]));
if (hasReleaseSigning) {
  if (!gradle.includes('signingConfigs {')) {
    gradle = gradle.replace(/android\s*\{/, `android {
    signingConfigs {
        release {
            storeFile file(System.getenv('VELOVI_SIGNING_STORE_FILE'))
            storePassword System.getenv('VELOVI_SIGNING_STORE_PASSWORD')
            keyAlias System.getenv('VELOVI_SIGNING_KEY_ALIAS')
            keyPassword System.getenv('VELOVI_SIGNING_KEY_PASSWORD')
        }
    }`);
  }
  if (!/buildTypes\s*\{\s*release\s*\{/.test(gradle)) throw new Error('Could not find Android release build type for signing.');
  gradle = gradle.replace(/(buildTypes\s*\{\s*release\s*\{)/, '$1\\n            signingConfig signingConfigs.release');
}

if (!gradle.includes('namespace = "' + config.appId + '"') ||
    !gradle.includes('applicationId "' + config.appId + '"') ||
    !gradle.includes('versionName "' + packageJson.version + '"')) {
  throw new Error('Android application ID or version could not be set.');
}

writeFileSync(path, gradle);
console.log('Android ID set to ' + config.appId + ', version ' + packageJson.version + ' (code ' + versionCode + ').' + (hasReleaseSigning ? ' Release signing configured.' : ' Debug signing only; persistent signing secrets are not configured.'));
