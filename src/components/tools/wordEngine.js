// Shared engine behind the word-unscrambler and anagram-solver widgets.
// Given a rack of letters, finds every dictionary word that can be made
// from some subset of them (the classic "unscramble my tiles" behaviour),
// using a pre-built index of sortedLetters -> [matching words].

const indexCache = new Map();

export function loadWordIndex(lang) {
  if (!indexCache.has(lang)) {
    indexCache.set(
      lang,
      fetch(`/data/${lang}/word-index.json`).then((r) => {
        if (!r.ok) throw new Error('Failed to load dictionary');
        return r.json();
      })
    );
  }
  return indexCache.get(lang);
}

/** All sub-multisets of `letters`, each returned pre-sorted, longest first. */
function subsetKeys(letters) {
  const freq = {};
  for (const ch of letters) freq[ch] = (freq[ch] || 0) + 1;
  const chars = Object.keys(freq).sort();

  // Each combo is an array of counts (0..freq[ch]) aligned with `chars`.
  let combos = [[]];
  for (const ch of chars) {
    const max = freq[ch];
    const next = [];
    for (const combo of combos) {
      for (let c = 0; c <= max; c++) next.push([...combo, c]);
    }
    combos = next;
  }

  const keys = new Set();
  for (const combo of combos) {
    let key = '';
    let total = 0;
    for (let i = 0; i < chars.length; i++) {
      key += chars[i].repeat(combo[i]);
      total += combo[i];
    }
    if (total > 0) keys.add(key);
  }
  return keys;
}

/**
 * @param {string} letters raw user input, any case, may include spaces
 * @param {object} index sortedLetters -> [words]
 * @returns {{length: number, words: string[]}[]} groups, longest first
 */
export function findWords(letters, index) {
  const clean = letters.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return [];

  const keys = subsetKeys(clean);
  const found = new Set();
  for (const key of keys) {
    const words = index[key];
    if (words) for (const w of words) found.add(w);
  }

  const byLength = new Map();
  for (const w of found) {
    if (!byLength.has(w.length)) byLength.set(w.length, []);
    byLength.get(w.length).push(w);
  }

  return Array.from(byLength.keys())
    .sort((a, b) => b - a)
    .map((length) => ({
      length,
      words: byLength.get(length).sort(),
    }));
}

export function fullLengthAnagrams(letters, groups) {
  const clean = letters.toLowerCase().replace(/[^a-z]/g, '');
  const group = groups.find((g) => g.length === clean.length);
  return group ? group.words : [];
}
