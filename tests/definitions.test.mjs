// Checks the generated definition shards and the client-side lookup.
//
// The lookup normally runs in a browser and fetches over HTTP, so `fetch`
// is stubbed here to read the same files straight off disk. That keeps the
// test honest: it exercises the real engine against the real shipped data,
// not a fixture that could drift away from it.

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFS = path.join(root, 'public/data/en/defs');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

globalThis.fetch = async (url) => {
  const file = path.join(root, 'public', url.replace(/^\//, ''));
  if (!fs.existsSync(file)) return { ok: false, status: 404 };
  return { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
};

const { lookup, shardKey, POS_LABEL } = await import(
  '../src/components/tools/definitionEngine.js'
);

const shards = {};
before(() => {
  for (const l of LETTERS) {
    const f = path.join(DEFS, `${l}.json`);
    if (fs.existsSync(f)) shards[l] = JSON.parse(fs.readFileSync(f, 'utf8'));
  }
});

describe('shard files', () => {
  test('one exists for every letter of the alphabet', () => {
    for (const l of LETTERS) {
      assert.ok(fs.existsSync(path.join(DEFS, `${l}.json`)), `missing shard ${l}.json`);
    }
  });

  test('every shard has the expected shape', () => {
    for (const [l, s] of Object.entries(shards)) {
      assert.equal(typeof s.d, 'object', `${l}: missing d`);
      assert.equal(typeof s.f, 'object', `${l}: missing f`);
    }
  });

  test('every inflection points at a base form present in the same shard', () => {
    for (const [l, s] of Object.entries(shards)) {
      for (const [form, base] of Object.entries(s.f)) {
        assert.ok(s.d[base], `${l}: ${form} -> ${base}, but ${base} has no definition`);
      }
    }
  });

  test('every entry has a part of speech we can label and a non-empty gloss', () => {
    for (const [l, s] of Object.entries(shards)) {
      for (const [word, [pos, gloss]] of Object.entries(s.d)) {
        assert.ok(POS_LABEL[pos], `${l}: ${word} has unknown pos "${pos}"`);
        assert.ok(gloss && gloss.length > 0, `${l}: ${word} has an empty gloss`);
      }
    }
  });

  test('a gloss never leaks WordNet example usage', () => {
    // Examples follow a semicolon and are wrapped in quotes. If one shows up
    // the parser has regressed.
    for (const [l, s] of Object.entries(shards)) {
      for (const [word, [, gloss]] of Object.entries(s.d)) {
        assert.ok(!gloss.includes('"'), `${l}: ${word} gloss contains a quoted example`);
      }
    }
  });

  test('the WordNet licence ships alongside the data', () => {
    // Not optional. WordNet's licence requires the copyright notice and the
    // disclaimer to travel with every copy of the database, "including
    // modifications that you make" — which these derived shards are.
    const licence = path.join(DEFS, 'LICENSE.txt');
    assert.ok(fs.existsSync(licence), 'LICENSE.txt is missing from the defs directory');
    const text = fs.readFileSync(licence, 'utf8');
    assert.match(text, /Copyright 2006 by Princeton University/);
    assert.match(text, /AS IS/, 'the disclaimer must be present, not just the notice');
  });

  test('the SCOWL word-list notice ships alongside the word data', () => {
    // Same requirement as WordNet: permissive, but the copyright notice has
    // to appear in all copies, and words.json is a copy.
    const licence = path.join(root, 'public/data/en/WORDLIST-LICENSE.txt');
    assert.ok(fs.existsSync(licence), 'WORDLIST-LICENSE.txt is missing');
    assert.match(fs.readFileSync(licence, 'utf8'), /Copyright 2000-2016 by Kevin Atkinson/);
  });

  test('no shard is big enough to hurt on a phone', () => {
    // A click should cost tens of KB, not hundreds. Uncompressed 600KB is
    // roughly 120KB over the wire once Cloudflare gzips it.
    for (const l of LETTERS) {
      const kb = fs.statSync(path.join(DEFS, `${l}.json`)).size / 1024;
      assert.ok(kb < 600, `${l}.json is ${kb.toFixed(0)}KB — too large for one lookup`);
    }
  });
});

describe('coverage', () => {
  test('at least 90% of the dictionary has a definition', () => {
    const words = JSON.parse(
      fs.readFileSync(path.join(root, 'public/data/en/words.json'), 'utf8')
    );
    let covered = 0;
    for (const w of words) {
      const s = shards[shardKey(w)];
      if (s && (s.d[w] || s.f[w])) covered++;
    }
    const pct = (covered / words.length) * 100;
    assert.ok(pct >= 90, `only ${pct.toFixed(1)}% covered`);
  });
});

describe('lookup', () => {
  test('finds a word stored directly', async () => {
    const r = await lookup('petal');
    assert.ok(r, 'petal should be found');
    assert.equal(r.pos, 'n');
    assert.equal(r.base, null);
    assert.match(r.gloss, /perianth|flower/i);
  });

  test('resolves a regular plural back to its base form', async () => {
    const r = await lookup('petals');
    assert.ok(r, 'petals should resolve');
    assert.equal(r.base, 'petal');
    assert.match(r.gloss, /perianth|flower/i);
  });

  test('resolves -ies plurals', async () => {
    const r = await lookup('berries');
    assert.ok(r, 'berries should resolve');
    assert.equal(r.base, 'berry');
  });

  test('resolves -ves plurals', async () => {
    const r = await lookup('knives');
    assert.ok(r, 'knives should resolve');
    assert.equal(r.base, 'knife');
  });

  test('resolves a doubled-consonant verb form', async () => {
    const r = await lookup('running');
    assert.ok(r, 'running should resolve');
    assert.ok(r.base === 'run' || r.base === null);
  });

  test('is case-insensitive', async () => {
    const a = await lookup('PETAL');
    const b = await lookup('petal');
    assert.deepEqual(a, b);
  });

  test('returns null rather than throwing for a word with no entry', async () => {
    const r = await lookup('zzzzznotaword');
    assert.equal(r, null);
  });

  test('survives a missing shard file', async () => {
    // The word list is the product; a broken definitions file must degrade
    // to "no definition", never to a crash.
    const r = await lookup('word', 'nosuchlang');
    assert.equal(r, null);
  });

  test('every part-of-speech tag has a human label', () => {
    assert.deepEqual(Object.keys(POS_LABEL).sort(), ['adj', 'adv', 'n', 'v']);
  });
});

describe('spot checks against known meanings', () => {
  // A handful of unambiguous words, checked so a parser change that silently
  // pairs words with the wrong glosses gets caught.
  const cases = [
    ['dog', /canine|domesticated|carnivore/i],
    ['island', /land|water|surrounded/i],
    ['rain', /water|precipitation|drops/i],
    ['piano', /keyboard|instrument|musical/i],
    ['doctor', /medic|physician|health|treat/i],
  ];
  for (const [word, pattern] of cases) {
    test(`${word} has a plausible definition`, async () => {
      const r = await lookup(word);
      assert.ok(r, `${word} should have a definition`);
      assert.match(r.gloss, pattern, `${word}: got "${r.gloss}"`);
    });
  }
});
