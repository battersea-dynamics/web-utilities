// Injects the precache asset list into the built service worker.
//
// Runs automatically as part of `npm run build` — see package.json.
//
// WHY THIS EXISTS: the PDF tools need about 630KB of JavaScript to work
// offline, most of it pdf-lib. Those files are fingerprinted, so their names
// change on every build and cannot be written into sw.js by hand. Worse,
// pdf-lib is a lazy chunk that no page's HTML references — it is imported at
// runtime when a widget hydrates — so a service worker that only caches
// what it has seen fetched will not have it. Anyone who installed the app
// from /pdf and went offline without opening a tool had no PDF engine at all.
// That is exactly what happened when this was first tested on a phone.
//
// The simple, robust answer: precache everything in _astro. It is ~800KB
// total against ~630KB actually needed, so the saving from clever dependency
// analysis is small and the fragility is not.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const swFile = path.join(dist, 'sw.js');

if (!fs.existsSync(swFile)) {
  console.error('dist/sw.js not found — run astro build first.');
  process.exit(1);
}

const astro = path.join(dist, '_astro');
const assets = fs.existsSync(astro)
  ? fs
      .readdirSync(astro)
      .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
      .map((f) => `/_astro/${f}`)
      .sort()
  : [];

// Icons too: an installed app that cannot draw its own icon looks broken.
const icons = fs.existsSync(path.join(dist, 'icons'))
  ? fs
      .readdirSync(path.join(dist, 'icons'))
      .map((f) => `/icons/${f}`)
      .sort()
  : [];

const list = [...assets, ...icons];

const sw = fs.readFileSync(swFile, 'utf8');
const PLACEHOLDER = '/*__PRECACHE_ASSETS__*/ []';

if (!sw.includes(PLACEHOLDER)) {
  console.error(
    'Placeholder missing from sw.js — the precache list was NOT injected.\n' +
      'public/sw.js must contain exactly:  ' + PLACEHOLDER
  );
  process.exit(1);
}

const bytes = list.reduce((n, f) => n + fs.statSync(path.join(dist, f)).size, 0);
fs.writeFileSync(swFile, sw.replace(PLACEHOLDER, JSON.stringify(list, null, 2)));

console.log(
  `[sw] precaching ${list.length} files (${(bytes / 1024).toFixed(0)} KB) for offline use`
);
