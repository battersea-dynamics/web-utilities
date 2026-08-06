# Distribution: every route to visibility for gazza.ltd

Written August 2026. Everything is graded by how good the evidence actually is,
because most published SEO advice is assertion dressed as fact.

**Evidence key**

| | Meaning |
|---|---|
| **[E]** | Evidenced — the platform documents it, or independent measurement supports it |
| **[P]** | Practice — widely done by people who succeeded, but no controlled evidence |
| **[G]** | Guess — plausible mechanism, untested, could be a waste of time |
| **[X]** | Actively harmful — listed so you can recognise and avoid it |

**Effort** is your hours. **Ceiling** is the realistic best case, not the dream.

---

## 0. The uncomfortable framing

Three facts that should shape everything below.

**You cannot out-SEO your way in from zero.** Ranking requires authority;
authority comes from being referenced elsewhere. So the first phase is not
search at all — it is getting referenced. Search follows.

**Brand mentions now beat backlinks for AI visibility. [E]** Analysis of LLM
citation patterns found brand search volume the strongest single predictor of
being cited by ChatGPT and Perplexity — ahead of traditional backlinks — and
sites in the top quartile for web mentions get roughly ten times the AI
visibility of the bottom quartile. This matters more each year: AI search
referrals hit about 0.9% of all web traffic in March 2026, five times what they
were a year earlier. Small, but the growth rate is the point.

The practical consequence is awkward. The thing that works is **being talked
about by name**, which is much harder to manufacture than a link.

**Your two genuine assets are not the ones you've spent most time on.** The
client-side PDF processing is a real technical differentiator that a specific
audience cares about. The word tools have real volume. The UK finance
calculators — six of them, the most tested code on the site — are competing
against MoneySavingExpert, HMRC's own calculators, and every bank in Britain.
That is the hardest possible category to enter and it is where the most effort
has gone.

---

## 1. Evidence-backed — do these first

### 1.1 Embeddable widgets [E] — effort: 2 days · ceiling: high

**The single best structural idea for a calculator site.** Let anyone drop your
mortgage or stamp duty calculator onto their own page with an iframe, with a
"powered by gazza.ltd" link underneath.

Why it works, mechanically: estate agents, mortgage brokers, personal-finance
bloggers and accountants all want a calculator on their site and none of them
want to build one. Each embed is a permanent, contextually relevant, editorially
placed link from exactly the kind of site you need links from. This is how a lot
of calculator sites acquired their early link profiles.

It fits your architecture almost for free — the widgets are already
self-contained React islands. You'd need a `/embed/<slug>` route rendering the
widget bare, an `X-Frame-Options` exception for those routes only, and a copy-paste
snippet on each tool page.

Risk to watch: the attribution link must be a real `<a>` in the iframe, and
iframed content doesn't pass link equity the way an in-page link does. Put the
attribution in the host page's snippet, not only inside the frame.

### 1.2 Fix what's already indexed [E] — effort: 2 hours · ceiling: low but free

Bing still lists Nexvita product URLs under your domain. The soft-404 is fixed,
so these will decay, but Bing Webmaster Tools has a content-removal tool that
does it in days rather than months. While you're there: submit the sitemap,
enable IndexNow. Bing is ~5% of search and less competitive than Google, so a
new site surfaces there sooner. Don't mistake it for a strategy — 5% of search
is a rounding error against your problem — but it costs an hour.

### 1.3 Schema markup for rich results [E] — effort: 1 day · ceiling: medium

You already emit FAQ schema. Missing and worth adding:

- `SoftwareApplication` or `WebApplication` on each tool page
- `HowTo` on the PDF tools, which have genuine step sequences
- `BreadcrumbList` — you have visual breadcrumbs but may not be marking them up
- `Organization` with a real `sameAs` once you have any social presence

Google has reduced how many rich results it shows, so this is no longer the win
it was in 2020. But structured data is also what AI crawlers parse most reliably,
which is where the growth is.

### 1.4 Don't block AI crawlers [E] — effort: 20 minutes · ceiling: unknown

Check `robots.txt` permits `PerplexityBot`, `OAI-SearchBot`, `ChatGPT-User`,
`ClaudeBot` and `Google-Extended`. Many templates block these by default. If you
want AI citations you must let the crawlers in — this is necessary, not
sufficient.

**Note on `llms.txt` [X-ish]:** it's heavily promoted and there is currently *no*
evidence it produces citations. Analysis across 515 million LLM bot events found
no measurable effect as of May 2026. It costs ten minutes, so add one if you
like, but anyone selling it as a ranking factor is selling something.

### 1.5 Open-source the repo [P/E] — effort: 1 day · ceiling: medium-high

Your PDF tools do something genuinely uncommon: full manipulation in-browser with
zero upload. As a public GitHub repo that is an interesting artefact rather than
a marketing message. GitHub repos rank, get linked from awesome-lists, and get
discovered by exactly the developers who write the roundup posts you want to be in.

Real cost: the code becomes copyable. For a free ad-funded tool site the moat was
never the code — it's the domain and the traffic — so I think this is close to
free. But it's a one-way door, so decide deliberately.

---

