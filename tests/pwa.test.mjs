// Guards the installable PDF app.
//
// The service worker is the highest-risk file on the site: it installs onto
// visitors' devices and keeps running there, so a mistake can serve a broken
// or stale site to people who cannot easily clear it. These tests exist to
// stop the specific mistakes that would do that.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const manifest = JSON.parse(read('public/manifest.webmanifest'));
const swRaw = read('public/sw.js');
const tools = JSON.parse(read('src/data/tools.json'));

// Strip comments before checking for banned calls. The file explains *why*
// addAll is avoided, and a naive search matched that explanation rather than
// any real usage — a test that fails on its own documentation.
const sw = swRaw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('manifest', () => {
  test('opens into the PDF hub, not the homepage', () => {
    // The app is the PDF tools. Launching to the homepage would show a
    // visitor calculators they didn't install it for.
    assert.match(manifest.start_url, /^\/pdf/);
  });

  test('scope covers the whole site, because PDF tools have flat URLs', () => {
    // /merge-pdf is not under /pdf/. A scope of "/pdf" would push every tool
    // page out of the app and back into the browser.
    assert.equal(manifest.scope, '/');
  });

  test('declares the icons a home screen needs', () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    assert.ok(sizes.includes('192x192'), 'no 192px icon');
    assert.ok(sizes.includes('512x512'), 'no 512px icon');
  });

  test('has a maskable icon', () => {
    // Android crops icons to a circle. Without a maskable variant the mark
    // gets its edges cut off.
    assert.ok(
      manifest.icons.some((i) => (i.purpose || '').includes('maskable')),
      'no maskable icon — Android will crop the mark'
    );
  });

  test('every icon file actually exists', () => {
    for (const icon of manifest.icons) {
      const file = path.join(root, 'public', icon.src);
      assert.ok(fs.existsSync(file), `${icon.src} is declared but missing`);
      assert.ok(fs.statSync(file).size > 2000, `${icon.src} is suspiciously small — is it blank?`);
    }
  });

  test('shortcuts point at real published tools', () => {
    const published = new Set(tools.tools.filter((t) => t.published).map((t) => `/${t.slug}`));
    for (const s of manifest.shortcuts ?? []) {
      assert.ok(published.has(s.url), `shortcut "${s.name}" points at ${s.url}, which isn't published`);
    }
  });
});

