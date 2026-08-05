// Generator for the word-game dictionaries. Re-run with:
//   node scripts/build-word-index.mjs
// Output is namespaced by language code under /public/data/<lang>/ and
// fetched lazily at runtime by the word-game widgets — not bundled into
// the JS chunk. Only 'en' exists today; adding another language later is
// just: source a word list for it, add a case below, regenerate.
//
// English source: the `wordlist-english` package (SCOWL-derived, MIT/BSD-
// style SCOWL licence — see node_modules/wordlist-english/Copyright).
// SCOWL groups words into frequency tiers (10 = most common ... 70 = rare
// but still "found in most dictionaries"; 80+ is deliberately excluded —
// that tier is where dialect/archaic/obscure entries live, which is wrong
// for a general-purpose unscrambler even though it's exactly right for a
// competitive Scrabble dictionary).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const MIN_LEN = 2;
const MAX_LEN = 15;
// Tiers to include, most-to-least common. Stops at 60 — tier 70 in SCOWL
// starts including noticeably obscure/technical words.
const TIERS = [10, 20, 35, 40, 50, 55, 60];
const DIALECTS = ['english', 'american', 'british', 'canadian', 'australian'];

function buildEnglish() {
  const wlDir = path.join(root, 'node_modules/wordlist-english');
  const words = new Set();

  for (const dialect of DIALECTS) {
    for (const tier of TIERS) {
      const file = path.join(wlDir, `${dialect}-words-${tier}.json`);
      const list = JSON.parse(readFileSync(file, 'utf8'));
      for (const w of list) words.add(w.toLowerCase());
    }
  }

  return Array.from(words)
    .filter((w) => w.length >= MIN_LEN && w.length <= MAX_LEN && /^[a-z]+$/.test(w))
    .sort();
}

function writeLanguage(lang, wordSet) {
  const dir = path.join(root, 'public/data', lang);
  mkdirSync(dir, { recursive: true });

  const index = {};
  for (const w of wordSet) {
    const key = w.split('').sort().join('');
    (index[key] ||= []).push(w);
  }

  writeFileSync(path.join(dir, 'word-index.json'), JSON.stringify(index));
  writeFileSync(path.join(dir, 'words.json'), JSON.stringify(wordSet));

  // SCOWL's licence permits any use, including commercial, but only
  // "provided that the above copyright notice appears in all copies".
  // These lists are copies, so the notice ships with them.
  writeFileSync(
    path.join(dir, 'WORDLIST-LICENSE.txt'),
    readFileSync(path.join(root, 'node_modules/wordlist-english/Copyright'), 'utf8') +
      `
---------------------------------------------------------------------
NOTE ADDED BY gazza.ltd

words.json and word-index.json in this directory are derived from the
SCOWL word lists covered by the notice above: frequency tiers 10-60
across all dialects, filtered to length ${MIN_LEN}-${MAX_LEN} and lowercased.
Redistributed under the terms above.

Generator: scripts/build-word-index.mjs
`
  );

  console.log(`${lang}: ${wordSet.length} words, ${Object.keys(index).length} index keys`);
}

writeLanguage('en', buildEnglish());
