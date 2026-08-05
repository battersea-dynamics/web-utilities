// Shared logic for the developer tools. All pure functions except the SHA
// hashes, which are async because they use the browser's Web Crypto API.

/* ------------------------------------------------------------------ */
/* Hashing                                                             */
/* ------------------------------------------------------------------ */

// Web Crypto covers SHA-1 and the SHA-2 family but deliberately omits MD5,
// which is cryptographically broken. MD5 is still needed for checksums and
// legacy interop, so it is implemented here.

function md5cycle(x, k) {
  let [a, b, c, d] = x;
  const ff = (a, b, c, d, x, s, t) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a, b, c, d, x, s, t) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | ~d), a, b, x, s, t);
  function cmn(q, a, b, x, s, t) {
    a = (((a + q) | 0) + ((x + t) | 0)) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }

  a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = (a + x[0]) | 0; x[1] = (b + x[1]) | 0;
  x[2] = (c + x[2]) | 0; x[3] = (d + x[3]) | 0;
}

function md5blk(s) {
  const md5blks = [];
  for (let i = 0; i < 64; i += 4) {
    md5blks[i >> 2] =
      s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) +
      (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}

/** MD5 of a string, returned as lowercase hex. */
export function md5(input) {
  // Work on UTF-8 bytes so non-ASCII input hashes correctly.
  const s = unescape(encodeURIComponent(input));
  const n = s.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));

  const tail = new Array(16).fill(0);
  const rest = s.substring(i - 64);
  for (i = 0; i < rest.length; i++) {
    tail[i >> 2] |= rest.charCodeAt(i) << ((i % 4) << 3);
  }
  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  if (i > 55) {
    md5cycle(state, tail);
    tail.fill(0);
  }
  tail[14] = n * 8;
  md5cycle(state, tail);

  const hex = (num) => {
    let out = '';
    for (let j = 0; j < 4; j++) {
      out += ((num >> (j * 8 + 4)) & 0x0f).toString(16) + ((num >> (j * 8)) & 0x0f).toString(16);
    }
    return out;
  };
  return state.map(hex).join('');
}

export const SHA_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

/** SHA hash via Web Crypto. Returns lowercase hex. */
export async function sha(input, algorithm = 'SHA-256') {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ------------------------------------------------------------------ */
/* Base64 and URL encoding                                             */
/* ------------------------------------------------------------------ */

/** UTF-8 safe Base64 encode. btoa alone breaks on non-Latin characters. */
export function base64Encode(input, urlSafe = false) {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  const out = btoa(binary);
  return urlSafe ? out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : out;
}

export function base64Decode(input) {
  try {
    let s = input.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const binary = atob(s);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { ok: true, value: new TextDecoder().decode(bytes) };
  } catch {
    return { ok: false, reason: 'That is not valid Base64.' };
  }
}

export function urlEncode(input, component = true) {
  return component ? encodeURIComponent(input) : encodeURI(input);
}

export function urlDecode(input, component = true) {
  try {
    return { ok: true, value: component ? decodeURIComponent(input) : decodeURI(input) };
  } catch {
    return { ok: false, reason: 'That contains an invalid escape sequence.' };
  }
}

/* ------------------------------------------------------------------ */
/* JSON                                                                */
/* ------------------------------------------------------------------ */

export function formatJson(input, indent = 2) {
  if (!input.trim()) return { ok: false, reason: '' };
  try {
    const parsed = JSON.parse(input);
    return {
      ok: true,
      pretty: JSON.stringify(parsed, null, indent),
      minified: JSON.stringify(parsed),
      // A quick sense of what was parsed, useful for spotting a wrong paste.
      type: Array.isArray(parsed) ? 'array' : parsed === null ? 'null' : typeof parsed,
      count: Array.isArray(parsed)
        ? parsed.length
        : parsed && typeof parsed === 'object'
          ? Object.keys(parsed).length
          : null,
    };
  } catch (e) {
    // Some engines already report line and column; others give only a byte
    // offset. Add our own only when it is missing, so it never doubles up.
    let msg = e.message.replace(/^JSON\.parse: /, '');
    if (!/line \d+/i.test(msg)) {
      const m = /position (\d+)/.exec(msg);
      if (m) {
        const before = input.slice(0, Number(m[1]));
        const line = before.split('\n').length;
        const col = Number(m[1]) - before.lastIndexOf('\n');
        msg += ` (line ${line}, column ${col})`;
      }
    }
    return { ok: false, reason: msg };
  }
}

/* ------------------------------------------------------------------ */
/* Unix timestamps                                                     */
/* ------------------------------------------------------------------ */

/** Seconds or milliseconds → a set of readable representations. */
export function fromTimestamp(value, unit = 'seconds') {
  const ms = unit === 'seconds' ? value * 1000 : value;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return { ok: false, reason: 'That is not a valid timestamp.' };
  return {
    ok: true,
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: d.toString(),
    localeDate: d.toLocaleString('en-GB', { timeZone: undefined }),
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    relative: relativeTime(ms),
  };
}

/** An ISO or date-time string → timestamps. */
export function toTimestamp(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return { ok: false, reason: 'Could not read that as a date.' };
  return {
    ok: true,
    seconds: Math.floor(d.getTime() / 1000),
    milliseconds: d.getTime(),
    iso: d.toISOString(),
  };
}

export function relativeTime(ms, now = Date.now()) {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const units = [
    ['year', 31557600000], ['month', 2629800000], ['day', 86400000],
    ['hour', 3600000], ['minute', 60000], ['second', 1000],
  ];
  for (const [name, size] of units) {
    if (abs >= size || name === 'second') {
      const n = Math.round(abs / size);
      const plural = n === 1 ? name : `${name}s`;
      return diff < 0 ? `${n} ${plural} ago` : `in ${n} ${plural}`;
    }
  }
  return 'now';
}

/* ------------------------------------------------------------------ */
/* Number bases                                                        */
/* ------------------------------------------------------------------ */

export function convertBase(input, fromBase) {
  const cleaned = String(input).trim().replace(/\s+/g, '').replace(/^0[bxo]/i, '');
  if (!cleaned) return { ok: false, reason: '' };

  const valid = /^[0-9a-zA-Z]+$/.test(cleaned);
  if (!valid) return { ok: false, reason: 'Only letters and digits are allowed.' };

  // Reject digits that do not exist in the source base, which parseInt
  // silently tolerates by stopping early.
  for (const ch of cleaned.toLowerCase()) {
    const digit = parseInt(ch, 36);
    if (isNaN(digit) || digit >= fromBase) {
      return { ok: false, reason: `"${ch}" is not a valid digit in base ${fromBase}.` };
    }
  }

  const value = parseInt(cleaned, fromBase);
  if (!isFinite(value)) return { ok: false, reason: 'That number is too large.' };

  return {
    ok: true,
    decimal: value,
    binary: value.toString(2),
    octal: value.toString(8),
    hex: value.toString(16).toUpperCase(),
    // Handy for anyone working with permissions or byte sizes.
    bytes: value.toString(2).length,
  };
}

/* ------------------------------------------------------------------ */
/* UUID                                                                */
/* ------------------------------------------------------------------ */

/** RFC 4122 version 4 UUID, using the platform generator when available. */
export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
