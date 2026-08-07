// Guards the embeddable widgets.
//
// These matter more than most tests because embeds fail *silently and
// remotely*. If something here breaks, the calculator simply doesn't render
// on somebody else's website, they never tell you, and the link you earned
// quietly stops being worth anything. Nothing on gazza.ltd looks wrong.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = JSON.parse(fs.readFileSync(path.join(root, 'src/data/tools.json'), 'utf8'));

const { embeddableTools, embedSnippet, SITE } = await import('../src/data/embeds.js');

const embedRoute = fs.readFileSync(
  path.join(root, 'src/pages/embed/[tool].astro'),
  'utf8'
);
const headers = fs.readFileSync(path.join(root, 'public/_headers'), 'utf8');

describe('embeddable tool list', () => {
  test('every embeddable tool is published', () => {
    for (const t of embeddableTools) {
      assert.ok(t.published, `${t.slug} is embeddable but not published`);
    }
  });

  test('every embeddable tool declares a height', () => {
    // Without one the iframe defaults to 150px and the calculator is cut off
    // on the host's page — which they will notice and we will not.
    for (const t of embeddableTools) {
      assert.equal(typeof t.embedHeight, 'number', `${t.slug} has no embedHeight`);
      assert.ok(t.embedHeight >= 300, `${t.slug} height ${t.embedHeight} is too small`);
    }
  });

  test('every embeddable tool has a widget wired up in the route', () => {
    // The route lists widgets one by one because Astro cannot hydrate a
    // component looked up from a map. Easy to add a tool to tools.json and
    // forget this half, which produces a blank embed.
    for (const t of embeddableTools) {
      assert.ok(
        embedRoute.includes(`slug === '${t.slug}'`),
        `${t.slug} is embeddable but has no widget line in src/pages/embed/[tool].astro`
      );
    }
  });

  test('embeds hide cross-links and ad slots', () => {
    // Four widgets carry .tool-actions links to other calculators. Useful on
    // gazza.ltd; wrong inside a broker's website, where they pull the host's
    // visitor away and read as advertising on a page they own. They would
    // also open our site *inside* their iframe, which looks broken.
    const css = fs.readFileSync(path.join(root, 'src/styles/global.css'), 'utf8');
    const rule = css.match(/\.embed-body \.tool-actions[^}]*}/s);
    assert.ok(rule, 'no rule hiding .tool-actions inside embeds');
    assert.match(rule[0], /display:\s*none/);
    assert.match(rule[0], /\.ad-slot/, 'ad slots are not hidden in embeds');
  });

  test('no PDF tool is embeddable', () => {
    // File pickers and downloads behave unpredictably inside a third-party
    // iframe, so these are deliberately excluded.
    for (const t of embeddableTools) {
      assert.notEqual(t.category, 'pdf', `${t.slug} is a PDF tool and should not be embeddable`);
    }
  });
});

describe('the snippet hosts paste', () => {
  const snippets = embeddableTools.map((t) => ({ tool: t, code: embedSnippet(t) }));

  test('the credit link sits OUTSIDE the iframe', () => {
    // The whole point. A link inside the iframe is credited to gazza.ltd and
    // does nothing for us; only a link in the host's own HTML carries value.
    // If this test fails, the entire embed strategy is decorative.
    for (const { tool, code } of snippets) {
      const after = code.split('</iframe>')[1] ?? '';
      assert.ok(
        after.includes(`href="${SITE}"`),
        `${tool.slug}: no gazza.ltd link after the iframe closes`
      );
    }
  });

  test('the snippet also links the tool page itself', () => {
    for (const { tool, code } of snippets) {
      assert.ok(code.includes(`${SITE}/${tool.slug}`), `${tool.slug}: no deep link`);
    }
  });

  test('embed URLs are absolute', () => {
    // A relative URL would resolve against the host's domain and 404.
    for (const { tool, code } of snippets) {
      assert.ok(
        code.includes(`src="${SITE}/embed/${tool.slug}"`),
        `${tool.slug}: src is not an absolute gazza.ltd URL`
      );
    }
  });

  test('embed URLs carry no version segment', () => {
    // Versioning would freeze each host on whatever they pasted, so a rate
    // change could never reach them. One URL, forever, current rates.
    for (const { code } of snippets) {
      assert.ok(!/\/embed\/v\d/.test(code), 'a versioned embed URL has crept in');
    }
  });

  test('the snippet uses no scripts', () => {
    // WordPress, Squarespace and Wix all strip <script> from content blocks.
    // A snippet that needs JS works in far fewer places.
    for (const { tool, code } of snippets) {
      assert.ok(!/<script/i.test(code), `${tool.slug}: snippet contains a script tag`);
    }
  });

  test('the snippet is lazy-loaded', () => {
    for (const { tool, code } of snippets) {
      assert.ok(code.includes('loading="lazy"'), `${tool.slug}: not lazy-loaded`);
    }
  });

  test('the iframe has a title, for screen readers', () => {
    for (const { tool, code } of snippets) {
      assert.ok(code.includes(`title="${tool.title}"`), `${tool.slug}: no iframe title`);
    }
  });
});

