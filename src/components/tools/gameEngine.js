// Finds every playable word from a rack of tiles, scored for the chosen game.
//
// Separate from wordEngine.js on purpose: that one answers "what words are in
// these letters" for puzzles, using an everyday-English dictionary. This one
// answers "what can I play" using the ENABLE game dictionary, and cares about
// scores and blank tiles.
//
// ── HOW THE LOOKUP WORKS ──────────────────────────────────────────────
// The dictionary is indexed by sorted letters, so `ate`, `eat` and `tea` all
// live under the key `aet`. Finding playable words is then: enumerate every
// sub-multiset of the rack, sort each one, and look it up. No scanning.
//
// ── HOW BLANKS ARE HANDLED ────────────────────────────────────────────
// A blank can be any letter, so each one multiplies the search. Rather than
// expanding the rack into 26 (or 676) variants and re-enumerating subsets for
// each — which gets slow fast — we enumerate subsets once from the real
// letters, then for each subset add every combination of substitute letters.
// Deduplicating keys before lookup keeps the work proportional to distinct
// keys rather than to the number of blank permutations.

const shardCache = new Map();

/** Loads one length-shard of the dictionary. Cached for the session. */
export function loadShard(length, lang = 'en') {
  const id = `${lang}/${length}`;
  if (!shardCache.has(id)) {
    shardCache.set(
      id,
      fetch(`/data/${lang}/game/${length}.json`)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}))
    );
  }
  return shardCache.get(id);
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/**
 * Splits raw input into real letters and a count of blanks.
 * Blanks may be typed as `?` or `*` or a space-separated `_`.
 */
export function parseRack(input) {
  const clean = String(input).toLowerCase();
  const letters = clean.replace(/[^a-z]/g, '').split('');
  const blanks = (clean.match(/[?*_]/g) || []).length;
  return { letters, blanks };
}

/** Every sub-multiset of `letters`, as sorted keys, grouped by length. */
function subsetKeysByLength(letters) {
  const freq = {};
  for (const ch of letters) freq[ch] = (freq[ch] || 0) + 1;
  const chars = Object.keys(freq).sort();

  let combos = [[]];
  for (const ch of chars) {
    const next = [];
    for (const combo of combos) {
      for (let c = 0; c <= freq[ch]; c++) next.push([...combo, c]);
    }
    combos = next;
  }

  const byLength = new Map();
  for (const combo of combos) {
    let key = '';
    for (let i = 0; i < chars.length; i++) key += chars[i].repeat(combo[i]);
    if (!key) continue;
    if (!byLength.has(key.length)) byLength.set(key.length, new Set());
    byLength.get(key.length).add(key);
  }
  return byLength;
}

/** All ways to add `n` wildcard letters to a key, returned sorted. */
function withBlanks(key, n) {
  let keys = [key];
  for (let i = 0; i < n; i++) {
    const next = new Set();
    for (const k of keys) {
      for (const ch of ALPHABET) next.add((k + ch).split('').sort().join(''));
    }
    keys = [...next];
  }
  return keys;
}

/**
 * @param {string} rack raw user input, may contain ? or * for blanks
 * @param {object} game a game from tileData.js
 * @param {function} scoreWord from tileData.js
 * @param {number} maxLength longest word to look for
 * @returns {Promise<{word,score,length,blanksUsed}[]>} unsorted
 */
export async function findPlays(rack, game, scoreWord, maxLength = 15, lang = 'en') {
  const { letters, blanks } = parseRack(rack);
  const size = letters.length + blanks;
  if (size < 2) return [];

  const top = Math.min(size, maxLength);
  const realKeys = subsetKeysByLength(letters);

  // Only the shards a rack this size could possibly match.
  const shards = await Promise.all(
    Array.from({ length: top - 1 }, (_, i) => loadShard(i + 2, lang))
  );

  const found = new Map(); // word -> fewest blanks needed
  for (let len = 2; len <= top; len++) {
    const shard = shards[len - 2];
    if (!shard) continue;

    // A word of this length uses `used` real letters and `b` blanks.
    for (let b = 0; b <= blanks; b++) {
      const used = len - b;
      if (used < 0) continue;
      const base = used === 0 ? [''] : [...(realKeys.get(used) ?? [])];
      for (const key of base) {
        for (const full of b === 0 ? [key] : withBlanks(key, b)) {
          const words = shard[full];
          if (!words) continue;
          for (const w of words) {
            if (!found.has(w) || found.get(w) > b) found.set(w, b);
          }
        }
      }
    }
  }

  return [...found].map(([word, blanksUsed]) => ({
    word,
    blanksUsed,
    length: word.length,
    score: scoreWord(word, game, blanksUsed),
  }));
}

/** Groups scored plays by word length, longest first. */
export function groupByLength(plays) {
  const byLength = new Map();
  for (const p of plays) {
    if (!byLength.has(p.length)) byLength.set(p.length, []);
    byLength.get(p.length).push(p);
  }
  return [...byLength.keys()]
    .sort((a, b) => b - a)
    .map((length) => ({ length, plays: byLength.get(length) }));
}

/** Test seam. */
export function _resetCache() {
  shardCache.clear();
}
