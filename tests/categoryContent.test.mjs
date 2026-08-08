// Guards the category hub content against drift.
//
// The hub pages hand-list which tool to use for which job. That list is the
// one place on the site where a tool slug is written out by hand rather than
// derived from tools.json, so it's the one place a rename can silently
// produce a dead internal link. These tests make that a build failure.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = JSON.parse(fs.readFileSync(path.join(root, 'src/data/tools.json'), 'utf8'));

const { categoryContent } = await import('../src/data/categoryContent.js');
const { visibleCategories } = await import('../src/data/site.js');

const published = new Set(tools.tools.filter((t) => t.published).map((t) => t.slug));

describe('category hub content', () => {
  test('every visible category has content', () => {
    for (const c of visibleCategories) {
      assert.ok(categoryContent[c.slug], `no hub content for visible category "${c.slug}"`);
    }
  });

  test('every referenced slug is a real, published tool', () => {
    for (const [cat, content] of Object.entries(categoryContent)) {
      for (const { slug } of content.choosing ?? []) {
        assert.ok(published.has(slug), `${cat}: "${slug}" is not a published tool`);
      }
    }
  });

  test('every referenced tool actually belongs to that category', () => {
    const catOf = Object.fromEntries(tools.tools.map((t) => [t.slug, t.category]));
    for (const [cat, content] of Object.entries(categoryContent)) {
      for (const { slug } of content.choosing ?? []) {
        assert.equal(catOf[slug], cat, `${cat}: "${slug}" belongs to "${catOf[slug]}"`);
      }
    }
  });

  test('every published tool is listed on its own hub', () => {
    // Otherwise a tool exists but the hub never tells anyone when to use it.
    for (const [cat, content] of Object.entries(categoryContent)) {
      const listed = new Set((content.choosing ?? []).map((c) => c.slug));
      const inCat = tools.tools.filter((t) => t.published && t.category === cat);
      for (const t of inCat) {
        assert.ok(listed.has(t.slug), `${cat}: "${t.slug}" is published but not in the list`);
      }
    }
  });

  test('each category carries enough prose to be worth a page', () => {
    // Not a word-count target for its own sake — a floor that catches a
    // category added later with the prose left as a stub.
    for (const [cat, content] of Object.entries(categoryContent)) {
      assert.ok(content.intro?.length >= 1, `${cat}: no intro`);
      const words = content.intro.join(' ').split(/\s+/).filter(Boolean).length;
      assert.ok(words >= 60, `${cat}: intro is only ${words} words`);
    }
  });

  test('every guide points at a page that exists', () => {
    // A guide href is typed by hand and is not checked against tools.json,
    // because a guide is not a tool. Nothing else would catch a typo or a
    // renamed page — the build would succeed and the hub would link to a 404.
    const pages = path.join(root, 'src/pages');
    for (const [cat, content] of Object.entries(categoryContent)) {
      for (const g of content.guides ?? []) {
        assert.match(g.href, /^\/[a-z0-9-]+$/, `${cat}: "${g.href}" is not a site-root path`);
        const file = path.join(pages, `${g.href.slice(1)}.astro`);
        assert.ok(fs.existsSync(file), `${cat}: guide "${g.href}" has no page at ${file}`);
        assert.ok(g.title && g.blurb, `${cat}: guide "${g.href}" is missing a title or blurb`);
      }
    }
  });

  test('a guide is never also a tool', () => {
    // The two lists are rendered as separate sections. The same page in both
    // is duplicate internal linking and tells a reader the hub is confused.
    for (const [cat, content] of Object.entries(categoryContent)) {
      for (const g of content.guides ?? []) {
        const slug = g.href.slice(1);
        assert.ok(!published.has(slug), `${cat}: "${slug}" is a tool, so it belongs in choosing`);
      }
    }
  });

  test('the "when" descriptions are distinct within a category', () => {
    for (const [cat, content] of Object.entries(categoryContent)) {
      const whens = (content.choosing ?? []).map((c) => c.when.toLowerCase());
      assert.equal(new Set(whens).size, whens.length, `${cat}: duplicate descriptions`);
    }
  });
});
