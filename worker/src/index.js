import { PRODUCTS, productForSession } from './products.js';
import { verifyStripeSignature, fetchSession } from './stripe.js';
import { issueOrder, consumeToken, limits } from './tokens.js';
import { sendDownloadEmail } from './email.js';

const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]+$/;

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.SITE_ORIGIN || 'https://gazza.ltd',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  };
}
const json = (body, status, env) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(env) },
});
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function linksFor(order, env, base) {
  const p = PRODUCTS[order.product];
  return p.files.map((f) => ({ id: f.id, label: f.label, url: `${base}/d/${order.tokens[f.id]}` }));
}

/** Issue tokens for a paid session (shared by webhook and thank-you lookups). */
async function deliver(session, env, ctx) {
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') { env.__reason = 'not_paid'; return null; }
  const product = productForSession(session, env);
  if (!product) { env.__reason = 'unknown_product'; console.error('Unknown product for session', session.id); return null; }
  const email = session.customer_details?.email || session.customer_email || null;
  const { order, created } = await issueOrder(env.DOWNLOADS, { sessionId: session.id, product, files: PRODUCTS[product].files, email }, env);
  if (created && email && env.RESEND_API_KEY) {
    const base = env.PUBLIC_BASE_URL || 'https://shop.gazza.ltd';
    const p = sendDownloadEmail(env, { to: email, productName: PRODUCTS[product].name, links: linksFor(order, env, base), consent: session.client_reference_id, orderRef: session.id })
      .catch((e) => console.error('Email failed (download page still works):', e.message));
    if (ctx?.waitUntil) ctx.waitUntil(p); else await p;
  }
  return order;
}

/** Find (or, after checking with Stripe, create) the order for a session_id. */
async function orderForSessionId(sessionId, env, ctx) {
  const existing = await env.DOWNLOADS.get(`order:${sessionId}`, 'json');
  if (existing) return existing;
  if (!env.STRIPE_SECRET_KEY) { env.__reason = 'no_stripe_key'; return null; }
  const session = await fetchSession(sessionId, env.STRIPE_SECRET_KEY);
  if (!session) { env.__reason = 'stripe_session_not_found'; return null; }
  return deliver(session, env, ctx);
}

async function handleWebhook(request, env, ctx) {
  const payload = await request.text();
  const ok = await verifyStripeSignature(payload, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response('Invalid signature', { status: 400 });
  const event = JSON.parse(payload);
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await deliver(event.data.object, env, ctx);
  }
  return new Response('ok', { status: 200 });
}

async function handleDownload(token, env) {
  const r = await consumeToken(env.DOWNLOADS, token);
  if (!r.ok) {
    const msg = { missing: 'This download link is not valid.', expired: 'This download link has expired.', limit: 'This download link has been used the maximum number of times.' }[r.reason];
    return htmlPage('Download unavailable', `<p>${msg}</p><p>Email <a href="mailto:${esc(env.SUPPORT_EMAIL || 'hello@gazza.ltd')}">${esc(env.SUPPORT_EMAIL || 'hello@gazza.ltd')}</a> with your order email and we'll send a new link.</p>`, 410);
  }
  const file = PRODUCTS[r.record.product]?.files.find((f) => f.id === r.record.fileId);
  const obj = file && await env.FILES.get(file.key);
  if (!obj) { console.error('Missing R2 object', file?.key); return htmlPage('File missing', '<p>Sorry, the file could not be found. Please email us and we will send it.</p>', 500); }
  return new Response(obj.body, { headers: {
    'Content-Type': file.contentType,
    'Content-Disposition': `attachment; filename="${file.filename}"`,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  } });
}

function htmlPage(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | gazza.ltd</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.5}.btn{display:inline-block;padding:.7rem 1rem;margin:.3rem 0;background:#1d3b6e;color:#fff;border-radius:6px;text-decoration:none}</style></head>
<body><h1>${esc(title)}</h1>${body}<p><a href="https://gazza.ltd/">Back to gazza.ltd</a></p></body></html>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

async function handleThanks(url, env, ctx) {
  const sid = url.searchParams.get('session_id') || '';
  if (!SESSION_RE.test(sid)) return htmlPage('Thank you', '<p>We could not find your order reference. Please email hello@gazza.ltd with your order email and we will send a new link.</p>', 400);
  // The webhook may not have arrived yet; check with Stripe directly.
  const order = await orderForSessionId(sid, env, ctx);
  if (!order) {
    const r = htmlPage('Thank you', '<p>We are still confirming your payment. Refresh this page in a few seconds.</p>', 202);
    // Non-sensitive reason code, visible only in response headers, to help support.
    r.headers.set('X-Pending-Reason', env.__reason || 'unknown');
    return r;
  }
  const { ttlHours, maxDownloads } = limits(env);
  const links = linksFor(order, env, url.origin).map((l) => `<p><a class="btn" href="${esc(l.url)}">${esc(l.label)}</a></p>`).join('');
  return htmlPage('Thank you for your order', `<p>Your ${esc(PRODUCTS[order.product].name)} is ready.</p>${links}
<p>Each link works for ${ttlHours} hours and up to ${maxDownloads} downloads. Save the files somewhere safe.${env.RESEND_API_KEY ? ' We have also emailed you these links.' : ''}</p>`);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) });
      if (request.method === 'POST' && url.pathname === '/webhook/stripe') return handleWebhook(request, env, ctx);
      if (request.method === 'GET' && url.pathname.startsWith('/d/')) return handleDownload(url.pathname.slice(3), env);
      if (request.method === 'GET' && url.pathname === '/thanks') return handleThanks(url, env, ctx);
      if (request.method === 'GET' && url.pathname === '/api/download-link') {
        // Used by gazza.ltd/mtd-tracker-thanks/. 404 = not ready yet (page retries).
        const sid = url.searchParams.get('session_id') || '';
        if (!SESSION_RE.test(sid)) return json({ error: 'bad session_id' }, 400, env);
        const order = await orderForSessionId(sid, env, ctx);
        if (!order) return json({ error: 'not ready' }, 404, env);
        const files = linksFor(order, env, url.origin);
        return json({ url: files[0].url, files, product: order.product }, 200, env);
      }
      if (url.pathname === '/') return new Response('gazza.ltd delivery service', { headers: { 'X-Robots-Tag': 'noindex' } });
      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.error(e);
      return new Response('Server error', { status: 500 });
    }
  },
};
