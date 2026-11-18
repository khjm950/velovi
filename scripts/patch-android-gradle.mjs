import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const path = resolve('android/app/build.gradle');
let gradle = readFileSync(path, 'utf8');

gradle = gradle.replace(/namespace\s*=\s*"[^"]+"/, 'namespace = "' + config.appId + '"');
gradle = gradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "' + config.appId + '"');
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 1');
gradle = gradle.replace(/versionName\s+"[^"]+"/, 'versionName "' + packageJson.version + '"');

if (!gradle.includes('namespace = "' + config.appId + '"') ||
    !gradle.includes('applicationId "' + config.appId + '"') ||
    !gradle.includes('versionName "' + packageJson.version + '"')) {
  throw new Error('Android application ID or version could not be set.');
}

writeFileSync(path, gradle);
console.log('Android ID set to ' + config.appId + ', version ' + packageJson.version + '.');