describe('service worker safety', () => {
  test('HTML is network-first, never cache-first', () => {
    // Cache-first HTML would pin visitors to an old build whose fingerprinted
    // CSS and JS no longer exist — the "site looks unstyled" failure this
    // project has already hit once through caching.
    const htmlBranch = sw.slice(sw.indexOf('if (isHTML)'), sw.indexOf('// Fingerprinted'));
    assert.ok(htmlBranch.includes('fetch(request)'), 'HTML branch does not try the network first');
    assert.ok(
      htmlBranch.indexOf('fetch(request)') < htmlBranch.indexOf('caches'),
      'HTML branch consults the cache before the network'
    );
  });

  test('old caches are deleted on activate', () => {
    // This is the kill switch: bump CACHE, push, and every device cleans up.
    assert.match(sw, /activate/);
    assert.match(sw, /caches\.delete/);
  });

  test('the cache name is versioned', () => {
    assert.match(sw, /const CACHE = '[a-z-]+-v\d+'/);
  });

  test('only same-origin GETs are intercepted', () => {
    // Anything else risks interfering with ads, analytics or form posts.
    assert.match(sw, /request\.method !== 'GET'/);
    assert.match(sw, /url\.origin !== self\.location\.origin/);
  });

  test('install does not fail wholesale if one URL is missing', () => {
    // cache.addAll rejects the entire install if any single URL 404s, leaving
    // visitors with no worker at all.
    assert.ok(!/addAll/.test(sw), 'uses addAll — one bad URL kills the whole install');
    assert.match(sw, /cache\.add\(url\)\.catch/);
  });

  test('precaches every published PDF tool, and nothing unpublished', () => {
    const listed = [...sw.matchAll(/^\s*'(\/[a-z0-9-]*)\/?',$/gm)].map((m) => m[1]);
    const pdf = tools.tools.filter((t) => t.published && t.category === 'pdf');
    for (const t of pdf) {
      assert.ok(listed.includes(`/${t.slug}`), `${t.slug} is a published PDF tool but not precached`);
    }
    const published = new Set(tools.tools.filter((t) => t.published).map((t) => `/${t.slug}`));
    for (const url of listed) {
      if (['/pdf', '/offline'].includes(url)) continue;
      assert.ok(published.has(url), `sw.js precaches ${url}, which is not a published tool`);
    }
  });

  test('precached pages use the trailing-slash form the site serves', () => {
    // Astro builds directories, so the real URL is /merge-pdf/. v1 precached
    // '/merge-pdf', every offline lookup missed on the exact-URL match, and
    // the offline fallback missed for the same reason. Found only by testing
    // on a phone.
    const pages = sw.match(/const PAGES = \[([\s\S]*?)\];/)[1].match(/'([^']+)'/g)
      .map((s) => s.replace(/'/g, ''));
    for (const p of pages) {
      assert.match(p, /\/$/, `"${p}" has no trailing slash — offline lookup will miss`);
    }
  });

  test('lookups tolerate either slash form', () => {
    assert.match(sw, /function variants/, 'no slash-tolerant lookup helper');
  });

  test('the build injects a real precache list', () => {
    // pdf-lib is a 411KB lazy chunk that no page's HTML references, so a
    // worker caching only what it has seen fetched will not have it. Anyone
    // installing from /pdf and going offline without opening a tool had no
    // PDF engine at all.
    // Checked against the raw file: the placeholder is itself a comment, so
    // the comment-stripped copy used elsewhere in this file doesn't have it.
    assert.match(swRaw, /const ASSETS = \/\*__PRECACHE_ASSETS__\*\/ \[\]/,
      'the placeholder scripts/build-sw.mjs replaces has been altered');
    const pkg = JSON.parse(read('package.json'));
    assert.match(pkg.scripts.build, /build-sw\.mjs/,
      'the build no longer injects the precache list — offline will silently break');
  });

  test('the offline fallback page exists', () => {
    assert.ok(sw.includes("'/offline'"), 'no offline fallback listed');
    assert.ok(fs.existsSync(path.join(root, 'src/pages/offline.astro')), 'offline page missing');
  });
});

describe('install prompt', () => {
  const cmp = read('src/components/InstallPdfApp.astro');

  test('handles iOS separately, since it has no install prompt', () => {
    // Safari has never fired beforeinstallprompt. On iOS the only thing that
    // works is telling people to use Share > Add to Home Screen.
    assert.match(cmp, /iphone|ipad/i);
    assert.match(cmp, /Add to Home Screen/);
  });

  test('the install event is captured before deferred scripts run', () => {
    // beforeinstallprompt fires during page load. This component's script is
    // a module, which browsers defer, so it can attach its listener after the
    // event has already fired — and then the panel never appears for anyone.
    // Base.astro catches it inline in <head> and stashes it.
    const base = read('src/layouts/Base.astro');
    assert.match(base, /is:inline/, 'the early capture script is not inline');
    assert.match(base, /beforeinstallprompt/, 'nothing catches the event early');
    assert.match(base, /__installPrompt/, 'the event is not stashed for the panel');
    assert.match(cmp, /window\.__installPrompt/, 'the panel ignores the stashed event');
    assert.match(cmp, /prompt\(\)/);
  });

  test('always offers a manual route, since the event is unreliable', () => {
    // beforeinstallprompt does not fire in incognito, when already installed,
    // or sometimes after a recent dismissal. Without a fallback, people have
    // no idea the app can be installed at all.
    assert.match(cmp, /install-steps-menu/, 'no browser-menu fallback');
    assert.match(cmp, /Install app/);
  });

  test('hides itself when already installed', () => {
    assert.match(cmp, /display-mode: standalone/);
    assert.match(cmp, /appinstalled/);
  });

  test('registers the service worker', () => {
    assert.match(cmp, /serviceWorker\.register\('\/sw\.js'\)/);
  });

  test('is offered only for the PDF tools', () => {
    // The calculators and word tools load reference data over the network, so
    // promising offline use would be a lie.
    const toolPage = read('src/layouts/ToolPage.astro');
    const hub = read('src/pages/[category]/index.astro');
    assert.match(toolPage, /tool\.category === 'pdf' && <InstallPdfApp/);
    assert.match(hub, /category\.slug === 'pdf' && <InstallPdfApp/);
  });
});
