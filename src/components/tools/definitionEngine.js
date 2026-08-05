// Looks up what a word means, for the word-game tools.
//
// Definitions are never fetched with the results — only when someone clicks
// a specific word. The data is split into one file per starting letter, so
// a click costs roughly 40KB rather than the ~1MB the full set would.
//
// Shard shape:
//   { d: { "petal": ["n", "part of a flower"] },   definitions
//     f: { "petals": "petal" } }                    inflection -> base form
//
// Source: WordNet 3.1, Princeton University. See scripts/build-definitions.mjs
// for the licence terms and how the files are generated.

const shardCache = new Map();

/** Which file a word lives in. Non a–z words share a single `_` shard. */
export function shardKey(word) {
  const first = word[0];
  return first >= 'a' && first <= 'z' ? first : '_';
}

function loadShard(lang, key) {
  const id = `${lang}/${key}`;
  if (!shardCache.has(id)) {
    shardCache.set(
      id,
      fetch(`/data/${lang}/defs/${key}.json`)
        .then((r) => (r.ok ? r.json() : { d: {}, f: {} }))
        // A missing or broken definitions file must never break the tool
        // itself — the word list is the product, definitions are a bonus.
        .catch(() => ({ d: {}, f: {} }))
    );
  }
  return shardCache.get(id);
}

/**
 * @returns {Promise<{word: string, pos: string, gloss: string, base: string|null}|null>}
 *   null when the word has no entry — about 8% of the dictionary, mostly
 *   irregular forms WordNet cannot resolve without its exception lists.
 */
export async function lookup(word, lang = 'en') {
  const w = String(word).toLowerCase();
  const shard = await loadShard(lang, shardKey(w));

  const direct = shard.d?.[w];
  if (direct) return { word: w, pos: direct[0], gloss: direct[1], base: null };

  const base = shard.f?.[w];
  const viaBase = base && shard.d?.[base];
  if (viaBase) return { word: w, pos: viaBase[0], gloss: viaBase[1], base };

  return null;
}

/** Long-form part of speech, for screen readers and tooltips. */
export const POS_LABEL = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
};

/** Test seam — lets the unit tests start from a clean cache. */
export function _resetCache() {
  shardCache.clear();
}
