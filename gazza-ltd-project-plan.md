# gazza.ltd — Utilities Site Project Plan

**Status:** Planning
**Domain:** gazza.ltd (registrar: Spaceship)
**Repo:** GitHub
**Hosting:** Cloudflare Pages
**Framework:** Astro

---

## 1. The Business Model

### What it is

Simple, single-purpose utility pages that answer a repeated search query, monetised with display ads (Google AdSense or, at higher traffic, Mediavine / Raptive / Ezoic). Traffic is evergreen — people search "mortgage calculator" every month forever, with no content refresh needed.

### The reference case

WordUnscrambler.me pulls roughly 8.8 million visitors a month, mostly from search. It was started as a weekend project in 2014 by Ramesh Jha, who has since built a small portfolio of similar tools (typing speed test, open port checker, SIP calculator, signature maker, syllable counter, word solver) that cross-link to each other in the footer.

### Realistic expectations

- AdSense pays roughly £3–15 per 1,000 pageviews for utility traffic (RPM varies hugely by category — finance high, random/fun low).
- ~150,000 monthly visits ≈ £1,000/month at a middling RPM.
- Timeline: 12–18 months to meaningful traffic, not weeks.
- Expect several tools to flop for every one that works.
- The YouTube video that prompted this is sponsored (Hostinger) with affiliate links (ClearSERP, WhatToShip). The model is real; the "15 minutes to income" framing is marketing.

---

## 2. The Core Strategic Insight

**Google eats simple queries.** Celsius→Fahrenheit, USD→GBP, cups→litres — Google answers these directly in the search results box. A plain converter page will get almost no traffic.

**The winners are tools where:**

1. **The answer needs several inputs** — Google can't inline a mortgage repayment that depends on price, deposit, rate, and term.
2. **The answer is country-specific** — UK stamp duty, take-home pay after tax and NI, UK/EU/US shoe sizes.
3. **The query is endlessly long-tail** — "unscramble RTEPSA" has infinite variants.
4. **The user is mid-task and searching repeatedly** — word game players, developers, people doing a renovation.

**Mortgage calculator is the strongest single starting point** for exactly these reasons: multi-input, country-specific, high commercial intent, high ad rates.

---

## 3. Master Tool List

### Money & property
*Best commercial value — highest ad rates*

