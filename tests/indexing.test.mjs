// Guards against "Page with redirect" in Search Console: every internal link
// must use the trailing-slash form Cloudflare Pages serves (slashless -> 308).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sitemapFilter } from '../src/data/sitemapFilter.js';

function walk(d, out = []) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|jsx|js)$/.test(f)) out.push(p);
  }
  return out;
}

test('internal page links end with a slash', () => {
  const bad = [];
  for (const f of walk('src')) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/href(?:=|:\s?)(["'`])(\/[a-z][a-z0-9-]*)\1/g)) bad.push(`${f}: ${m[2]}`);
    for (const m of s.matchAll(/`\/\$\{[^}]+\.slug\}`/g)) bad.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test('astro config enforces trailing slashes', () => {
  assert.match(readFileSync('astro.config.mjs', 'utf8'), /trailingSlash:\s*'always'/);
});

test('offline page is excluded from the sitemap', () => {
  assert.equal(sitemapFilter('https://gazza.ltd/offline/'), false);
  assert.equal(sitemapFilter('https://gazza.ltd/merge-pdf/'), true);
});

test('built HTML has no slashless internal links', { skip: !existsSync('dist') }, () => {
  const bad = new Set();
  const w = (d) => { for (const f of readdirSync(d)) { const p = join(d, f);
    if (statSync(p).isDirectory()) w(p);
    else if (f.endsWith('.html')) for (const m of readFileSync(p, 'utf8').matchAll(/href="(\/[a-z][a-z0-9-]*)"/g)) bad.add(m[1]); } };
  w('dist');
  assert.deepEqual([...bad], []);
});