describe('framing headers', () => {
  // Parse _headers properly rather than string-matching it. The first version
  // of this test split the file on the literal "/embed/*", which also appears
  // in the comment above the rule — so it read the comment, found no
  // X-Frame-Options there, and passed no matter what the actual rule said.
  // It would never have caught the failure it exists to catch.
  //
  // Format: a line starting with "/" opens a rule; indented lines below it
  // are that rule's headers; "#" lines are comments.
  // Note the `??=`: the file declares /* twice — once for security headers,
  // once for cache control. Cloudflare merges repeated paths, so the parser
  // must too. Overwriting instead of merging made this test report that the
  // site had no X-Frame-Options at all, because the second /* block only sets
  // Cache-Control.
  const rules = {};
  let current = null;
  for (const raw of headers.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (raw.startsWith('/')) {
      current = raw.trim();
      rules[current] ??= [];
    } else if (current) {
      rules[current].push(raw.trim());
    }
  }

  test('the file parses into the rules we expect', () => {
    assert.ok(rules['/embed/*'], 'no /embed/* rule in public/_headers');
    assert.ok(rules['/*'], 'no catch-all rule in public/_headers');
  });

  test('/embed/* is exempted from X-Frame-Options', () => {
    // Without this the site-wide SAMEORIGIN blocks every embed and the widget
    // silently refuses to render on the host's page — with no error anyone sees.
    const set = rules['/embed/*'].filter((h) => /^X-Frame-Options/i.test(h));
    assert.deepEqual(
      set,
      [],
      `the /embed/* rule sets ${set[0]}, which blocks embedding entirely`
    );
  });

  test('the rest of the site still refuses framing', () => {
    assert.ok(
      rules['/*'].some((h) => /^X-Frame-Options:\s*SAMEORIGIN/i.test(h)),
      'the catch-all no longer sets X-Frame-Options — the site is clickjackable'
    );
  });

  test('the /embed/* rule comes before the catch-all', () => {
    const keys = Object.keys(rules);
    assert.ok(
      keys.indexOf('/embed/*') < keys.indexOf('/*'),
      '/embed/* must be listed before the /* catch-all'
    );
  });
});

describe('search-engine handling', () => {
  test('embed pages are noindex', () => {
    // They duplicate the tool pages; the tool page is what should rank.
    const layout = fs.readFileSync(path.join(root, 'src/layouts/EmbedPage.astro'), 'utf8');
    assert.match(layout, /noindex/);
  });

  test('embed pages canonicalise to the real tool page', () => {
    const layout = fs.readFileSync(path.join(root, 'src/layouts/EmbedPage.astro'), 'utf8');
    assert.match(layout, /canonical/);
    assert.match(layout, /gazza\.ltd\/\$\{toolSlug\}/);
  });

  test('the sitemap excludes /embed/* but keeps /embed', () => {
    const config = fs.readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    assert.match(config, /filter:/, 'no sitemap filter — noindex pages would be listed');
    const filter = eval(config.match(/filter:\s*(\(page\)[^,]+)/)[1]);
    assert.equal(filter('https://gazza.ltd/embed/stamp-duty-calculator/'), false);
    assert.equal(filter('https://gazza.ltd/embed/'), true);
    assert.equal(filter('https://gazza.ltd/stamp-duty-calculator/'), true);
  });
});

describe('the /embed landing page', () => {
  const page = fs.readFileSync(path.join(root, 'src/pages/embed.astro'), 'utf8');

  test('links to the embed terms', () => {
    assert.ok(page.includes('/embed-terms'), 'no link to the terms page');
  });

  test('the terms page exists', () => {
    assert.ok(fs.existsSync(path.join(root, 'src/pages/embed-terms.astro')));
  });

  test('shows the rate verification date', () => {
    // The reason a broker picks this calculator over a bank's.
    assert.ok(page.includes('LAST_VERIFIED'), 'verification date not shown');
  });
});
