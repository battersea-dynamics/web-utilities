// Verifies the tile data against independently published totals.
//
// The point of checking totals rather than spot-checking letters: both games
// publish an exact tile count and an exact sum of all points on the board.
// Those are two separate checksums over the same 26 values, so a single
// mistyped number fails at least one of them. Spot-checking a handful of
// letters would not catch a wrong count on an unchecked letter.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SCRABBLE, WWF, GAMES, scoreWord, byScore } from '../src/components/tools/tileData.js';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

for (const game of [SCRABBLE, WWF]) {
  describe(game.name, () => {
    test('every letter has a value and a count', () => {
      for (const ch of LETTERS) {
        assert.equal(typeof game.values[ch], 'number', `${ch} has no value`);
        assert.equal(typeof game.counts[ch], 'number', `${ch} has no count`);
      }
      assert.equal(Object.keys(game.values).length, 26);
      assert.equal(Object.keys(game.counts).length, 26);
    });

    test(`tiles sum to ${game.totalTiles}, including blanks`, () => {
      const tiles = LETTERS.reduce((n, ch) => n + game.counts[ch], 0) + game.blanks;
      assert.equal(tiles, game.totalTiles);
    });

    test(`points across all tiles sum to ${game.totalPoints}`, () => {
      const points = LETTERS.reduce((n, ch) => n + game.counts[ch] * game.values[ch], 0);
      assert.equal(points, game.totalPoints);
    });

    test('no value or count is zero or negative', () => {
      for (const ch of LETTERS) {
        assert.ok(game.values[ch] > 0, `${ch} scores ${game.values[ch]}`);
        assert.ok(game.counts[ch] > 0, `${ch} has ${game.counts[ch]} tiles`);
      }
    });
  });
}

describe('known letter values', () => {
  // A few values that differ between the two games — these catch the data
  // being copied from one game to the other.
  test('Scrabble and WWF genuinely differ', () => {
    assert.equal(SCRABBLE.values.b, 3);
    assert.equal(WWF.values.b, 4);
    assert.equal(SCRABBLE.values.l, 1);
    assert.equal(WWF.values.l, 2);
    assert.equal(SCRABBLE.values.k, 5);
    assert.equal(WWF.values.k, 5);
    assert.equal(SCRABBLE.counts.e, 12);
    assert.equal(WWF.counts.e, 13);
  });

  test('the ten-point letters are right for each game', () => {
    const tens = (g) => LETTERS.filter((c) => g.values[c] === 10).sort();
    assert.deepEqual(tens(SCRABBLE), ['q', 'z']);
    assert.deepEqual(tens(WWF), ['j', 'q', 'z']);
  });
});

describe('scoreWord', () => {
  test('scores a simple word', () => {
    // q(10) + i(1) = 11 in Scrabble
    assert.equal(scoreWord('qi', SCRABBLE), 11);
    // q(10) + i(1) = 11 in WWF too
    assert.equal(scoreWord('qi', WWF), 11);
  });

  test('the same word can score differently in each game', () => {
    // 'blue': Scrabble b3+l1+u1+e1 = 6; WWF b4+l2+u2+e1 = 9
    assert.equal(scoreWord('blue', SCRABBLE), 6);
    assert.equal(scoreWord('blue', WWF), 9);
  });

  test('a blank scores nothing and is spent on the best letter', () => {
    // 'zoo' = z10+o1+o1 = 12. With one blank the z is free, leaving 2.
    assert.equal(scoreWord('zoo', SCRABBLE), 12);
    assert.equal(scoreWord('zoo', SCRABBLE, 1), 2);
    assert.equal(scoreWord('zoo', SCRABBLE, 2), 1);
  });

  test('more blanks than letters scores zero rather than going negative', () => {
    assert.equal(scoreWord('ax', SCRABBLE, 5), 0);
  });

  test('ignores case and non-letters', () => {
    assert.equal(scoreWord('QI', SCRABBLE), 11);
    assert.equal(scoreWord('q-i!', SCRABBLE), 11);
  });

  test('an empty word scores zero', () => {
    assert.equal(scoreWord('', SCRABBLE), 0);
  });
});

describe('byScore', () => {
  test('orders by score, then length, then alphabetically', () => {
    const rows = [
      { word: 'ab', score: 4 },
      { word: 'zz', score: 20 },
      { word: 'aa', score: 4 },
      { word: 'abc', score: 4 },
    ];
    assert.deepEqual(rows.sort(byScore).map((r) => r.word), ['zz', 'abc', 'aa', 'ab']);
  });
});

describe('game registry', () => {
  test('both games are exposed by key', () => {
    assert.deepEqual(Object.keys(GAMES).sort(), ['scrabble', 'wwf']);
  });
});
