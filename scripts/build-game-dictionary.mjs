// Builds the Scrabble / Words With Friends dictionary from ENABLE.
//
// Run with:  node scripts/build-game-dictionary.mjs
// Reads:     data-sources/enable1.txt   (see that folder's README)
// Writes:    public/data/en/game/{2..15}.json  +  LICENSE.txt
//
// ── WHY A SEPARATE DICTIONARY FROM THE OTHER WORD TOOLS ───────────────
// The unscrambler and anagram solver use SCOWL tiers 10–60: everyday
// recognisable English, deliberately excluding dialect and obscure entries,
// because someone unscrambling a puzzle doesn't want `daur` and `huia` in
// their results. A game dictionary needs the exact opposite — every word the
// game will accept, however obscure. SCOWL fails badly here: it lacks `qat`,
// `aa`, `ae` and `oe`, and has only 97 two-letter words.
//
// ── WHY SHARDED BY LENGTH ─────────────────────────────────────────────
// A rack of N tiles can only build words of length 2..N, so a normal 7-tile
// rack needs 51,948 of the 172,820 words — under a third. Splitting the index
// by word length means the browser fetches only the shards it can actually
// use. Sharding by first letter (as the definitions do) would be useless
// here, because a rack matches words starting with any of its letters.
//
// ── WHAT THE INDEX IS ─────────────────────────────────────────────────
// Each shard maps sorted-letters -> [words with exactly those letters], so
// finding every word playable from a rack is a set of direct lookups rather
// than a scan of the dictionary:
//     { "aet": ["ate","eat","eta","tae","tea"] }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'data-sources/enable1.txt');
const OUT = path.join(root, 'public/data/en/game');

const MIN_LEN = 2;
const MAX_LEN = 15; // the longest rack the widgets accept

if (!fs.existsSync(SRC)) {
  console.error(`Missing ${path.relative(root, SRC)} — see data-sources/README.md`);
  process.exit(1);
}

const words = fs
  .readFileSync(SRC, 'utf8')
  .split('\n')
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length >= MIN_LEN && w.length <= MAX_LEN && /^[a-z]+$/.test(w));

// Guard against a truncated or wrong download quietly producing a small
// dictionary. ENABLE is ~172,800 words; anything far off is not ENABLE.
if (words.length < 150000) {
  console.error(`Only ${words.length} usable words — enable1.txt looks wrong or truncated.`);
  process.exit(1);
}

const shards = {};
for (const w of words) {
  const key = w.split('').sort().join('');
  ((shards[w.length] ??= {})[key] ??= []).push(w);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ENABLE is public domain and imposes no conditions, but its authors asked to
// be credited as originators. That request is honoured here and on the tool
// pages; please leave both in place.
fs.writeFileSync(
  path.join(OUT, 'LICENSE.txt'),
  `The word list in this directory is derived from ENABLE2K (enable1.txt).

  The ENABLE master word list, WORD.LST, is herewith formally released
  into the Public Domain. Anyone is free to use it or distribute it in
  any manner they see fit. No fee or registration is required for its
  use nor are "contributions" solicited. This word list is our gift to
  the Scrabble community, as an alternate to "official" word lists.
  Game designers may feel free to incorporate the WORD.LST into their
  games. Please mention the source and credit us as originators of the
  list.

Originators: Alan Beale and M. Cooper, ENABLE project.

---------------------------------------------------------------------
NOTE ADDED BY gazza.ltd

These JSON files are ENABLE reindexed for fast lookup: words grouped by
length, then keyed by their letters in alphabetical order. No words have
been added or removed beyond restricting length to ${MIN_LEN}-${MAX_LEN}.

ENABLE dates from 2000 and is NOT the official dictionary of any game.
Words added to the tournament lists since then — QI and ZA among them —
are absent. The tool pages state this; do not quietly "fix" it by pasting
in words from Collins or TWL, both of which are copyrighted.

Generator: scripts/build-game-dictionary.mjs
`
);

let total = 0;
let bytes = 0;
const report = [];
for (const [len, index] of Object.entries(shards)) {
  const json = JSON.stringify(index);
  fs.writeFileSync(path.join(OUT, `${len}.json`), json);
  const n = Object.values(index).reduce((a, b) => a + b.length, 0);
  total += n;
  bytes += json.length;
  report.push([Number(len), n, json.length]);
}

console.log(`source words:  ${words.length.toLocaleString()}`);
console.log(`indexed:       ${total.toLocaleString()}`);
console.log(`shards:        ${report.length} (lengths ${MIN_LEN}-${MAX_LEN})`);
console.log(`total size:    ${(bytes / 1024 / 1024).toFixed(2)} MB uncompressed`);
const rack7 = report.filter(([l]) => l <= 7).reduce((a, [, , b]) => a + b, 0);
console.log(`a 7-tile rack: ${(rack7 / 1024).toFixed(0)} KB uncompressed (lengths 2-7 only)`);
