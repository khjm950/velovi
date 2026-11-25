import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { build } from 'esbuild';

const root = process.cwd();
const output = resolve(root, 'www');
const assets = resolve(root, 'assets');
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'auth.js',
  'guide.js',
  'i18n.js',
  'install.js',
  'capacitor-bridge.js',
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

await sharp(resolve(root, 'icon-512.png'))
  .resize(1024, 1024, { fit: 'contain' })
  .png()
  .toFile(resolve(assets, 'icon.png'));

await build({
  entryPoints: [resolve(root, 'scripts/capacitor-native.js')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2020'],
  outfile: resolve(output, 'capacitor-native.js'),
  sourcemap: false
});

console.log('Prepared ' + files.length + ' current Velovi web assets, native bridge bundle, and launcher icon.');
