const enc = new TextEncoder();

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

/**
 * Verify a Stripe-Signature header (t=...,v1=...). Returns true/false.
 * toleranceSec: reject events older/newer than this (replay protection).
 */
export async function verifyStripeSignature(payload, header, secret, { toleranceSec = 300, now = Date.now() } = {}) {
  if (!header || !secret) return false;
  let t = null; const sigs = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=');
    if (k === 't') t = v; else if (k === 'v1' && v) sigs.push(v);
  }
  if (!t || !/^\d+$/.test(t) || sigs.length === 0) return false;
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some((s) => safeEqual(s, expected));
}

/** Fetch a Checkout Session from the Stripe API (to verify a session_id). */
export async function fetchSession(sessionId, secretKey, fetchImpl = fetch) {
  const res = await fetchImpl(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Stripe API ${res.status}`);
  return res.json();
}
