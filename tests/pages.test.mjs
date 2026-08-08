// Structural checks on the pages themselves, rather than the maths inside
// them. These guard the things that break silently — where nothing errors,
// the build succeeds, and the damage only shows up weeks later in a search
// engine's index.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = path.join(root, 'src/pages');

describe('404 handling', () => {
  test('a 404 page exists', () => {
    // Without this file Astro emits no 404.html, and Cloudflare Pages falls
    // back to serving index.html for unmatched paths — a 200 OK carrying the
    // homepage. That is what kept the old Shopify URLs alive in Bing's index
    // long after the store had moved off this domain. Deleting this page
    // silently recreates that bug.
    assert.ok(
      fs.existsSync(path.join(pages, '404.astro')),
      'src/pages/404.astro is missing — unknown URLs will soft-404 to the homepage'
    );
  });

  test('unknown URLs are not redirected to the homepage', () => {
    // A catch-all redirect would be the same defect wearing a different hat:
    // it tells a crawler the content moved to the homepage rather than that
    // it is gone.
    const redirects = fs.readFileSync(path.join(root, 'public/_redirects'), 'utf8');
    for (const line of redirects.split('\n')) {
      const rule = line.trim();
      if (!rule || rule.startsWith('#')) continue;
      const [from, to] = rule.split(/\s+/);
      const catchAll = from === '/*' || from === '/**';
      assert.ok(
        !(catchAll && (to === '/' || to === '/index.html')),
        `"${rule}" sends every unknown URL to the homepage — use a 404 instead`
      );
    }
  });
});

describe('breadcrumbs', () => {
  // Walk every .astro file under src/, layouts included.
  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.astro')) files.push(full);
    }
  })(path.join(root, 'src'));

  test('nobody hand-writes a breadcrumb trail', () => {
    // The visible trail and the BreadcrumbList schema have to agree. Google
    // treats a mismatch as a reason to discard the markup, and a mismatch is
    // invisible on the page — so the only safe arrangement is one component
    // emitting both. A hand-written <nav class="crumbs"> gets the trail with
    // no schema, or worse, a schema that has quietly drifted.
    const component = path.join(root, 'src/components/Breadcrumbs.astro');
    for (const file of files) {
      if (file === component) continue;
      const src = fs.readFileSync(file, 'utf8');
      assert.ok(
        !src.includes('class="crumbs"'),
        `${path.relative(root, file)} writes its own breadcrumbs — use <Breadcrumbs trail={…} />`
      );
    }
  });

  test('the trail never repeats Home', () => {
    // Breadcrumbs.astro prepends Home itself. A caller passing it again would
    // emit "Home › Home › …" and a schema with two position-1 entries.
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      const calls = src.match(/<Breadcrumbs[\s\S]*?\/>/g) || [];
      for (const call of calls) {
        assert.ok(
          !/name:\s*'Home'/.test(call),
          `${path.relative(root, file)} passes Home in the trail — it is added automatically`
        );
      }
    }
  });
});

describe('canonical host', () => {
  test('the site is configured with one canonical origin', () => {
    const config = fs.readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const match = config.match(/site:\s*'([^']+)'/);
    assert.ok(match, 'astro.config.mjs has no `site` — canonical URLs would be relative');
    assert.ok(
      !match[1].includes('www.'),
      `site is "${match[1]}" — canonicals should use the bare apex domain`
    );
  });
});