- Mortgage repayment + overpayment calculator
- Stamp duty calculator (UK-specific, changes with budgets)
- Rent vs buy comparison
- Loan/EMI and car finance calculator
- Compound interest / savings growth
- Take-home pay calculator (salary after tax & NI)
- Contractor day-rate vs salary comparison
- VAT calculator (add/remove)
- Dividend vs salary for a limited company
- Pension drawdown / retirement pot projection
- Currency converter with historical chart (adds value over Google's)
- Invoice late-payment interest calculator
- Bill splitter / tip calculator
- Fuel cost per journey
- Inflation "what's it worth today"
- Freelance hourly rate calculator

### Health & body

- BMI, BMR and daily calorie needs
- Body fat percentage
- Water intake
- Pregnancy due date and milestones
- Ovulation / cycle tracker
- Sleep cycle bedtime calculator
- Pace, distance and calories-burned for running/walking
- One-rep-max lifting calculator
- Ideal weight range
- Blood pressure category checker

### Time & dates

- Age calculator (to the day)
- Date difference / days-between
- Add-or-subtract working days
- Countdown-to-event generator
- Time zone meeting planner
- Timesheet / hours-worked calculator
- Stopwatch and timer

### Everyday conversions
*Low traffic alone, good as a cluster*

- Length, weight, area, volume, speed, energy, fuel economy
- Height converter (ft/in ↔ cm)
- Clothing and shoe size converter (UK/US/EU) — this one Google does badly
- Cooking measurement converter (cups ↔ grams, per ingredient)
- Oven temperature + air fryer conversion
- Paint/tile/flooring quantity calculator for a room

### Text & developer tools
*Easy to build, sticky audience*

- Word and character counter
- Case converter, text diff, duplicate line remover
- Password generator
- QR code generator
- JSON/XML formatter and validator
- Base64, URL and hash encoders
- Colour picker / hex↔RGB
- Lorem ipsum generator
- Regex tester
- Markdown ↔ HTML
- UUID generator, timestamp converter

### File & image

- Image resizer and compressor
- Image format converter
- PDF merge/split
- CSV ↔ JSON converter
- Favicon generator

### Random / fun
*Great for backlinks and social traffic*

- Random number, dice, coin flip
- Random name/team picker wheel
- Decision spinner
- Grade and GPA calculator
- Percentage calculator (add %, % change, % of)

### Additional candidates worth considering

Following the word-game logic (Google can't inline, endless long-tail, repeat searchers):

- Word unscrambler / anagram solver
- Scrabble & Words with Friends word finder
- Syllable counter
- Rhyme finder
- Typing speed test
- Open port checker
- Signature maker
- PC build compatibility checker

---

## 4. Technical Decisions

### Hosting

| Option | Verdict |
|---|---|
| **Cloudflare Pages** | **Chosen.** Generous free tier, fast globally, account already held |
| Netlify | Fine alternative, tighter free bandwidth |
| Vercel | Excellent DX, but free tier prohibits ad-monetised commercial sites — disqualifying |
| GitHub Pages | Free, static only, no serverless functions |
| Render | Viable, less suited to static-first |

Point `gazza.ltd` at Cloudflare Pages from the Spaceship DNS panel. Use one deploy target only.

### Framework: Astro

**In plain English:** Astro pre-builds pages into plain HTML files, so they load instantly and Google reads them easily. It then lets you attach a small piece of interactive JavaScript to only the part that needs it — the calculator widget — instead of loading a heavy framework on every page.

That's exactly what a tools site needs: fast SEO-friendly pages with interactive widgets, plus a shared layout so 100+ pages don't mean 100 copy-pasted headers.

### Why not Shopify

Shopify is an ecommerce platform. It can't run proper server-side logic, AdSense integration is awkward, and standard plans (Basic, Shopify, Advanced) support only **one store each** — a second store means a second subscription. Wrong tool. Keep the existing Shopify plan for whatever it currently does.

---

## 5. URL Architecture

**Rule: flat URLs for tools, folders only for hub pages.**

```
gazza.ltd/                        homepage — all categories
gazza.ltd/finance/                hub page — links to all finance tools
gazza.ltd/mortgage-calculator     the tool itself, flat
gazza.ltd/stamp-duty-calculator
gazza.ltd/word-counter
```

**Why flat for tools:** shorter URLs rank marginally better, and you can re-categorise later without breaking links or needing redirects.

**Why hubs at all:** they give topical grouping and internal links that pass authority down to each tool page.

**Decide now, don't change later.** Redirects on a young site cost rankings.

### Category hubs

`/finance` · `/health` · `/dates` · `/converters` · `/text` · `/developer` · `/images` · `/random`

---

## 6. Repository Structure

```
gazza-tools/
├── src/
│   ├── layouts/
│   │   ├── Base.astro              header, footer, ad slots
│   │   └── ToolPage.astro          reusable tool page template
│   ├── components/
│   │   ├── tools/                  one component per calculator
│   │   │   ├── MortgageWidget.jsx
│   │   │   ├── BmiWidget.jsx
│   │   │   └── ...
│   │   └── ui/                     shared inputs, buttons, result cards
│   ├── data/
│   │   └── tools.json              MASTER SOURCE OF TRUTH
│   └── pages/
│       ├── index.astro
│       │
│       ├── finance/index.astro     → /finance
│       ├── health/index.astro      → /health
│       ├── dates/index.astro       → /dates
│       ├── converters/index.astro
│       ├── text/index.astro
│       ├── developer/index.astro
│       │
│       ├── mortgage-calculator.astro
│       ├── stamp-duty-calculator.astro
│       ├── take-home-pay-calculator.astro
│       ├── bmi-calculator.astro
│       ├── age-calculator.astro
│       ├── word-counter.astro
│       ├── password-generator.astro
│       └── ...one flat file per tool
├── public/
├── astro.config.mjs
└── package.json
```

### Key clarifications

- **Hubs live in folders; tools live as flat files.** In Astro the file path becomes the URL: `finance/index.astro` → `/finance`, `mortgage-calculator.astro` → `/mortgage-calculator`.
- Hub pages can be generated by a single dynamic `[category]/index.astro` driven from `tools.json` — write once, and each new category's hub appears automatically.
- Tools stay as separate files because each has genuinely different logic (amortisation maths vs QR library vs text parsing). That can't be templated away.
- If it reaches 100+ files, resist nesting tools into subfolders — that would change URLs.

### tools.json — the single source of truth

Every tool gets one entry:

```json
{
  "slug": "mortgage-calculator",
  "title": "Mortgage Calculator",
  "category": "finance",
  "h1": "Mortgage Calculator",
  "metaDescription": "Work out monthly repayments...",
  "keywords": ["mortgage calculator", "mortgage repayment calculator"],
  "related": ["stamp-duty-calculator", "rent-vs-buy", "loan-calculator"]
}
```

Add an entry and the homepage, category hub, sitemap, breadcrumbs and internal links all update automatically. **This is what makes 100 tools manageable.**

---

## 7. The Page Template That Ranks

Every tool page uses the same skeleton, baked into `ToolPage.astro`:

1. **H1** = the exact search term ("Mortgage Calculator")
2. **The tool itself** — immediately, above the fold, no preamble
3. **Short explanation** of what it does
4. **How it works** — the formula or method
5. **Worked example** with real numbers
6. **FAQ** — 4–6 genuine questions
7. **Related tools** — links to 3–4 siblings

Items 3–7 are what separate a page that ranks from a bare widget that doesn't.

### Example page file

```astro
---
import ToolPage from '../layouts/ToolPage.astro';
import MortgageWidget from '../components/tools/MortgageWidget.jsx';
---
<ToolPage slug="mortgage-calculator">
  <MortgageWidget client:load slot="tool" />
  <div slot="how-it-works">...</div>
  <div slot="faq">...</div>
</ToolPage>
```

Title tags, meta descriptions, breadcrumbs, ad slots, related links and schema markup all come from `tools.json` via the layout. Never repeated by hand.

---

## 8. SEO Priorities

**What actually matters, in order:**

1. **Page title tag** — keyword at the front
2. **URL slug** — `/mortgage-calculator`, not `/page-3`
3. **H1** matching search intent
4. **The tool working** — fast, mobile-first, no layout shift
5. **Real explanatory content beneath the tool** — a few hundred words
6. **Backlinks** from elsewhere
7. Domain name — a minor factor

**On the domain name:** `gazza.ltd` is a neutral brandable umbrella, which is correct for a multi-topic site. Nobody searches "gazza" — they search "mortgage calculator" and land on the tool page, not the homepage. An exact-match domain (e.g. `wordunscrambler.me`) helps only when a whole domain serves one tool.

**Meta descriptions** barely affect ranking — they affect click-through rate.

### One domain vs many

- **One domain, many pages** — authority compounds across the site, one thing to manage. **This is the chosen approach.**
- **Separate domains** — better for unrelated tools and exact-match names; more work, slower to build authority. Ramesh Jha's portfolio uses this, with footer cross-links between sites. Possible later expansion, not now.

### Getting initial traction

- Submit to Product Hunt, BetaList, Uneed
- Share on Hacker News and relevant subreddits
- Add substantive content to the homepage and hubs
- Set up Google Search Console from day one

---

## 9. Build Roadmap

### Phase 1 — Prove the pipeline
Repo + Astro + Cloudflare Pages deploy + custom domain + `tools.json` + `ToolPage.astro` + **one complete tool page** (mortgage calculator). End-to-end, live.

### Phase 2 — First cluster
8–10 tools in one category (recommend Money & Property — highest ad rates, strongest anti-Google moat). Publish, submit sitemap, set up Search Console.

### Phase 3 — Measure
Wait 8–12 weeks. Check Search Console: which pages get impressions? Which keywords? Where are you ranking 11–20 (nearly there)?

### Phase 4 — Expand
Build out categories that showed signal first. Then broaden toward the full list.

### Phase 5 — Monetise
Apply to AdSense once there's real content and traffic. Move to a higher-paying network at scale.

**The logic:** the full umbrella is the destination, but building 100 pages before knowing whether any can rank is the expensive mistake. Phase 2 answers that question for the cost of a fortnight.

---

## 10. Open Questions

- Which single category to lead with — Money & Property is recommended, but word/puzzle tools have the strongest structural moat against Google
- Whether to use the second domain later for a separate cross-linked site
- Ad network choice and placement policy (Ramesh Jha's sites deliberately run 1–2 plain display units per page, no sticky units or pop-ups — worth copying)
- Analytics: Cloudflare Web Analytics (privacy-friendly, free) vs Google Analytics
