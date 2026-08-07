# Session notes — August 2026

Handover for the next session. What was built, what's unverified, and what's
next. Read `DISTRIBUTION.md` alongside this — it holds the plan; this holds
the state.

**Where things stand:** 35 tools, 55 pages, 291 tests, all passing. Live at
gazza.ltd. `origin/main` at `05ce4eb`. Nothing uncommitted.

---

## Built this session

### Word definitions (click a word, see what it means)
Word tools now show definitions on click. `scripts/build-definitions.mjs`
turns WordNet into 26 per-letter shards under `public/data/en/defs/`; a click
costs ~40KB rather than the ~1MB the full set would. 91.8% coverage.

Two bugs found and fixed during the build, both mine: WordNet's data files are
ordered by internal offset rather than meaning, so the first pass gave `rain`
as "anything happening rapidly"; and the gloss cleaner missed examples
introduced by a colon rather than a semicolon.

### Scrabble and Words With Friends word finders
Live, using ENABLE (public domain) from `data-sources/enable1.txt`. Sharded by
**word length** — a seven-tile rack fetches 280KB instead of 1.2MB.

**Deliberate, documented limitation:** ENABLE dates from 2000, so `qi` and `za`
are absent — they entered the official lists in 2006. Both pages say so
plainly. A test asserts they *stay* absent; if they ever appear, someone has
pasted in words from a copyrighted list.

`words-with-friends-cheat` was renamed to `words-with-friends-word-finder`.
Both pages carry not-affiliated trademark disclaimers.

