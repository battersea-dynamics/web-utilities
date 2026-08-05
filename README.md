# web-utilities

The utilities site behind **gazza.ltd**. Astro (static HTML) with React islands for the interactive widgets.

**Repo:** `github.com/battersea-dynamics/web-utilities`
**Hosting:** Cloudflare Pages — live at [gazza.ltd](https://gazza.ltd), redeploys automatically on every push to `main`

---

## Branch safety workflow

Two branches, always:

- **`main`** — what's live. Every push to it triggers a Cloudflare deploy.
- **`previous`** — a snapshot of the last known-good `main`, so there's always something to fall back to.

### Before starting any new set of changes

Run this first, every time, while the site is working:

```bash
git checkout main
git pull
git branch -f previous main
git push -f origin previous
```

That moves `previous` to the current tip of `main` and publishes it. Only then start the work, and push to `main` as normal.

The discipline that matters: **only ever reset `previous` when the site is actually working.** If you run these commands after breaking something, you have overwritten your escape route with the broken version. When in doubt, check the live site first.

### Rolling back

If a change breaks the site, put `main` back to the last good state:

```bash
git checkout main
git reset --hard previous
git push -f origin main
```

Cloudflare picks that up as a new deploy and the site returns to the previous version within a couple of minutes.

To look at the old version before committing to a rollback:

```bash
git checkout previous     # inspect it locally
npm ci && npm run dev
git checkout main         # go back
```

To undo one specific commit rather than everything since:

```bash
git revert <commit-hash>
git push
```

`revert` is the safer option — it adds a new commit undoing the change instead of rewriting history, so nothing is lost.

### Worth knowing

- `push -f` rewrites the remote branch. It's intended here, but it does mean anything on the remote that isn't in your local branch is discarded.
- Cloudflare keeps its own deployment history. **Workers & Pages → your project → Deployments → Rollback** reverts the live site instantly without touching git — useful when you need the site fixed now and want to sort the repo out afterwards.
- Run `npm test` and `npm run build` before pushing. Both are quick and catch most breakage before it reaches the live site.

---

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:4321. Leave `npm run dev` running while you work — edits appear instantly in the browser.

```bash
npm run dev       # local preview at :4321
npm run build     # production build into dist/
npm run preview   # serve the built site locally
```

---

## What's built so far

**33 tools across 41 pages, in five live categories.** Categories with no published tools are hidden automatically and appear the moment they gain one — see `src/data/site.js`.

**Homepage** — a brand facade only: category cards, no individual tool content. Every tool lives on its own flat URL.

**Financial Calculators (6)** — mortgage calculator, mortgage comparison, mortgage overpayment, stamp duty, take-home pay, compound interest.

**Health & Fitness Calculators (2)** — BMI calculator, blood sugar unit converter.

**Text Tools (10)** — word unscrambler, anagram solver, words starting with, word counter, case converter, text diff checker, duplicate line remover, remove extra spaces, lorem ipsum generator, text reverser.

**Developer Tools (7)** — hash generator, UUID generator, Base64 encoder, URL encoder, JSON formatter, timestamp converter, number base converter.

**PDF Tools (8)** — merge, split, delete pages, rotate, reorder, images to PDF, add page numbers, watermark.

**Still stubs** — Scrabble word finder and Words With Friends cheat, both needing their own tournament dictionary and tile-value tables. **Unit Converters** exists as a category but has no tools yet, so it stays hidden.

**Site pages** — `/about` (with the magpie story) and `/privacy-policy`, both linked in the footer alongside a feedback link. The privacy policy carries the cookie and ad-vendor disclosures AdSense requires.

**Tests** — 189, run with `npm test`. The finance and health engines are checked against worked examples published by HMRC, Revenue Scotland and the WHO; the hashes against the RFC 1321 and SHA specification vectors.

---

## Still to do

### Step 1 — Push (routine)

```bash
git add .
git commit -m "your message"
git push
```

### Step 2 — Deploy on Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pick the **`web-utilities`** repo
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Output directory: `dist`
4. **Save and Deploy**

Every `git push` to `main` then redeploys automatically.

Free-tier limits are not a concern at this size: unlimited bandwidth, 500 builds/month, 20,000 files per site, 25 MiB max per file. The largest asset here is the word dictionary at under 2 MB.

### Step 3 — Point the domain

1. Cloudflare Pages → your project → **Custom domains** → add `gazza.ltd`
2. Cloudflare gives you nameservers or DNS records
3. In **Spaceship**, open the DNS settings for `gazza.ltd` and enter them

Allow up to a few hours for DNS to propagate.

### Step 4 — Google Search Console

Add `gazza.ltd` as a property, verify it (DNS TXT record via Spaceship is easiest), and submit:

```
https://gazza.ltd/sitemap-index.xml
```

Do this on day one. The clock on ranking starts when Google finds the site.

### Step 5 — AdSense (later)

Google needs a live site with real content and some traffic history before approving an account — applying too early usually gets rejected. Once approved, swap the placeholder `<div class="ad-slot">Ad</div>` stubs in `ToolPage.astro` for real ad unit code, and tighten `/privacy-policy` from "once ads are enabled" to describe what's actually running.

Also worth doing before applying: point `hello@gazza.ltd` (used on `/about` and `/privacy-policy`) at a real mailbox.

---

## Adding a new tool

Three steps, every time:

**1. Add an entry to `src/data/tools.json`** and set `"published": true`:

```json
{
  "slug": "compound-interest-calculator",
  "title": "Compound Interest Calculator",
  "h1": "Compound Interest Calculator",
  "category": "finance",
  "metaDescription": "See how savings grow...",
  "keywords": ["compound interest calculator"],
  "related": ["mortgage-calculator"],
  "published": true
}
```

That alone puts it on the category hub, the footer and the sitemap.

**2. Write the widget** at `src/components/tools/CompoundWidget.jsx` — plain React, same pattern as the mortgage one.

**3. Create the page** at `src/pages/compound-interest-calculator.astro`, copying an existing tool page and swapping the widget, the FAQ array and the three prose slots.

The filename must match the `slug` exactly. That's what makes the URL.

---

## The word-game dictionaries

The word tools read two static JSON files that are **generated, not hand-edited**:

```
public/data/en/word-index.json    sorted-letters → words, for anagram/subset lookup
public/data/en/words.json         flat list, for prefix/suffix/contains search
public/data/en/defs/{a-z}.json    definitions, one file per starting letter
```

All are checked into the repo, so a normal `npm install && npm run build` needs nothing extra. Only re-run the generators if the source word list changes:

```bash
node scripts/build-word-index.mjs
node scripts/build-definitions.mjs
```

Source is the `wordlist-english` package (SCOWL-derived), using frequency tiers 10–60 — everyday recognisable English. Tier 70+ is deliberately excluded: that's where dialect, archaic and obscure entries live, which is wrong for a general unscrambler even though it's exactly right for a competitive Scrabble dictionary. When the Scrabble and Words With Friends tools get built, they'll want their own separate, fuller dictionaries.

Data is namespaced by language (`public/data/<lang>/`) and the widgets have a language picker with English live and French/Spanish/German listed as coming soon. Adding a language means: source a word list, add a case to the generator, regenerate.

### Word definitions

Clicking any word in a result list shows what it means. **The definitions are never downloaded with the results** — only when a word is actually clicked, and only the file for that starting letter, so a lookup costs roughly 40KB rather than the ~1MB the full set would. That is the whole reason for the 26-file split; don't merge them back into one.

Source is **WordNet 3.1** (Princeton), via the MIT-licensed `wordnet-db` dev dependency. WordNet's own licence permits commercial use provided the copyright notice is kept, so **the attribution at the bottom of the three word tool pages is a licence condition, not decoration.** Leave it in place, and add it to any new page that shows definitions.

Two things worth knowing about the generator:

- **Sense selection.** WordNet's `data.*` files are ordered by synset offset, not by meaning, so taking the first entry gives the wrong definition — `rain` came out as "anything happening rapidly", the *rain of bullets* sense. The generator reads `index.sense` instead and picks the sense with the highest semantic-concordance tag count, i.e. the one most observed in real tagged text.
- **Coverage is 91.8%, not 100%.** WordNet stores base forms only, so inflections are resolved with suffix rules (`berries → berry`, `knives → knife`). The package doesn't ship WordNet's exception lists, so irregulars like `ran` and `geese` stay unresolved. The UI says so plainly rather than pretending the word isn't real, and a missing or broken shard degrades to "no definition" instead of breaking the tool — the word list is the product, definitions are a bonus.

---

## The rules worth not breaking

- **Tools are flat files** in `src/pages/`. Hubs are folders. Changing this changes your URLs.
- **Every tool needs all seven parts** — H1, tool, intro, how it works, worked example, FAQ, related. The layout enforces the shape; you supply the content. Skipping the prose is the difference between ranking and not.
- **`tools.json` is the source of truth.** Never hard-code a tool name or link in a template.
- **The homepage stays a facade.** Category cards only, no individual tool content.
- Keep `"published": false` on anything unfinished. It stays off the sitemap and out of the nav.
