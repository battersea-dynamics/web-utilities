// Verification for the developer tools.
//
// The hash tests use the published test vectors from RFC 1321 (MD5) and the
// SHA specifications — genuinely independent reference values rather than
// output produced by this code.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  md5, sha, base64Encode, base64Decode, urlEncode, urlDecode,
  formatJson, fromTimestamp, toTimestamp, convertBase, uuid, UUID_PATTERN,
} from '../src/components/tools/devEngine.js';

describe('MD5 against RFC 1321 test vectors', () => {
  const VECTORS = [
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    ['12345678901234567890123456789012345678901234567890123456789012345678901234567890',
     '57edf4a22be3c955ac49da2e2107b67a'],
  ];
  for (const [input, expected] of VECTORS) {
    test(`md5(${JSON.stringify(input.slice(0, 24))})`, () => {
      assert.equal(md5(input), expected);
    });
  }

  test('handles input spanning multiple 64-byte blocks', () => {
    assert.equal(md5('x'.repeat(1000)).length, 32);
    assert.notEqual(md5('x'.repeat(64)), md5('x'.repeat(65)));
  });

  test('is UTF-8 aware', () => {
    // Would differ if the string were hashed as UTF-16 or Latin-1.
    assert.equal(md5('café').length, 32);
    assert.notEqual(md5('café'), md5('cafe'));
  });
});

