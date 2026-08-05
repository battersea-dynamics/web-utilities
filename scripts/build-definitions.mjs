// Generates the word definitions used by the word-game tools.
//
// Run with:  node scripts/build-definitions.mjs
// Only needs re-running if the word list or WordNet version changes — the
// output is committed, so a normal install and build needs nothing extra.
//
// ── SOURCE AND LICENCE ────────────────────────────────────────────────
// Definitions come from WordNet 3.1, Princeton University, via the
// MIT-licensed `wordnet-db` package. Princeton grants permission to use,
// copy, modify and distribute WordNet for any purpose, including
// commercially, without fee, provided the copyright notice is retained.
// That notice is shown on the word tool pages — do not remove it.
//   https://wordnet.princeton.edu/license-and-commercial-use
//
// ── WHY IT IS SHARDED ─────────────────────────────────────────────────
// The full set is ~1MB gzipped. Definitions are only ever wanted for one
// word at a time, so splitting by first letter means a lookup fetches
// roughly 40KB instead of the lot.
//
// ── WHY THE MORPHOLOGY STEP EXISTS ────────────────────────────────────
// WordNet stores base forms only: it has `petal` but not `petals`, `knife`
// but not `knives`. Since an unscrambler mostly returns inflected forms,
// a direct lookup covers barely half the dictionary. Applying the standard
// suffix rules to find a base form lifts coverage from ~50% to ~92%.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DICT = path.join(root, 'node_modules/wordnet-db/dict');
const OUT = path.join(root, 'public/data/en/defs');

const words = JSON.parse(
  fs.readFileSync(path.join(root, 'public/data/en/words.json'), 'utf8')
);

/* 1. Index every gloss by part of speech and synset offset.
      A gloss ends at the first example usage. WordNet usually separates
      those with `; "..."` but not always — `adequacy` uses a colon — so
      cut at whichever of `;` or `"` comes first. */
const POS_FILE = { n: 'noun', v: 'verb', adj: 'adj', adv: 'adv' };
const glossAt = { n: {}, v: {}, adj: {}, adv: {} };

function cleanGloss(raw) {
  let g = raw;
  const cut = [g.indexOf(';'), g.indexOf('"')].filter((i) => i !== -1);
  if (cut.length) g = g.slice(0, Math.min(...cut));
  return g.trim().replace(/[:,\s]+$/, '');
}

for (const [tag, file] of Object.entries(POS_FILE)) {
  for (const line of fs.readFileSync(path.join(DICT, `data.${file}`), 'utf8').split('\n')) {
    if (!line || line.startsWith('  ')) continue;
    const bar = line.indexOf('|');
    if (bar === -1) continue;
    glossAt[tag][line.slice(0, 8)] = cleanGloss(line.slice(bar + 1).trim());
  }
}

/* 2. Pick the *right* sense for each word.
      The data files are ordered by synset offset, not by meaning, so taking
      the first one gives nonsense: `rain` came out as "anything happening
      rapidly", the "a rain of bullets" sense. index.sense carries the
      semantic concordance tag counts — how often each sense was actually
      observed in tagged text — so the most-used sense wins, falling back on
      WordNet's own sense numbering when nothing is tagged.

      Line format: lemma%ss_type:... synset_offset sense_number tag_cnt */
const SS_TYPE = { 1: 'n', 2: 'v', 3: 'adj', 4: 'adv', 5: 'adj' };
const POS_RANK = { n: 0, v: 1, adj: 2, adv: 3 };
const best = {};

for (const line of fs.readFileSync(path.join(DICT, 'index.sense'), 'utf8').split('\n')) {
  if (!line) continue;
  const [key, offset, senseNo, tagCnt] = line.split(' ');
  const pct = key.indexOf('%');
  const lemma = key.slice(0, pct);
  if (lemma.includes('_')) continue; // multi-word entries aren't in our list
  const tag = SS_TYPE[key[pct + 1]];
  if (!tag) continue;

  const cand = {
    tag,
    offset,
    sense: Number(senseNo),
    count: Number(tagCnt),
  };
  const held = best[lemma];
  // More observed uses wins; then the lower sense number; then noun over
  // verb over adjective over adverb, which is the order a reader expects.
  if (
    !held ||
    cand.count > held.count ||
    (cand.count === held.count &&
      (cand.sense < held.sense ||
        (cand.sense === held.sense && POS_RANK[cand.tag] < POS_RANK[held.tag])))
  ) {
    best[lemma] = cand;
  }
}

