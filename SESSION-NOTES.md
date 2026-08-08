# Project constraints — gazza.ltd

**What this file is.** The things that are expensive to rediscover: decisions
already settled, and rules that break something silently if undone. Not a
diary, not a status report, not a plan. `DISTRIBUTION.md` holds the plan; git
holds the history.

**How to maintain it.** Add, don't rewrite. Anything here should still be true
in a year — no commit hashes, no "next up", no dates except where a date *is*
the fact. If a line needs updating to stay accurate, it was state and doesn't
belong here.

**Why it exists.** A long chat gets summarised when it runs out of room, and
summarising drops the small detail whose importance isn't visible in the
sentence. Every rule below reads like a formatting preference and isn't. A
file in the repo is read fresh, at full detail, every session.

---

## Things that break silently if undone

No test catches these. Nothing errors. The site looks fine.

### The embed credit link sits OUTSIDE the iframe

An iframe is a separate document served from gazza.ltd, so a link inside it is
gazza.ltd linking to itself and counts for nothing. The link only carries value
when it is in the host's own HTML — which is why `embedSnippet()` in
`src/data/embeds.js` puts the `<p><a>…</a></p>` *after* `</iframe>`.

There is a second credit inside the frame. That one is a courtesy route back
for users and does nothing for SEO. Moving the outside link in would look
tidier, keep working perfectly, and quietly end the entire point of the embed
programme.

### `/embed/*` is exempt from `X-Frame-Options` in `public/_headers`

The `/*` block sets `SAMEORIGIN`, which tells browsers to refuse to render the
page inside a frame on another domain. That is correct everywhere except the
embeds, which are that exact thing. The `/embed/*` block omits the header and
**must be declared before `/*`**.

Break the ordering and every embed already pasted onto someone else's site
goes blank at once. You will not find out — you don't control those pages and
nobody reports a widget that vanished.

### Embed URLs are unversioned

One URL per tool, forever. A rate change then corrects every host within
minutes of a push. Versioning would freeze each host on whatever they pasted
and destroy the only real advantage an iframe has over a copied script.

### `sw.js` — HTML is always network-first

Cached HTML pins visitors to an old build whose fingerprinted CSS and JS no
longer exist. This project has already shipped that failure once. Only
fingerprinted assets are cached hard, because their filename changes when
their contents do.

Bumping `CACHE` wipes every device on activate. That is the kill switch.

---

## Licensing

- **Never use `scrabble-dictionary` on npm.** MIT-licensed, but it ships
  `sowpods.txt` and `twl.txt` — the Collins and NASPA tournament lists, both
  copyrighted and commercially licensed. The packager relicensed material that
  was not theirs to give, so the MIT label is worthless. It is the obvious
  package to reach for, which is exactly the danger.
- **Game tools use ENABLE** (`data-sources/enable1.txt`), genuinely public
  domain. It dates from 2000, so `qi` and `za` are absent — they entered the
  official lists in 2006. Both pages say so plainly, and **a test asserts they
  stay absent**. That test is a tripwire: if those words ever appear, someone
  has pasted in a copyrighted list.
- **Two dictionaries on purpose.** SCOWL 10–60 for the general word tools
  (everyday English); ENABLE for the game tools (needs obscure but valid
  words). Merging them breaks both — SCOWL lacks `qat`, `aa`, `ae`, `oe`.
- **Licence notices ship with the data** for both WordNet and SCOWL. Removing
  them to save bytes breaks the licence terms.

---

## Settled — do not relitigate

- **No native app.** Apple rejects repackaged websites, and AdSense does not
  run in native apps. The PWA is the answer.
- **Extensions are desktop-only.** Chrome on Android has never supported them.
  Low value for a phone-first audience.
- **Word count is not a thin-content signal.** Google says so explicitly.
  Adopting a minimum word count manufactures filler.
- **`llms.txt` has no evidence behind it.** Analysis across 515M LLM bot events
  found no measurable effect. Not a ranking factor.
- **PDF tools target the privacy long tail, not the head terms.** iLovePDF,
  Smallpdf, Adobe and PDF24 own `merge pdf` and are not losing it to a new
  domain. `merge pdf without uploading` is winnable because those competitors
  *structurally cannot* write that page honestly — their architecture requires
  receiving the file. Hundreds of searches a month rather than millions, but
  reachable.
- **Do not water down the "turn off your wifi and test it" section** on
  `/pdf-without-uploading`. It is the strongest thing on the page: a claim the
  reader verifies in ten seconds without trusting us. The section admitting
  where upload-based tools are better (OCR, compression, very large files,
  format conversion) is what makes the rest credible, and it is also true.

---

## Hard-won, non-obvious behaviour

Each of these cost a debugging session. None was visible without a real phone.

**Astro builds directories.** The served URL is `/merge-pdf/`, not
`/merge-pdf`. The Cache API matches on the full URL, so a page precached
without the slash is never found. Three separate offline bugs turned on this
one distinction. Hence `variants()` in `sw.js`, storing and looking up both
forms.

**An opaque redirect is not a failure.** Navigation requests carry
`redirect: "manual"`. Every internal link is bare (`/finance`) and every page
is a directory, so Cloudflare 301s all of them — and `fetch` returns type
`opaqueredirect`, status 0, **`ok: false`**. Treating that as an error shows
the offline page for every calculator *while online*. The PDF tools mask it,
being precached.

**A failed fetch does not always reject.** Chrome can resolve with its own
error response when the network is gone, so a `.catch()`-only fallback never
runs. Any non-ok response must fall through to the cache.

**Never cache an error response.** Caching a 404 pins that URL to "doesn't
exist" for offline use even after the page ships. Hit for real: `/pwa-check`
was visited a minute before it went live and stayed missing afterwards.

**Offline is slower than online, by design.** The worker tries the network
first on every navigation and only falls back once that attempt fails, so each
page waits out a timeout. That is the deliberate cost of network-first. If it
becomes annoying, race the fetch against a ~2s timeout — do *not* check
`navigator.onLine`, which lies on captive-portal wifi.

**`npm install` and `npm ci` desync the lockfile on Windows.** Running
`npm install` can prune platform-specific optional dependencies
(`@emnapi/core`, `@emnapi/runtime`), after which Cloudflare's
`npm clean-install` fails the build. This has bitten three times. CI now
catches it.

**`react-dom` must not be removed** as an unused dependency. It is a peer
dependency compiled into `client.*.js`.

**HTML comments ship to production.** Astro strips `{/* */}` and does not
strip `<!-- -->`. Use the former.

---

## Genuinely open

- **AdSense inside an installed PWA.** AdSense prohibits ad units in software
  applications, and scripts may suppress ads in standalone mode. No definitive
  statement from Google either way; the available sources are forums and
  secondary blogs. Check before assuming. Working assumption: installed users
  generate no ad revenue, which is acceptable.
- **Embed heights are estimates, not measurements.** `embedHeight` in
  `tools.json`. A scrollbar inside the frame means too short; a gap underneath
  means too tall. Only a real render on a third-party page settles it.
- **Budget day is a build deadline, not a marketing date.** Stamp duty changes
  at every Budget, and the fortnight afterwards is the one window where a small
  site can outrun large ones — but only if rates are already correct and a
  "what changed" page publishes within hours. Now that calculators are embedded
  elsewhere, a stale rate is wrong on every host simultaneously.
  `LAST_VERIFIED` in `taxData.js` is the marker.
