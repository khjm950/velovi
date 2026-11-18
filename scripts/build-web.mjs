import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const output = resolve(root, 'www');
const assets = resolve(root, 'assets');
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
mkdirSync(assets, { recursive: true });

for (const file of files) {
  copyFileSync(resolve(root, file), resolve(output, file));
}

// Reuse the existing Velovi PWA icon for native Android launcher assets.
await sharp(resolve(root, 'icon-512.png'))
  .resize(1024, 1024, { fit: 'contain' })
  .png()
  .toFile(resolve(assets, 'icon.png'));

console.log('Prepared ' + files.length + ' Velovi web assets and a 1024px Android icon source.');
