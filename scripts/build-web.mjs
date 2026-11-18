import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'www');
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'auth.js',
  'i18n.js',
  'install.js',
  'sw.js',
  'manifest.webmanifest',
  'supabase-config.js',
  'icon-192.png',
  'icon-512.png'
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const file of files) {
  copyFileSync(resolve(root, file), resolve(output, file));
}

console.log(`Prepared ${files.length} Velovi web assets in www/.`);
