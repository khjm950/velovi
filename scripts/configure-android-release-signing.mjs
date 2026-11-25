import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const required = ['VELOVI_KEYSTORE_PATH','VELOVI_KEYSTORE_PASSWORD','VELOVI_KEY_ALIAS','VELOVI_KEY_PASSWORD'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error('Missing Android upload signing environment: ' + missing.join(', '));

const gradlePath = resolve('android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');
const signing = `
android {
  signingConfigs {
    release {
      storeFile file(System.getenv('VELOVI_KEYSTORE_PATH'))
      storePassword System.getenv('VELOVI_KEYSTORE_PASSWORD')
      keyAlias System.getenv('VELOVI_KEY_ALIAS')
      keyPassword System.getenv('VELOVI_KEY_PASSWORD')
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
}
`;
if (!gradle.includes("signingConfig signingConfigs.release")) gradle += '\n' + signing;
writeFileSync(gradlePath, gradle);
console.log('Android release upload signing configured from protected environment secrets.');
