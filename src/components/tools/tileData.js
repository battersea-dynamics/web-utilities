// Letter values and tile distributions for the two word games.
//
// LICENSING NOTE: letter values and tile counts are game mechanics — facts
// about how a game works, not creative expression — so this data carries no
// licensing problem. The *word lists* are a different matter entirely; see
// scripts/build-game-dictionary.mjs for that.
//
// TRADEMARK NOTE: SCRABBLE is a trademark of Hasbro in the US and Canada and
// of Mattel (via J.W. Spear & Sons) elsewhere. WORDS WITH FRIENDS is a
// trademark of Zynga. Neither game is affiliated with this site, and the tool
// pages must carry a visible disclaimer saying so. Don't remove it.
//
// VERIFYING THIS DATA: the numbers below are checked in tests against two
// independent totals published for each game — the tile count and the sum of
// all points on the board. Both are exact, so a single mistyped value fails
// the suite. That is deliberate: a scoring tool that quietly awards the wrong
// points is worse than no tool.

/** Scrabble: 100 tiles, 187 points in total. */
export const SCRABBLE = {
  name: 'Scrabble',
  totalTiles: 100,
  totalPoints: 187,
  blanks: 2,
  values: {
    a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1,
    j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1,
    s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10,
  },
  counts: {
    a: 9, b: 2, c: 2, d: 4, e: 12, f: 2, g: 3, h: 2, i: 9,
    j: 1, k: 1, l: 4, m: 2, n: 6, o: 8, p: 2, q: 1, r: 6,
    s: 4, t: 6, u: 4, v: 2, w: 2, x: 1, y: 2, z: 1,
  },
};

/** Words With Friends: 104 tiles, 220 points in total. */
export const WWF = {
  name: 'Words With Friends',
  totalTiles: 104,
  totalPoints: 220,
  blanks: 2,
  values: {
    a: 1, b: 4, c: 4, d: 2, e: 1, f: 4, g: 3, h: 3, i: 1,
    j: 10, k: 5, l: 2, m: 4, n: 2, o: 1, p: 4, q: 10, r: 1,
    s: 1, t: 1, u: 2, v: 5, w: 4, x: 8, y: 3, z: 10,
  },
  counts: {
    a: 9, b: 2, c: 2, d: 5, e: 13, f: 2, g: 3, h: 4, i: 8,
    j: 1, k: 1, l: 4, m: 2, n: 5, o: 8, p: 2, q: 1, r: 6,
    s: 5, t: 7, u: 4, v: 2, w: 2, x: 1, y: 2, z: 1,
  },
};

export const GAMES = { scrabble: SCRABBLE, wwf: WWF };

/**
 * Face value of a word, before any board bonuses.
 *
 * Blanks score zero, which is why they're passed separately rather than
 * being inferred: a blank played as an E still scores nothing, and a tool
 * that forgets this overstates every rack containing one.
 *
 * @param {string} word
 * @param {object} game one of GAMES
 * @param {number} blanksUsed how many letters of `word` are blank tiles
 */
export function scoreWord(word, game, blanksUsed = 0) {
  const letters = String(word).toLowerCase().replace(/[^a-z]/g, '');
  const scores = letters
    .split('')
    .map((ch) => game.values[ch] ?? 0)
    .sort((a, b) => b - a);
  // A blank is best spent on the highest-value letter, so drop those first.
  return scores.slice(Math.min(blanksUsed, scores.length)).reduce((a, b) => a + b, 0);
}

/** Sorts scored results highest first, then longest, then alphabetically. */
export function byScore(a, b) {
  return b.score - a.score || b.word.length - a.word.length || a.word.localeCompare(b.word);
}
