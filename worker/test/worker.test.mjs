import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyStripeSignature, hmacHex } from '../src/stripe.js';
import { issueOrder, consumeToken } from '../src/tokens.js';
import { productForSession, PRODUCTS } from '../src/products.js';
import worker from '../src/index.js';

class MemKV {
  constructor() { this.m = new Map(); }
  async get(k, type) { const v = this.m.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, v); }
}
const SECRET = 'whsec_test';
const sign = async (payload, t = Math.floor(Date.now() / 1000), secret = SECRET) => `t=${t},v1=${await hmacHex(secret, `${t}.${payload}`)}`;

test('valid Stripe signature is accepted', async () => {
  const p = '{"a":1}';
  assert.equal(await verifyStripeSignature(p, await sign(p), SECRET), true);
});
test('tampered payload, wrong secret, missing header and old timestamp are rejected', async () => {
  const p = '{"a":1}';
  assert.equal(await verifyStripeSignature('{"a":2}', await sign(p), SECRET), false);
  assert.equal(await verifyStripeSignature(p, await sign(p, undefined, 'other'), SECRET), false);
  assert.equal(await verifyStripeSignature(p, null, SECRET), false);
  assert.equal(await verifyStripeSignature(p, await sign(p, Math.floor(Date.now() / 1000) - 600), SECRET), false);
});

test('product is identified from metadata, payment link, or client_reference_id', () => {
  assert.equal(productForSession({ metadata: { product: 'winter-arc-tracker' } }), 'winter-arc-tracker');
  assert.equal(productForSession({ payment_link: 'plink_1' }, { PAYMENT_LINK_MTD: 'plink_1' }), 'mtd-tracker');
  assert.equal(productForSession({ payment_link: 'plink_b' }, { PAYMENT_LINK_WINTER_ARC: 'plink_a, plink_b' }), 'winter-arc-tracker');
  assert.equal(productForSession({ client_reference_id: 'ccr-2026-10-v1' }), null);
  assert.equal(productForSession({ client_reference_id: 'mtd-tracker:ccr-2026-10-v1' }), 'mtd-tracker');
});

test('tokens expire after 72 hours', async () => {
  const kv = new MemKV(); const t0 = Date.now();
  const { order } = await issueOrder(kv, { sessionId: 'cs_test_1', product: 'mtd-tracker', files: PRODUCTS['mtd-tracker'].files }, {}, t0);
  const tok = order.tokens.workbook;
  assert.equal((await consumeToken(kv, tok, t0 + 71.9 * 3600e3)).ok, true);
  assert.deepEqual(await consumeToken(kv, tok, t0 + 72 * 3600e3), { ok: false, reason: 'expired' });
});

test('tokens allow 5 downloads then refuse', async () => {
  const kv = new MemKV();
  const { order } = await issueOrder(kv, { sessionId: 'cs_test_2', product: 'winter-arc-tracker', files: PRODUCTS['winter-arc-tracker'].files });
  for (let i = 0; i < 5; i++) assert.equal((await consumeToken(kv, order.tokens.colour)).ok, true);
  assert.equal((await consumeToken(kv, order.tokens.colour)).reason, 'limit');
  // the printer-friendly link has its own allowance
  assert.equal((await consumeToken(kv, order.tokens.printer)).ok, true);
  assert.equal((await consumeToken(kv, 'nope')).reason, 'missing');
});

test('issueOrder is idempotent per session', async () => {
  const kv = new MemKV(); const files = PRODUCTS['winter-arc-tracker'].files;
  const a = await issueOrder(kv, { sessionId: 'cs_test_3', product: 'winter-arc-tracker', files });
  const b = await issueOrder(kv, { sessionId: 'cs_test_3', product: 'winter-arc-tracker', files });
  assert.equal(b.created, false); assert.deepEqual(a.order.tokens, b.order.tokens);
});

test('end to end: webhook -> download-link API -> download streams from R2', async () => {
  const kv = new MemKV();
  const r2 = { async get(k) { return k === 'winter-arc/winter-arc-tracker-A4.pdf' ? { body: 'PDFDATA' } : null; } };
  const env = { DOWNLOADS: kv, FILES: r2, STRIPE_WEBHOOK_SECRET: SECRET };
  const event = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_abc', payment_status: 'paid', metadata: { product: 'winter-arc-tracker' }, client_reference_id: 'ccr-2026-10-v1', customer_details: { email: 'a@example.com' } } } });
  const bad = await worker.fetch(new Request('https://shop.gazza.ltd/webhook/stripe', { method: 'POST', body: event, headers: { 'Stripe-Signature': 't=1,v1=00' } }), env);
  assert.equal(bad.status, 400);
  const ok = await worker.fetch(new Request('https://shop.gazza.ltd/webhook/stripe', { method: 'POST', body: event, headers: { 'Stripe-Signature': await sign(event) } }), env);
  assert.equal(ok.status, 200);
  const api = await worker.fetch(new Request('https://shop.gazza.ltd/api/download-link?session_id=cs_test_abc'), env);
  const body = await api.json();
  assert.equal(body.files.length, 2);
  const dl = await worker.fetch(new Request(body.files[0].url), env);
  assert.equal(dl.status, 200);
  assert.equal(await dl.text(), 'PDFDATA');
  const thanks = await worker.fetch(new Request('https://shop.gazza.ltd/thanks?session_id=cs_test_abc'), env);
  assert.match(await thanks.text(), /printer-friendly/);
});