### 404 page — this was a real defect
The site had no 404 page, so Cloudflare served the homepage with a **200 OK**
for every unknown URL. That's why Bing still listed Nexvita product pages under
gazza.ltd months after the shop moved: as far as a crawler could tell, those
URLs still worked. Fixed, and there's a test plus a guard against the tempting
wrong fix (a catch-all redirect to the homepage, which tells crawlers the
content moved rather than that it's gone).

### Category hub pages
Were 47–186 words of body text — a menu with nothing to judge. Now 193–387,
with a "Which one do you need?" list mapping a task to a tool. Content lives in
`src/data/categoryContent.js`; six tests keep the slugs honest.

### Embeddable calculator widgets — the main distribution work
`/embed/<slug>` renders a bare widget for other sites to iframe. `/embed` is
the landing page targeting "add mortgage calculator to website".
`/embed-terms` covers liability.

Three things that must not be undone:
- **The credit link sits outside the iframe**, in the snippet the host pastes.
  A link inside the frame is credited to gazza.ltd and does nothing for us.
- **Embed URLs are unversioned.** One URL per tool, forever. A rate change then
  fixes every host at once. Versioning would freeze each host on whatever they
  pasted.
- **`/embed/*` is exempted from `X-Frame-Options` in `public/_headers`.** Remove
  that and every embed in the wild silently stops rendering.

Cross-links and ad slots are hidden inside embeds — the user caught that they
were showing, and they'd have opened gazza.ltd *inside* the host's iframe.

### Installable PDF app (PWA)
`manifest.webmanifest` + `sw.js` + an install prompt on PDF pages only. Opens
into `/pdf`, works offline. Android gets a one-tap install; **iOS has never had
an install prompt**, so it gets instructions instead.

The service worker is deliberately conservative: HTML always network-first,
only fingerprinted assets cached hard, bumping `CACHE` wipes every device.
Eight tests enforce this.

### Infrastructure
- `.gitattributes` pinning line endings to LF, after a phantom 62-line diff
- GitHub Actions CI running `npm ci`, tests and build on every push
- `"type": "module"` in package.json
- Licence notices now ship *with* the data for both WordNet and SCOWL

---

## Offline — FIXED and confirmed working on Android (v4)

**The symptom that cracked it:** offline worked from a tool page like
`/merge-pdf`, but not from the app's own launch screen `/pdf`. That is a very
specific difference, and it pointed at two things:

1. **`start_url` was `/pdf?source=pwa`.** Cache lookups compare the *whole*
   URL, so a page stored as `/pdf` was never found when the request carried
   `?source=pwa`. Fixed twice over: lookups now pass `ignoreSearch`, and the
   query has been dropped from the manifest entirely.

2. **A failed fetch does not always reject.** Chrome can *resolve* with its own
   error response when the network is gone. The fallback was in a `.catch()`,
   which then never ran — so the dinosaur page showed while a perfectly good
   copy sat in the cache. Any non-ok response now falls through to the cache.

Together with the two earlier fixes (trailing-slash cache keys, build-time
precache of pdf-lib) that is four separate bugs in the same feature, none
visible without a real phone.

**Confirmed working** on a real Android phone: the installed app launches
offline, opens on `/pdf`, and merges PDFs with no connection.

**Known, expected: offline is slower than online.** The worker tries the
network first on every navigation and only falls back to cache once that
attempt fails, so each page waits out a connection timeout. That is the
deliberate cost of network-first — it is what stops visitors being pinned to a
stale build whose fingerprinted assets no longer exist. If it ever becomes
annoying, the fix is to race the fetch against a short timeout (~2s) rather
than checking `navigator.onLine`, which lies on captive-portal wifi.

---

## Unverified — check these first

1. **Do the embeds render on a real third-party site?** Tested once by the
   user and worked. Worth re-testing after the height changes.
2. **Do the trimmed embed heights fit?** They are estimates, not measurements
   — I can't render a page. Scrollbar inside means too short; gap underneath
   means too tall. Numbers live in `tools.json` as `embedHeight`.
3. ~~**Does the PWA install work?**~~ Yes — confirmed on Android. Installing
   works; the prompt only hides because the app is already installed, and
   Chrome disables installation in incognito entirely. Offline is a separate
   open bug, above.
4. ~~**Does the 404 return a real 404?**~~ Effectively confirmed. A fake URL
   now returns an empty body where it previously returned the full homepage at
   200. Exact status code still unread in DevTools, but the soft-404 is gone.
5. **AdSense in an installed PWA — genuinely unresolved.** I first said ads
   work normally, then found AdSense prohibits ad units in software
   applications and that scripts may suppress ads in standalone mode. No
   definitive statement from Google either way; sources were forums and
   secondary blogs. **Check with AdSense before assuming.** Practically: expect
   installed users to generate no ad revenue, which is acceptable.

---

## Decisions worth not relitigating

- **Two dictionaries on purpose.** SCOWL 10–60 for the general word tools
  (everyday English); ENABLE for the game tools (needs obscure but valid
  words). Merging them breaks both. SCOWL lacks `qat`, `aa`, `ae`, `oe`.
- **Never use `scrabble-dictionary` on npm.** MIT-licensed but ships
  `sowpods.txt` and `twl.txt` — Collins and NASPA, which the packager had no
  right to relicense.
- **No native app.** Apple rejects repackaged websites, and AdSense doesn't run
  in native apps. PWA instead.
- **Extensions are desktop-only.** Chrome on Android has never supported them.
  Low priority for a phone-first audience.
- **Word count is not a thin-content signal.** Google says so explicitly. Don't
  adopt a minimum word count target — it manufactures filler.
- **`llms.txt` has no evidence behind it.** Analysis across 515M LLM bot events
  found no measurable effect. Don't treat it as a ranking factor.

---

## Next up

From `DISTRIBUTION.md` Part 1, in order:

1. **Indexing hygiene** — Bing Webmaster Tools, sitemap, IndexNow, content
   removal for the stale Nexvita URLs. One evening, unblocks everything.
2. **Schema** — add `HowTo` to the PDF tools and `BreadcrumbList` sitewide.
   `WebApplication` and `FAQPage` are already there.
3. **Four-nations stamp duty comparison** as original data. The engine already
   computes it; this is writing, not building.
4. **Pick one community** and participate for six weeks before linking.

Standing item: **Budget day is a build deadline, not a marketing date.** Rates
must be correct and a "what changed" page published within hours. Now that
calculators are embedded on other sites, a stale rate is wrong in every one of
them simultaneously. `LAST_VERIFIED` in `taxData.js` is currently
**4 August 2026**.

---

## Honest note on reliability

Across this session I shipped several things that were wrong and were caught
by testing or by the user, not by my confidence: wrong WordNet senses, a
broken lockfile I then told the user to commit, an embed test that passed
while the thing it guarded was broken, and blank PWA icons. The test suite and
the habit of deliberately breaking things to check the guards fire are load-
bearing. Keep both.
