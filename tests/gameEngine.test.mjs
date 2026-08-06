// Exercises the word-game engine against the real generated dictionary.
//
// `fetch` is stubbed to read the shipped shards off disk, so these tests
// check the engine and the data together. A regenerated dictionary that
// dropped words, or an engine change that broke blank handling, fails here.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME = path.join(root, 'public/data/en/game');

globalThis.fetch = async (url) => {
  const file = path.join(root, 'public', url.replace(/^\//, ''));
  if (!fs.existsSync(file)) return { ok: false, status: 404 };
  return { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
};

const { findPlays, parseRack, groupByLength } = await import(
  '../src/components/tools/gameEngine.js'
);
const { SCRABBLE, WWF, scoreWord, byScore } = await import(
  '../src/components/tools/tileData.js'
);

const words = (plays) => plays.map((p) => p.word).sort();

describe('dictionary data', () => {
  test('a shard exists for every length from 2 to 15', () => {
    for (let n = 2; n <= 15; n++) {
      assert.ok(fs.existsSync(path.join(GAME, `${n}.json`)), `missing ${n}.json`);
    }
  });

  test('the ENABLE credit ships with the data', () => {
    const licence = fs.readFileSync(path.join(GAME, 'LICENSE.txt'), 'utf8');
    assert.match(licence, /Public Domain/);
    assert.match(licence, /credit us as originators/);
  });

  test('every shard only contains words of its own length', () => {
    for (let n = 2; n <= 15; n++) {
      const shard = JSON.parse(fs.readFileSync(path.join(GAME, `${n}.json`), 'utf8'));
      for (const [key, list] of Object.entries(shard)) {
        assert.equal(key.length, n, `${n}.json has key "${key}"`);
        for (const w of list) assert.equal(w.length, n, `${n}.json has word "${w}"`);
      }
    }
  });

  test('every key is its words’ letters in sorted order', () => {
    // This is the whole basis of the lookup; if a key is unsorted its words
    // become unreachable and the tool silently under-reports.
    for (let n of [2, 3, 7]) {
      const shard = JSON.parse(fs.readFileSync(path.join(GAME, `${n}.json`), 'utf8'));
      for (const [key, list] of Object.entries(shard)) {
        for (const w of list) {
          assert.equal(w.split('').sort().join(''), key, `"${w}" filed under "${key}"`);
        }
      }
    }
  });

  test('the game dictionary has the short words SCOWL lacked', () => {
    // The reason this dictionary exists at all.
    const two = JSON.parse(fs.readFileSync(path.join(GAME, '2.json'), 'utf8'));
    const all = new Set(Object.values(two).flat());
    for (const w of ['aa', 'ae', 'oe', 'ax', 'jo', 'xu', 'ka']) {
      assert.ok(all.has(w), `"${w}" missing from the game dictionary`);
    }
  });

  test('ENABLE’s known gaps are still gaps, and stay documented', () => {
    // qi and za entered the official lists in 2006, after ENABLE2K. If they
    // ever appear here, someone has pasted in words from a copyrighted list
    // and the pages' honesty note needs revisiting either way.
    const two = JSON.parse(fs.readFileSync(path.join(GAME, '2.json'), 'utf8'));
    const all = new Set(Object.values(two).flat());
    for (const w of ['qi', 'za']) {
      assert.ok(!all.has(w), `"${w}" is present — where did it come from?`);
    }
  });
});

describe('parseRack', () => {
  test('separates letters from blanks', () => {
    assert.deepEqual(parseRack('cat?'), { letters: ['c', 'a', 't'], blanks: 1 });
    assert.deepEqual(parseRack('CAT'), { letters: ['c', 'a', 't'], blanks: 0 });
  });

  test('accepts ?, * and _ as blanks', () => {
    assert.equal(parseRack('ab?').blanks, 1);
    assert.equal(parseRack('ab*').blanks, 1);
    assert.equal(parseRack('ab_').blanks, 1);
    assert.equal(parseRack('a?*_').blanks, 3);
  });

  test('ignores punctuation and spaces', () => {
    assert.deepEqual(parseRack('c a-t.').letters, ['c', 'a', 't']);
  });
});

describe('findPlays', () => {
  test('finds every anagram and sub-word of a rack', async () => {
    const found = words(await findPlays('aet', SCRABBLE, scoreWord));
    assert.deepEqual(found, ['ae', 'at', 'ate', 'eat', 'et', 'eta', 'ta', 'tae', 'tea']);
  });

  test('never returns a word needing letters the rack lacks', async () => {
    const plays = await findPlays('quiet', SCRABBLE, scoreWord);
    const rack = { q: 1, u: 1, i: 1, e: 1, t: 1 };
    for (const { word } of plays) {
      const need = {};
      for (const ch of word) need[ch] = (need[ch] || 0) + 1;
      for (const [ch, n] of Object.entries(need)) {
        assert.ok((rack[ch] ?? 0) >= n, `"${word}" needs ${n}×${ch}`);
      }
    }
  });

  test('respects duplicate letters', async () => {
    // One 'e' cannot make "eel".
    const found = words(await findPlays('el', SCRABBLE, scoreWord));
    assert.ok(!found.includes('eel'));
    const twoE = words(await findPlays('eel', SCRABBLE, scoreWord));
    assert.ok(twoE.includes('eel'));
  });

  test('returns nothing for an unplayable rack', async () => {
    assert.deepEqual(await findPlays('qzxjvwk', SCRABBLE, scoreWord), []);
  });

  test('returns nothing for fewer than two tiles', async () => {
    assert.deepEqual(await findPlays('a', SCRABBLE, scoreWord), []);
    assert.deepEqual(await findPlays('', SCRABBLE, scoreWord), []);
  });

  test('a blank can stand in for any letter', async () => {
    const found = words(await findPlays('?e', SCRABBLE, scoreWord));
    assert.ok(found.includes('be'));
    assert.ok(found.includes('me'));
    assert.ok(found.includes('we'));
  });

  test('a blank contributes no points', async () => {
    const plays = await findPlays('?e', SCRABBLE, scoreWord);
    // Every word here is one blank plus 'e', so every score is just e = 1.
    for (const p of plays) assert.equal(p.score, 1, `${p.word} scored ${p.score}`);
  });

  test('reports the fewest blanks a word actually needs', async () => {
    // "tea" is fully covered by the real letters, so it needs no blank even
    // though a blank is available — otherwise we'd understate its score.
    const plays = await findPlays('tea?', SCRABBLE, scoreWord);
    const tea = plays.find((p) => p.word === 'tea');
    assert.equal(tea.blanksUsed, 0);
    assert.equal(tea.score, scoreWord('tea', SCRABBLE));
  });

  test('scores the same rack differently per game', async () => {
    const s = await findPlays('blue', SCRABBLE, scoreWord);
    const w = await findPlays('blue', WWF, scoreWord);
    assert.equal(s.find((p) => p.word === 'blue').score, 6);
    assert.equal(w.find((p) => p.word === 'blue').score, 9);
  });

  test('caps word length at the rack size', async () => {
    const plays = await findPlays('retinas', SCRABBLE, scoreWord);
    for (const p of plays) assert.ok(p.length <= 7, `"${p.word}" is too long`);
  });

  test('handles a full 15-tile rack without falling over', async () => {
    const plays = await findPlays('abcdefghijklmno', SCRABBLE, scoreWord);
    assert.ok(plays.length > 500);
    for (const p of plays) assert.ok(p.length <= 15);
  });
});

describe('ordering and grouping', () => {
  test('byScore puts the best play first', async () => {
    const plays = (await findPlays('retinas', SCRABBLE, scoreWord)).sort(byScore);
    for (let i = 1; i < plays.length; i++) {
      assert.ok(plays[i - 1].score >= plays[i].score, 'scores out of order');
    }
  });

  test('groupByLength returns longest first and loses nothing', async () => {
    const plays = await findPlays('retinas', SCRABBLE, scoreWord);
    const groups = groupByLength(plays);
    const lengths = groups.map((g) => g.length);
    assert.deepEqual(lengths, [...lengths].sort((a, b) => b - a));
    assert.equal(groups.reduce((n, g) => n + g.plays.length, 0), plays.length);
  });
});