const base = {};
for (const [lemma, s] of Object.entries(best)) {
  const gloss = glossAt[s.tag][s.offset];
  if (gloss) base[lemma.toLowerCase()] = [s.tag, gloss];
}

/* 3. Suffix rules mapping an inflected form back to a possible base. */
const RULES = [
  ['ses', 's'], ['xes', 'x'], ['zes', 'z'], ['ches', 'ch'], ['shes', 'sh'],
  ['ies', 'y'], ['ied', 'y'], ['ier', 'y'], ['iest', 'y'], ['ily', 'y'],
  ['ves', 'f'], ['ves', 'fe'],
  ['s', ''], ['es', ''], ['ed', ''], ['ed', 'e'], ['ing', ''], ['ing', 'e'],
  ['er', ''], ['er', 'e'], ['est', ''], ['est', 'e'], ['ly', ''],
  ['ness', ''], ['ment', ''],
];

function candidates(w) {
  const out = [];
  for (const [suffix, replacement] of RULES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 2) {
      out.push(w.slice(0, -suffix.length) + replacement);
    }
  }
  // Doubled consonant before an ending: running → run, bigger → big.
  const m = w.match(/^(.*?)([bcdfgklmnprstvz])\2(ing|ed|er|est)$/);
  if (m) out.push(m[1] + m[2]);
  return out;
}

/* 4. Build per-letter shards: definitions once, inflections as pointers. */
const shards = {};
const shardFor = (w) => {
  const key = /^[a-z]/.test(w) ? w[0] : '_';
  return (shards[key] ??= { d: {}, f: {} });
};

let direct = 0;
let derived = 0;
for (const w of words) {
  if (base[w]) {
    shardFor(w).d[w] = base[w];
    direct++;
    continue;
  }
  for (const c of candidates(w)) {
    if (base[c]) {
      const s = shardFor(w);
      s.f[w] = c;
      // The base may live in a different shard, so store it here too.
      if (!s.d[c]) s.d[c] = base[c];
      derived++;
      break;
    }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/* The licence has to be rewritten here, not just committed once: this script
   wipes the output directory on every run, and WordNet's terms require the
   copyright notice and disclaimer to accompany every copy of the database
   "including modifications that you make". The shards are a modification.

   The licence text is copied verbatim and must stay that way. Anything we
   need to say about it goes in the separate note below it — never by
   editing the notice itself. */
fs.writeFileSync(
  path.join(OUT, 'LICENSE.txt'),
  fs.readFileSync(path.join(root, 'node_modules/wordnet-db/LICENSE'), 'utf8') +
    `
---------------------------------------------------------------------
NOTE ADDED BY gazza.ltd

The licence text above is reproduced verbatim as distributed with the
wordnet-db package. It is headed "WordNet Release 3.0" while the
database files in that package are WordNet 3.1; Princeton publishes
the same terms for both releases.

The JSON files in this directory are a derived work: single-sense
glosses extracted from the WordNet 3.1 database and reformatted for
web delivery. They are redistributed under the licence above, which
requires this notice and disclaimer to accompany all copies,
including modifications.

Source data: WordNet 3.1, Princeton University
Generator:   scripts/build-definitions.mjs
`
);

let bytes = 0;
for (const [key, data] of Object.entries(shards)) {
  const json = JSON.stringify(data);
  fs.writeFileSync(path.join(OUT, `${key}.json`), json);
  bytes += json.length;
}

const covered = direct + derived;
console.log(`words:      ${words.length}`);
console.log(`covered:    ${covered} (${((covered / words.length) * 100).toFixed(1)}%)`);
console.log(`  direct:   ${direct}`);
console.log(`  via base: ${derived}`);
console.log(`shards:     ${Object.keys(shards).length}`);
console.log(`total size: ${(bytes / 1024 / 1024).toFixed(2)} MB uncompressed`);
