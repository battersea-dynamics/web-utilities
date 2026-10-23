// MTD checker maths, and the guard-rails around the paid product.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mtdStart, qualifyingIncome, MTD_PHASES } from '../src/components/tools/mtdEngine.js';
import { sitemapFilter } from '../src/data/sitemapFilter.js';
import { checkoutUrl, isPaymentLinkLive, CONSENT_VERSION, STRIPE_PAYMENT_LINK } from '../src/data/shop.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const y = (a, b, c) => ({
  y2425: { selfEmployment: a[0], property: a[1] },
  y2526: { selfEmployment: b[0], property: b[1] },
  y2627: { selfEmployment: c[0], property: c[1] },
});

describe('MTD thresholds', () => {
  test('phases match GOV.UK', () => {
    assert.deepEqual(MTD_PHASES.map((p) => [p.threshold, p.start]), [
      [50000, '6 April 2026'], [30000, '6 April 2027'], [20000, '6 April 2028'],
    ]);
  });
  test('qualifying income is turnover plus property, negatives ignored', () => {
    assert.equal(qualifyingIncome(27000, 25000), 52000);
    assert.equal(qualifyingIncome(-5, 10), 10);
    assert.equal(qualifyingIncome(NaN, 10), 10);
  });
  test('GOV.UK example: £27k + £25k joins April 2026', () => {
    assert.equal(mtdStart(y([27000, 25000], [0, 0], [0, 0])).start.start, '6 April 2026');
  });
  test('exactly on a threshold does not bring you in', () => {
    assert.equal(mtdStart(y([50000, 0], [30000, 0], [20000, 0])).start, null);
  });
  test('£1 over each threshold brings you in at that date', () => {
    assert.equal(mtdStart(y([0, 0], [30001, 0], [0, 0])).start.start, '6 April 2027');
    assert.equal(mtdStart(y([0, 0], [0, 0], [10000, 10001])).start.start, '6 April 2028');
  });
  test('earliest passing test wins', () => {
    assert.equal(mtdStart(y([60000, 0], [60000, 0], [60000, 0])).start.start, '6 April 2026');
  });
  test('worked example on the page: £36k in 2025/26 → April 2027', () => {
    assert.equal(mtdStart(y([20000, 13000], [22000, 14000], [22000, 14000])).start.start, '6 April 2027');
  });
});

describe('shop pages', () => {
  const pages = path.join(root, 'src/pages');
  for (const p of ['mtd-checker', 'mtd-tracker', 'mtd-tracker-thanks', 'terms-of-sale', 'refund-policy', 'disclaimer', 'privacy-policy']) {
    test(`${p} exists`, () => assert.ok(fs.existsSync(path.join(pages, `${p}.astro`))));
  }
  test('thanks page is noindex and out of the sitemap', () => {
    const src = fs.readFileSync(path.join(pages, 'mtd-tracker-thanks.astro'), 'utf8');
    assert.match(src, /noindex=\{true\}/);
    assert.equal(sitemapFilter('https://gazza.ltd/mtd-tracker-thanks/'), false);
    assert.equal(sitemapFilter('https://gazza.ltd/mtd-tracker/'), true);
  });
  test('checkout URL carries the consent version', () => {
    if (isPaymentLinkLive()) {
      assert.ok(checkoutUrl().startsWith(STRIPE_PAYMENT_LINK));
      assert.ok(checkoutUrl().includes(`client_reference_id=${CONSENT_VERSION}`));
    } else {
      assert.equal(checkoutUrl(), null);
    }
  });
  test('consent box is never pre-ticked', () => {
    const src = fs.readFileSync(path.join(root, 'src/components/BuyBox.jsx'), 'utf8');
    assert.match(src, /useState\(false\)/);
    assert.doesNotMatch(src, /defaultChecked/);
  });
  test('no page links straight to Stripe, bypassing the consent gate', () => {
    for (const f of fs.readdirSync(pages)) {
      if (!f.endsWith('.astro')) continue;
      const src = fs.readFileSync(path.join(pages, f), 'utf8');
      assert.doesNotMatch(src, /buy\.stripe\.com/, `${f} hard-codes a Stripe link`);
    }
  });
});

// BuyBox in both states: placeholder link -> "Coming soon"; real link -> consent-gated Buy.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
async function renderBuyBox(props) {
  const esbuild = require('esbuild');
  const src = fs.readFileSync(path.join(root, 'src/components/BuyBox.jsx'), 'utf8');
  const { code } = await esbuild.transform(src, { loader: 'jsx', jsx: 'automatic', format: 'esm' });
  const tmp = path.join(root, 'node_modules', '.buybox-test.mjs');
  fs.writeFileSync(tmp, code);
  const { default: BuyBox } = await import(`${tmp}?t=${Date.now()}`);
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(createElement(BuyBox, { priceLabel: '£9', termsHref: '/t', refundHref: '/r', ...props }));
}

describe('BuyBox sales state', () => {
  test('placeholder or empty Payment Link counts as not live', () => {
    for (const l of ['https://buy.stripe.com/REPLACE_ME', '', '  ', undefined]) {
      assert.equal(isPaymentLinkLive(l), false);
      assert.equal(checkoutUrl(l), null);
    }
    assert.equal(isPaymentLinkLive('https://buy.stripe.com/abc123'), true);
    assert.equal(checkoutUrl('https://buy.stripe.com/abc123'),
      `https://buy.stripe.com/abc123?client_reference_id=${encodeURIComponent(CONSENT_VERSION)}`);
  });

  test('no link: disabled Coming soon, no consent box, no href', async () => {
    const html = await renderBuyBox({ href: checkoutUrl('https://buy.stripe.com/REPLACE_ME'), contactEmail: 'hello@gazza.ltd' });
    assert.match(html, /<button[^>]*disabled[^>]*>\s*Coming soon/);
    assert.match(html, /Sales open soon\. Email <a href="mailto:hello@gazza\.ltd">hello@gazza\.ltd<\/a> to be notified\./);
    assert.doesNotMatch(html, /ccr-consent|type="checkbox"|stripe\.com|Buy the tracker/);
  });

  test('real link: unticked consent box and gated Buy button', async () => {
    const html = await renderBuyBox({ href: checkoutUrl('https://buy.stripe.com/abc123') });
    assert.match(html, /<input id="ccr-consent" type="checkbox"\/>/);
    assert.doesNotMatch(html, /checked/);
    assert.match(html, /aria-disabled="true"/);
    assert.match(html, /Buy the tracker/);
    assert.doesNotMatch(html, /Coming soon/);
  });
});