## 2. Standard practice — plausible, weakly evidenced

### 2.1 Tool directories [P] — effort: 1 day · ceiling: low-medium

AlternativeTo, SaaSHub, Slant, Product Hunt's alternatives pages, plus the long
tail of "free online tools" directories. Most are low-quality and pass little
value. Two or three are worth it: **AlternativeTo** in particular, because people
genuinely search "iLovePDF alternative" and your no-upload angle is a real
differentiator there.

Timebox this. The directory long tail is a well-known way to feel productive for
a week and gain nothing.

### 2.2 Reddit [P] — effort: ongoing · ceiling: high, with a big caveat

Where your tools are actually the answer to questions being asked:

- r/UKPersonalFinance, r/HousingUK — stamp duty, mortgage overpayment
- r/scrabble, r/wordgames — the word finders
- r/pdf, r/techsupport — the PDF tools, where "without uploading" is the hook
- r/webdev, r/programming — the developer tools

**This is the channel with the highest ceiling and the highest chance of
backfiring.** Reddit removes self-promotional links aggressively and bans
accounts that pattern-match to it. The version that works is slow: participate
genuinely for weeks, answer questions without linking, and link only when your
tool is unambiguously the best answer to that specific question. If you can't
commit to that, skip it — a burned account and a domain flagged as spam is worse
than never posting.

### 2.3 Hacker News [P] — effort: 1 hour · ceiling: very high variance

One "Show HN" for the client-side PDF suite. Honest odds: most Show HN posts get
almost no attention. But the privacy-preserving, no-upload, no-account angle is
precisely what that audience responds to, and a front-page hit means tens of
thousands of visitors plus durable links from people who blog about it.

One shot, essentially. Lead with the technical claim, not the product: "PDF tools
that never upload your file — everything runs in the browser." Have the site
fast and working first.

### 2.4 Answer questions where they're asked [P] — effort: ongoing · ceiling: medium

Stack Overflow, Super User, MoneySavingExpert forums, Quora. Same rules as
Reddit, generally more tolerant of a relevant link. MoneySavingExpert's forums
are particularly on-target for the UK finance tools, and that audience is exactly
who searches those terms.

### 2.5 Original data or research [P] — effort: days · ceiling: high

The thing that reliably earns links without asking is a number nobody else has.
You are sitting on a natural one: **a stamp duty comparison across all four UK
nations**, showing the same purchase price costing different amounts in England,
Scotland and Wales. That's a genuine, linkable, journalist-friendly fact that
your existing code already computes.

Similar: the real cost difference between a low-rate-with-fee and higher-rate-no-fee
mortgage across the whole price range. You built the engine for it already.

### 2.6 Product Hunt and the launch platforms [P] — effort: 1 day · ceiling: low-medium

Product Hunt, DevHunt, Uneed, MicroLaunch, BetaList. Product Hunt skews to SaaS
and AI products now, so a free tools site is a weak fit. Worth one coordinated
launch day for the links and the small traffic spike; don't expect it to matter.

### 2.7 Chrome Web Store [G/P] — effort: 3-5 days · ceiling: medium

A tiny extension wrapping your most-used tools. The store is its own search
engine with far less competition than Google, extensions carry a homepage link,
and installs create repeat users rather than one-off visits.

Real ongoing cost: extensions need maintenance, and the review process is
unpredictable. Only worth it if one tool proves genuinely popular first.

---

## 3. Long shots — cheap, low probability

### 3.1 Wikipedia external links [G] — ceiling: high, probability: very low

A link from a relevant Wikipedia article is enormously valuable and almost
impossible to get legitimately. Editors remove commercial external links on sight,
and adding your own is a conflict of interest under their rules. **Do not try
directly.** The only honest route is being cited by others often enough that an
editor adds you independently. Treat as a lagging indicator, not a tactic.

### 3.2 Being the source for a journalist [G] — ceiling: high

Stamp duty changes generate a flurry of UK press coverage every Budget. A
journalist needs "here's what it costs now versus before" fast. If your calculator
is the easiest way to get that, and you've published a comparison piece the week
of the announcement, you can occasionally get picked up. Requires being ready
*before* the news, which means watching the Budget calendar.

### 3.3 Teachers and .edu links [G] — ceiling: medium

Maths teachers link to calculators. Word game teachers link to unscramblers.
A genuinely useful "for teachers" page — printable worksheets, classroom-safe,
no ads on that page, no sign-up — occasionally gets picked up in school resource
lists, which are often on high-authority domains.

### 3.4 Free public API [G] — ceiling: medium

Expose the stamp duty and mortgage engines as a JSON API. Developers who use it
tend to credit it, and it gets you into "free APIs" awesome-lists, which are
heavily linked. Cost: you now have an API to maintain and rate-limit.

### 3.5 Niche communities nobody thinks of [G]

- UK conveyancing and estate agency forums — stamp duty
- Scrabble clubs and league sites, which still keep link pages
- Accessibility communities — if your tools work well with screen readers, say so
- Privacy communities (r/privacy, PrivacyTools) — the no-upload PDF angle is
  genuinely on-message for them and this is an underrated fit

