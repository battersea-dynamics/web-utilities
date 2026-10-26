// Download tokens, stored in Workers KV.
//   order:<session_id> -> { product, email, tokens: { fileId: token }, created }
//   token:<token>      -> { session, product, fileId, created, expires, downloads, max }
// Both expire automatically (KV expirationTtl) after the link lifetime, which
// matches the privacy policy ("deleted automatically after 72 hours").
// Note: KV is not transactional, so two downloads in the same instant could
// both be counted as one. That is acceptable for a 5-download allowance.

export const DEFAULTS = { ttlHours: 72, maxDownloads: 5 };

export function limits(env = {}) {
  return {
    ttlHours: Number(env.LINK_TTL_HOURS) || DEFAULTS.ttlHours,
    maxDownloads: Number(env.MAX_DOWNLOADS) || DEFAULTS.maxDownloads,
  };
}

export function newToken() {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Create (or return the existing) order + tokens for a paid session. Idempotent per session. */
export async function issueOrder(kv, { sessionId, product, files, email }, env = {}, now = Date.now()) {
  const existing = await kv.get(`order:${sessionId}`, 'json');
  if (existing) return { order: existing, created: false };
  const { ttlHours, maxDownloads } = limits(env);
  const ttl = ttlHours * 3600;
  const expires = now + ttl * 1000;
  const tokens = {};
  for (const f of files) {
    const token = newToken();
    tokens[f.id] = token;
    await kv.put(`token:${token}`, JSON.stringify({ session: sessionId, product, fileId: f.id, created: now, expires, downloads: 0, max: maxDownloads }), { expirationTtl: ttl });
  }
  const order = { product, email: email || null, tokens, created: now, expires, emailed: false };
  await kv.put(`order:${sessionId}`, JSON.stringify(order), { expirationTtl: ttl });
  return { order, created: true };
}

/**
 * Check a token and, if it is still valid, count one download.
 * Returns { ok: true, record } or { ok: false, reason: 'missing'|'expired'|'limit' }.
 */
export async function consumeToken(kv, token, now = Date.now()) {
  if (!token || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return { ok: false, reason: 'missing' };
  const rec = await kv.get(`token:${token}`, 'json');
  if (!rec) return { ok: false, reason: 'missing' };
  if (now >= rec.expires) return { ok: false, reason: 'expired' };
  if (rec.downloads >= rec.max) return { ok: false, reason: 'limit' };
  rec.downloads += 1;
  const ttl = Math.max(60, Math.ceil((rec.expires - now) / 1000));
  await kv.put(`token:${token}`, JSON.stringify(rec), { expirationTtl: ttl });
  return { ok: true, record: rec };
}