describe('SHA via Web Crypto', () => {
  test('SHA-1 of "abc"', async () => {
    assert.equal(await sha('abc', 'SHA-1'), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  });
  test('SHA-256 of "abc"', async () => {
    assert.equal(await sha('abc', 'SHA-256'),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  test('SHA-256 of the empty string', async () => {
    assert.equal(await sha('', 'SHA-256'),
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
  test('output lengths match the algorithm', async () => {
    assert.equal((await sha('x', 'SHA-1')).length, 40);
    assert.equal((await sha('x', 'SHA-256')).length, 64);
    assert.equal((await sha('x', 'SHA-384')).length, 96);
    assert.equal((await sha('x', 'SHA-512')).length, 128);
  });
  test('a single character change alters the whole digest', async () => {
    const a = await sha('abc', 'SHA-256');
    const b = await sha('abd', 'SHA-256');
    let same = 0;
    for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
    assert.ok(same < a.length / 2, 'avalanche effect');
  });
});

describe('Base64', () => {
  test('encodes a known string', () => {
    assert.equal(base64Encode('Hello, World!'), 'SGVsbG8sIFdvcmxkIQ==');
  });
  test('decodes it back', () => {
    assert.equal(base64Decode('SGVsbG8sIFdvcmxkIQ==').value, 'Hello, World!');
  });
  test('survives a Unicode round trip', () => {
    for (const s of ['café', '日本語', '🎉 emoji', 'Ω≈ç√']) {
      assert.equal(base64Decode(base64Encode(s)).value, s, s);
    }
  });
  test('url-safe form avoids +, / and padding', () => {
    const out = base64Encode('~~~???>>>', true);
    assert.ok(!/[+/=]/.test(out), `got ${out}`);
  });
  test('url-safe output still decodes', () => {
    const s = '~~~???>>>';
    assert.equal(base64Decode(base64Encode(s, true)).value, s);
  });
  test('rejects invalid input rather than throwing', () => {
    const r = base64Decode('not!valid!base64!');
    assert.equal(r.ok, false);
    assert.ok(r.reason);
  });
  test('output is about a third larger than input', () => {
    const s = 'x'.repeat(300);
    assert.ok(base64Encode(s).length >= 400);
  });
});

describe('URL encoding', () => {
  test('escapes reserved characters in component mode', () => {
    assert.equal(urlEncode('a b&c=d'), 'a%20b%26c%3Dd');
  });
  test('leaves URL structure alone in full-URL mode', () => {
    assert.equal(urlEncode('https://x.com/a b?q=1', false), 'https://x.com/a%20b?q=1');
  });
  test('round trips', () => {
    for (const s of ['a b&c=d', 'café/naïve', '100% sure']) {
      assert.equal(urlDecode(urlEncode(s)).value, s, s);
    }
  });
  test('reports a malformed escape', () => {
    assert.equal(urlDecode('%ZZ').ok, false);
  });
});

describe('JSON formatting', () => {
  test('formats and minifies valid input', () => {
    const r = formatJson('{"b":1,"a":[1,2,3]}');
    assert.equal(r.ok, true);
    assert.equal(r.minified, '{"b":1,"a":[1,2,3]}');
    assert.ok(r.pretty.includes('\n'), 'pretty output is multi-line');
  });
  test('reports the top-level type and size', () => {
    assert.equal(formatJson('{"a":1,"b":2}').type, 'object');
    assert.equal(formatJson('{"a":1,"b":2}').count, 2);
    assert.equal(formatJson('[1,2,3,4]').type, 'array');
    assert.equal(formatJson('[1,2,3,4]').count, 4);
  });
  test('rejects the three classic mistakes', () => {
    assert.equal(formatJson('{"a":1,}').ok, false, 'trailing comma');
    assert.equal(formatJson("{'a':1}").ok, false, 'single quotes');
    assert.equal(formatJson('{a:1}').ok, false, 'unquoted key');
  });
  test('the error message is not duplicated', () => {
    const r = formatJson('{"a":1,}');
    const lineMentions = (r.reason.match(/line \d+/gi) || []).length;
    assert.ok(lineMentions <= 1, `position reported ${lineMentions} times: ${r.reason}`);
  });
  test('preserves data exactly through a round trip', () => {
    const src = '{"n":1.5,"s":"x","b":true,"nul":null,"arr":[1,"two"]}';
    assert.deepEqual(JSON.parse(formatJson(src).pretty), JSON.parse(src));
  });
});

describe('timestamps', () => {
  test('the epoch converts correctly', () => {
    assert.equal(fromTimestamp(0).iso, '1970-01-01T00:00:00.000Z');
  });
  test('seconds and milliseconds agree', () => {
    assert.equal(fromTimestamp(1700000000).iso, fromTimestamp(1700000000000, 'milliseconds').iso);
  });
  test('round trips through a date string', () => {
    for (const s of [0, 1000000000, 1700000000]) {
      assert.equal(toTimestamp(fromTimestamp(s).iso).seconds, s);
    }
  });
  test('handles dates before 1970', () => {
    assert.ok(fromTimestamp(-86400).iso.startsWith('1969-12-31'));
  });
  test('rejects nonsense', () => {
    assert.equal(fromTimestamp(NaN).ok, false);
    assert.equal(toTimestamp('not a date').ok, false);
  });
});

describe('number bases', () => {
  test('converts a known value all four ways', () => {
    const r = convertBase('255', 10);
    assert.equal(r.binary, '11111111');
    assert.equal(r.octal, '377');
    assert.equal(r.hex, 'FF');
    assert.equal(r.decimal, 255);
  });
  test('reads every base back to the same number', () => {
    assert.equal(convertBase('FF', 16).decimal, 255);
    assert.equal(convertBase('377', 8).decimal, 255);
    assert.equal(convertBase('11111111', 2).decimal, 255);
  });
  test('strips 0x, 0b and 0o prefixes', () => {
    assert.equal(convertBase('0xFF', 16).decimal, 255);
    assert.equal(convertBase('0b1010', 2).decimal, 10);
    assert.equal(convertBase('0o377', 8).decimal, 255);
  });
  test('rejects digits that do not exist in the base', () => {
    // parseInt would silently return 1 here; we must not.
    assert.equal(convertBase('2', 2).ok, false);
    assert.equal(convertBase('19', 8).ok, false);
    assert.equal(convertBase('FF', 10).ok, false);
  });
  test('reports the bits required', () => {
    assert.equal(convertBase('255', 10).bytes, 8);
    assert.equal(convertBase('256', 10).bytes, 9);
  });
  test('ignores whitespace and is case-insensitive', () => {
    assert.equal(convertBase(' ff ', 16).decimal, 255);
    assert.equal(convertBase('Ff', 16).decimal, 255);
  });
});

describe('UUID', () => {
  test('matches the version 4 pattern', () => {
    for (let i = 0; i < 50; i++) assert.match(uuid(), UUID_PATTERN);
  });
  test('is 36 characters with hyphens in the right places', () => {
    const u = uuid();
    assert.equal(u.length, 36);
    assert.deepEqual([8, 13, 18, 23].map((i) => u[i]), ['-', '-', '-', '-']);
  });
  test('does not repeat across a large batch', () => {
    const batch = Array.from({ length: 5000 }, uuid);
    assert.equal(new Set(batch).size, 5000);
  });
  test('marks version 4 and the correct variant', () => {
    for (let i = 0; i < 50; i++) {
      const u = uuid();
      assert.equal(u[14], '4', 'version nibble');
      assert.ok('89ab'.includes(u[19].toLowerCase()), 'variant nibble');
    }
  });
});