### 3.6 Comparison content about yourself [G]

"gazza.ltd vs Smallpdf: what happens to your file" — an honest comparison where
you name the real trade-offs, including where competitors are better. These rank
for competitor-brand searches and are shared when they're fair rather than
self-serving.

---

## 4. Absurd, desperate, or just interesting

You asked for these. Ordered by descending sanity.

**Print QR codes on cards for estate agent windows.** Genuinely absurd. But a
stamp duty calculator is exactly what someone standing outside an estate agent
wants, and no competitor is there.

**Buy a dead domain with existing backlinks and redirect it.** Works. Also a
well-known spam signal, and Google has been devaluing redirected expired domains
for years. High risk of poisoning your domain permanently. **I'd avoid it.**

**Build a genuinely fun toy** — a daily word game, a "what's my stamp duty"
shareable card. Toys spread in ways utilities never do. High variance, high
ceiling, and the word dictionary is already sitting there.

**Get a tool mentioned in a pub quiz / crossword newsletter.** Word finder,
crossword audience, newsletters have loyal readers and their archives get indexed.

**Wikipedia edit-a-thons for word game articles.** Not to link yourself — to
become known to the editors who write about word games. Absurdly indirect,
non-zero.

**Sponsor a tiny Scrabble tournament.** £50-100 for a link from a club site and
a genuinely targeted audience.

**Translate one tool into a language with no competition.** You already have the
i18n structure. An Italian stamp duty equivalent (*imposta di registro*) or an
Italian word unscrambler faces a fraction of the English competition. You raised
Italian before, and this is the version of that idea with an actual mechanism.

**Answer every "how do I merge PDFs without uploading" question that has ever
been asked**, going back years. Old threads still rank and still get traffic.
Tedious, mostly ignored, occasionally exactly the right answer.

**Put the calculators on a physical laminated card and post them to mortgage
brokers.** Absurd. Brokers do keep reference cards. Nobody else is doing this.

---

## 5. Actively harmful — recognise and avoid

- **[X] Buying links.** Directly against Google's spam policies; the risk is a
  manual action that removes you from search entirely.
- **[X] Private blog networks, link exchanges, "50 free backlinks" services.**
  Same category. The sites offering these rank well *for that search term*,
  which is not evidence they work for you.
- **[X] Mass directory submission.** Was mildly useful in 2010, is now a footprint
  of a spam site.
- **[X] Auto-generating thousands of programmatic pages** — "words starting with
  AA", "words starting with AB", and so on. Tempting, since you have the data.
  This is precisely what Google's scaled-content-abuse policy targets, and you
  already deferred it pending Search Console data. Keep deferring it.
- **[X] AI-written blog posts at volume.** Same policy. Also, the site already
  carries formulaic supporting prose across 35 tools; adding more increases the
  pattern rather than the value.
- **[X] Reddit link-dropping.** Covered above. Fastest way to get a domain
  flagged.
- **[X] Fake reviews or sockpuppet recommendations.** Beyond the ethics, both
  Reddit and Google are good at detecting it, and the downside is total.

---

## 6. What I'd actually do, in order

Not a plan for a team. A plan for one person with limited evenings.

**First: embeddable widgets.** Highest structural leverage, uses what you've
already built, and every embed is a permanent link from a relevant site. Two days
of work that keeps paying.

**Then: Bing Webmaster Tools, IndexNow, crawler check, schema.** One evening
of unglamorous hygiene that unblocks everything else.

**Then: pick one community and be a real participant.** One. r/UKPersonalFinance
or r/wordgames or r/privacy, whichever you'd genuinely enjoy. Six weeks of
contributing without linking, then link only where it's the honest answer. This
is slow and it is the thing that actually compounds.

**Then: the four-nations stamp duty comparison** as a genuine piece of original
data. You have the engine; this is writing, not building.

**Then, once the site is fast and proven: one Show HN** for the PDF suite.

Everything else is optional and most of it is noise.

---

## 7. Measuring it — so you can stop doing what doesn't work

Set up before you start, or you'll never know which of the above worked:

- **Search Console and Bing Webmaster Tools** — impressions before clicks.
  Impressions rising means you're being seen; that's the first signal.
- **Referrer traffic**, so a Reddit or HN spike is attributable.
- **Brand searches for "gazza"** — the leading indicator for both rankings and
  AI citations, per the evidence in §0.
- **A monthly check of whether ChatGPT or Perplexity mention you** for queries
  like "calculate stamp duty UK" or "merge PDF without uploading". Crude, but
  it's the only feedback loop available for AI visibility.

Give anything you try at least eight weeks before judging it. Most of this is
slower than it feels like it should be.

---

## Sources

- Search engine market share 2026 — <https://www.digitalapplied.com/blog/search-engine-market-share-2026-global-data>
- llms.txt evidence review — <https://livegodigital.com/the-great-llms-txt-confusion-of-2026/>
- How AI engines source information — <https://www.leapd.ai/blog/ai-visibility/how-chatgpt-google-ai-overviews-and-perplexity-source-information-in-2026>
- Google on word count and thin content — <https://www.seroundtable.com/google-word-count-34092.html>
