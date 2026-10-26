// Guards for the Winter Arc printable: it stays unsellable until a real
// Payment Link is set, the paid PDF never ships in public/, and the page keeps
// its wellbeing notice and stays clear of health claims.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WINTER_ARC, WINTER_ARC_PAYMENT_LINK, WELLBEING_NOTICE, checkoutUrl } from '../src/data/shop.js';
import { sitemapFilter } from '../src/data/sitemapFilter.js';
import { categoryContent } from '../src/data/categoryContent.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = fs.readFileSync(path.join(root, 'src/pages/winter-arc-tracker.astro'), 'utf8');

describe('Winter Arc tracker', () => {
  test('price is £4.50', () => {
    assert.equal(WINTER_ARC.price, 4.5);
    assert.equal(WINTER_ARC.priceLabel, '£4.50');
  });
  test('placeholder link means Coming soon (no checkout URL)', () => {
    if (WINTER_ARC_PAYMENT_LINK.includes('REPLACE_ME')) assert.equal(checkoutUrl(WINTER_ARC_PAYMENT_LINK), null);
  });
  test('no PDF is publicly downloadable', () => {
    const pdfs = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) walk(f); else if (/\.pdf$/i.test(e.name)) pdfs.push(f);
      }
    })(path.join(root, 'public'));
    assert.deepEqual(pdfs, []);
  });
  test('page carries the wellbeing notice and is in the sitemap', () => {
    assert.equal(WELLBEING_NOTICE, 'General wellbeing tracker, not medical advice.');
    assert.match(page, /WELLBEING_NOTICE/);
    assert.equal(sitemapFilter('https://gazza.ltd/winter-arc-tracker/'), true);
  });
  test('listed on the health hub with an image that exists', () => {
    const p = categoryContent.health.products.find((x) => x.href === '/winter-arc-tracker/');
    assert.ok(p);
    assert.ok(fs.existsSync(path.join(root, 'public', p.image)));
  });
  test('no treatment claims or unrelated brands', () => {
    assert.doesNotMatch(page, /\b(cures?|heals?|improves? posture|reduces? pain|boosts? immunity|weight loss)\b/i);
    assert.doesNotMatch(page, /dynamic\s*grove|grok|chatgpt|\bAI\b/i);
  });
});

describe('legal pages cover both products', () => {
  const read = (p) => fs.readFileSync(path.join(root, 'src/pages', `${p}.astro`), 'utf8');
  for (const p of ['terms-of-sale', 'refund-policy', 'privacy-policy']) {
    test(`${p} covers MTD and Winter Arc, no unrelated brands`, () => {
      const src = read(p);
      assert.match(src, /Making Tax Digital \(MTD\)/);
      assert.match(src, /Winter Arc|WINTER_ARC/);
      assert.doesNotMatch(src, /dynamic\s*grove|grok|chatgpt|\bAI\b/i);
    });
  }
  test('terms: personal licence, no redistribution, not medical advice', () => {
    const src = read('terms-of-sale');
    assert.match(src, /personal, non-commercial use/);
    assert.match(src, /redistribute/);
    assert.match(src, /WELLBEING_NOTICE/);
    assert.match(src, /not a substitute for professional advice/);
  });
});

describe('legal pages: on-screen delivery and seller details', () => {
  for (const p of ['terms-of-sale', 'refund-policy', 'privacy-policy']) {
    test(`${p} does not mention Resend or a placeholder office address`, () => {
      const src = fs.readFileSync(path.join(root, 'src/pages', `${p}.astro`), 'utf8');
      assert.doesNotMatch(src, /resend/i);
      assert.ok(!src.includes('[REGISTERED OFFICE ADDRESS]'));
    });
  }
  test('seller registered office is filled in', async () => {
    const { SELLER } = await import('../src/data/shop.js');
    assert.ok(!SELLER.registeredOffice.includes('['));
  });
});
