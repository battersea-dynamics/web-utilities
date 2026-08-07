# Distribution plan — gazza.ltd

Last revised August 2026. Supersedes the earlier version and folds in the
second reviewer's five points, with corrections.

---

## How to read this

**Evidence grades.** Most published SEO advice is assertion dressed as fact.
Everything below is graded so you can tell the difference.

| | Meaning |
|---|---|
| **[E]** | Evidenced — the platform documents it, or independent measurement supports it |
| **[P]** | Practice — widely done by people who succeeded, no controlled evidence |
| **[G]** | Guess — plausible mechanism, untested |
| **[X]** | Harmful — listed so you can recognise it |

**The constraint that shapes everything.** You are one person with evenings.
There are ~60 tactics listed here. Doing five properly beats attempting twenty.
Part 1 is the plan; Part 2 exists so nothing is missed, not so it all gets done.

**Three facts that decide the ordering**

1. **You cannot out-SEO your way in from zero.** Ranking needs authority;
   authority comes from being referenced. Getting referenced comes first.
2. **Brand mentions beat backlinks for AI visibility. [E]** Brand search volume
   is the strongest single predictor of ChatGPT and Perplexity citations, ahead
   of backlinks; top-quartile sites for web mentions get ~10× the AI visibility
   of the bottom. AI referrals were ~0.9% of web traffic in March 2026, 5× the
   year before. Small, but the direction matters.
3. **Your assets are not where your effort went.** Six UK finance calculators —
   your most tested code — compete with MoneySavingExpert, HMRC and every bank
   in Britain. The client-side PDF tools are the genuine differentiator; the
   word tools have the volume. Distribution effort should go where the
   advantage is, not where the build effort was.

---

# PART 1 — Do these now

Five things, in this order. Roughly six to eight evenings total.

## 1.1 The embed route — `/embed/<slug>` [E] · 2 days

**Why first.** Every embed is a permanent, editorially placed link from exactly
the kind of site that makes finance pages rank. It uses what you have already
built — the widgets are self-contained React islands. And unlike outreach, it
keeps working without further effort. This is how calculator sites
conventionally acquired their early link profiles.

**Build:** a bare route per tool rendering the widget with no site chrome, and
an `X-Frame-Options` exception for `/embed/*` only (your current `_headers`
sets `SAMEORIGIN` site-wide, which would block all embedding).

**Critical technical point.** The attribution link goes in the snippet the host
pastes into *their page*, outside the iframe — not only inside the frame.
Content inside an iframe is attributed to the source domain, so an in-frame
link does not pass value to you the way an in-page link does. Get this wrong
and the whole exercise is decorative.

**Do not version the URLs.** One unversioned URL per tool, served from your
domain, rendering current rates. Then when rates change you push once and every
host is correct within minutes. Versioning would freeze each host on whatever
they pasted and destroy the single biggest advantage an iframe has over a
copied script.

## 1.2 The `/embed` landing page [P] · 1 day

**The sharpest idea in any of the three documents, and it came from the second
reviewer.** People actively search "add mortgage calculator to website", "free
stamp duty calculator widget", "mortgage calculator for WordPress". Those
searchers are not looking for a calculator — they are looking for precisely
what you are giving away. The conversion problem is solved before they arrive.

Build it as a real page targeting those queries: a live preview, one-click copy
snippets, and install instructions for WordPress, Squarespace, Wix and raw HTML.

**Realistic check:** competition here is thinner than for "stamp duty
calculator" but not absent — several established calculator sites offer embeds.
Your differentiator is UK-specific, four-nations, and sourced.

## 1.3 Indexing hygiene [E] · 1 evening

Unglamorous, cheap, and it unblocks everything else.

- **Bing Webmaster Tools** — verify, submit sitemap, enable IndexNow. Bing is
  ~5% of search and less competitive, so new sites surface sooner. Not a
  strategy; an hour well spent.
- **Content removal** for the remaining Nexvita URLs. The soft-404 is fixed so they will
  decay naturally, but the removal tool does it in days.
- **Crawler check** — confirm `robots.txt` permits `PerplexityBot`,
  `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Google-Extended`.
  *Already verified: your robots.txt is `Allow: /`, nothing is blocked.*
- **Schema** — you already emit `WebApplication` and `FAQPage`. Add `HowTo` to
  the PDF tools and `BreadcrumbList` sitewide. Smaller job than expected.

## 1.4 Budget day as a build deadline [P] · ongoing, ~2 days per event

Stamp duty changes at every Budget. In the fortnight afterwards every broker
and conveyancer needs updated figures and nobody wants to rebuild a calculator.
That is your single best outreach window of the year and the one day you can
outrun larger sites — but only if your rates are already correct and a "what
changed" page publishes within hours.

**This makes the Budget date a build deadline, not a marketing date.** Put it
in the calendar. `taxData.js` carries `LAST_VERIFIED` for exactly this.

## 1.5 One community, properly [P] · ongoing, 2–3 hours a week

Pick **one**: r/UKPersonalFinance, r/HousingUK, r/privacy, r/scrabble or
r/webdev — whichever you would genuinely enjoy. Participate for six weeks
without linking. Then link only where your tool is unambiguously the best
answer to that specific question.

This is the highest-ceiling and highest-risk channel. Reddit removes
self-promotional links aggressively and bans accounts that pattern-match to
spam. If you cannot commit to the slow version, skip it entirely — a burned
account and a domain flagged as spam is worse than never posting.

---

# PART 2 — Everything else

## 2A. Worth doing — after Part 1, or if something proves out

| Idea | Grade | Effort | Verdict |
|---|---|---|---|
| **Four-nations stamp duty comparison** as original data | [P] | 2 days | **Do it.** Same house, three different tax bills — genuinely surprising, journalist-friendly, and your engine already computes it. Original data earns links without asking. |
| **Discord bot for the word tools** | [G] | 3 days | **Strong.** Word-game Discord servers are large and active; bots get invoked constantly rather than visited once, and bot directories are their own discovery channel. Better fit than the WordPress plugin. |
| **npm package of the calculation engines** | [G] | 1 day | **Underrated.** npm has a public dependents graph — every project installing it creates a permanent, crawlable reference. Developers building calculators are exactly who then links to you. |
| **Open-source the repo** | [P] | 1 day | **Probably yes.** Client-side PDF manipulation is an interesting artefact, not a marketing message. Repos rank, get into awesome-lists, get found by people who write roundups. One-way door: decide deliberately. |
| **Rate-change tracker + RSS** | [G] | 1 day | Become the canonical "what changed and when" source. Journalists need this and there is no clean one. |
| **Open dataset on GitHub** — historical UK thresholds as CSV/JSON | [G] | 1 day | Datasets get cited by people building their own tools. Those citations are the "mentions" that drive the AI-visibility effect. |
| **AlternativeTo listing** | [P] | 1 hour | People genuinely search "iLovePDF alternative" and your no-upload angle is a real differentiator. The one directory clearly worth the time. |
| **Show HN** for the PDF suite | [P] | 1 hour | One shot. Most Show HN posts sink; the privacy angle is exactly what that audience responds to. Lead with the technical claim, not the product. Do it only once the site is fast and proven. |
| **PWA, PDF tools only** | [P] | 1 day | Manifest with `start_url` at `/pdf`, service worker caching pdf-lib, install prompt only on PDF pages. AdSense works unchanged because it runs in the browser engine. Offline sessions earn nothing — accept that. Install rates are low, so treat it as an experiment that tells you whether the PDF tools have real users. |
| **Shareable result cards** | [G] | 2 days | "My stamp duty is £14,200" as an image with the URL baked in. No SEO value; real brand-search value, which per §0 is what drives AI citations. |
| **Comparison content about yourself** | [P] | 1 day | "gazza.ltd vs Smallpdf: what happens to your file." Ranks for competitor-brand searches, shared when genuinely fair — which means naming where they are better. |

## 2B. Think about — real trade-offs, decide later

**Direct outreach to brokers, conveyancers, accountants** [P]

The second reviewer recommended targeting independent single-office firms
because they convert best. **There is a legal problem with exactly that
segment.** Under PECR, limited companies and LLPs are "corporate subscribers"
and may be emailed without prior consent; **sole traders and ordinary
partnerships are individual subscribers and require consent**. Independent
single-office firms are disproportionately sole traders.

If you do this: filter by company type at Companies House first, rely on
legitimate interest under UK GDPR, include an unsubscribe route, keep volumes
modest. The ICO acts on complaints rather than scanning, but the exposure is
real.

Also: her estimate of 5–15 embeds per 200 emails is optimistic. Cold B2B
outreach converting to *action* is nearer 1% — so 200 emails is realistically
one or two embeds. That changes whether the hours are worth it.

**WordPress plugin** [P] — *correction to my earlier advice*

I previously said a thin iframe wrapper risks rejection for insufficient
functionality. **Checking the actual guidelines, I overstated this.** They
explicitly permit plugins acting as an interface to an external service
"provided the service itself provides functionality of substance" — a working
calculator qualifies.

The real constraint is different: plugins "may not contact external servers
without explicit and authorized consent." An iframe loading from gazza.ltd on
page render does exactly that, so you would need opt-in handling and a
documented privacy policy in the readme. Bundling the calculator locally avoids
that but forfeits auto-updating rates. **Which argues for iframe embeds as
primary and the plugin much later, if at all.**

**TikTok** [G] — you have no followers, which matters less than you would think

TikTok's For You algorithm is content-first rather than follower-first, so
starting from zero is not the handicap it is elsewhere. But be clear about the
mechanism: TikTok links are nofollow and bio-only, so there is no SEO value.
The value is brand searches — making people search "gazza", not click through.
Per §0 that is the strongest predictor of AI citations.

Content that would plausibly work is the surprising fact, not the tool demo:
the four-nations stamp duty gap, threshold cliff edges where one pound of price
costs thousands in duty. Honest caveat: most accounts post for months into
silence, and it is a completely different skill from building software.

**Chrome extension** [G] — the store is its own search engine with far less
competition, and listings carry a homepage link. Extensions need maintenance
and review is unpredictable. Only after one tool proves genuinely popular.

**Browser extension that detects an open PDF** [G] — higher intent than a store
listing alone, same maintenance caveat.

**Free public JSON API** [G] — developers who use it tend to credit it, and it
gets you into "free APIs" awesome-lists which are heavily linked. Cost: an API
to maintain and rate-limit.

**Italian version of one tool** [G] — you already have the i18n structure. An
Italian word unscrambler or *imposta di registro* calculator faces a fraction
of the English competition. The version of your earlier Italian idea that has
an actual mechanism.

**Teachers and .edu resources** [G] — a genuine "for teachers" page, printable,
ad-free, no sign-up. School resource lists sit on high-authority domains.

**Product Hunt / DevHunt / Uneed / MicroLaunch / BetaList** [P] — Product Hunt
skews to SaaS and AI now, so a free tools site is a weak fit. Worth one
coordinated launch day for the links; do not expect it to matter.

**Answering questions at scale** [P] — Stack Overflow, Super User,
MoneySavingExpert forums, Quora. MSE is particularly on-target for the UK
finance tools. Same slow-participation rules as Reddit.

**Other communities worth a look** [G] — Indie Hackers, Lobsters, DEV.to,
Hashnode, Mastodon, UK property Facebook groups, Scrabble club sites,
conveyancing forums, r/privacy and PrivacyTools (genuinely on-message for the
no-upload angle, and underrated).

## 2C. Long shots — cheap, low probability, listed for completeness

- **Wikipedia external links** [G] — enormously valuable, near-impossible
  legitimately. Editors remove commercial links on sight and adding your own is
  a conflict of interest. **Do not try directly.** Only arrives via being cited
  elsewhere first. Treat as a lagging indicator.
- **Being a journalist's source** [G] — requires being ready *before* the news.
  See 1.4.
- **Pub quiz / crossword newsletters** [G] — loyal readers, indexed archives.
- **Sponsor a Scrabble club** [G] — £50–100 for a link and a targeted audience.
- **Local press** [G] — "local company builds free tool" is a real story angle
  for a slow news week.
- **Podcast appearances, newsletter sponsorship, guest posts** [P] — all
  standard, all require a hook you do not yet have.
- **Pinterest** [G] — genuinely works for calculators and infographics, oddly.
- **LinkedIn** [G] — plausible for the B2B finance angle, if you would use it.
- **A daily word game as a toy** [G] — toys spread in ways utilities never do.
  High variance, high ceiling, and the dictionary is already there.

## 2D. Absurd — as requested, ordered by descending sanity

- **QR codes on cards in estate agent windows.** A stamp duty calculator is
  exactly what someone standing outside an estate agent wants. Nobody is there.
- **Laminated reference cards posted to mortgage brokers.** Brokers do keep
  reference cards.
- **Answer every "merge PDF without uploading" question ever asked.** Old
  threads still rank and still get traffic. Tedious; occasionally exactly right.
- **Wikipedia edit-a-thons for word-game articles** — not to link yourself, but
  to become known to the editors who write about word games. Absurdly indirect,
  non-zero.
- **A Raspberry Pi running the calculator in a shop window.**
- **Radio phone-in about stamp duty changes.**

## 2E. Do not do — and why

| | Grade | Why |
|---|---|---|
| **Buying links** | [X] | Direct breach of Google's spam policies. Risk is a manual action removing you from search entirely. |
| **PBNs, link exchanges, "50 free backlinks" services** | [X] | Same category. Note that these sites rank well *for that search term* — which is not evidence they work for you. |
| **Mass directory submission** | [X] | Useful in 2010. Now a footprint of a spam site. |
| **Programmatic long-tail pages** ("words starting with AA", ×3,000) | [X] | Exactly what the scaled-content-abuse policy targets. You already deferred this; keep deferring. |
| **AI-written blog posts at volume** | [X] | Same policy. The site already carries formulaic supporting prose across 35 tools — more increases the pattern, not the value. |
| **Reddit link-dropping** | [X] | Fastest route to a domain-level spam flag. |
| **Fake reviews / sockpuppets** | [X] | Detectable, and the downside is total. |
| **Buying an expired domain to redirect** | [X] | Works, is a known spam signal, has been devalued for years, and risks poisoning your domain permanently. |
| **Native app in the App Store** | [X] | Apple explicitly rejects repackaged websites. AdSense does not run in native apps — you would need AdMob, a separate integration. And nobody searches an app store for "stamp duty calculator". PWA instead. |
| **`llms.txt` as a ranking tactic** | [X-ish] | Heavily promoted, **no evidence it produces citations** — analysis across 515 million LLM bot events found no measurable effect as of May 2026. Costs ten minutes so add one if you like, but anyone selling it as a ranking factor is selling something. |

---

# PART 3 — Risks the plan itself creates

**Stale rates become a distributed liability.** The sharpest observation from
the review exchange. Once your stamp duty calculator sits on fifty broker
sites, a wrong rate in April produces wrong figures in fifty places at once,
under fifty different brands, and none of those firms can fix it. This changes
the annual tax-data review from housekeeping to an obligation.

Mitigations: unversioned embed URLs (so one push corrects everyone), a visible
"rates as at" date inside the frame, and a short `/embed-terms` page hosts
agree to.

**Framing worth keeping.** Treat the verification date as a competitive
advantage rather than a legal shield. Purplebricks does not tell you when their
figures were last checked; neither do the banks. Yours are tested against HMRC
and Revenue Scotland worked examples and dated. For a broker choosing whose
calculator to embed, that is the reason to pick yours. Keep it light on the
page — a dated line under the result, not a wall of legal text — and put the
real terms on `/embed-terms`.

**Support burden.** Embeds generate email when they break. Budget for it.

**Open-sourcing is a one-way door.** The code becomes copyable. For a free
ad-funded tool site the moat was never the code — it is the domain and the
traffic — but decide deliberately rather than by drift.

---

# PART 4 — Measurement

Set up before starting, or you will never know what worked.

- **Search Console + Bing Webmaster Tools** — impressions move before clicks.
  Rising impressions is the first real signal.
- **Referrer traffic** — so a Reddit or HN spike is attributable.
- **Brand searches for "gazza"** — the leading indicator for both rankings and
  AI citations, per §0.
- **Which sites embed you** — check Search Console's links report monthly.
- **A monthly manual check** of whether ChatGPT or Perplexity mention you for
  "calculate stamp duty UK" or "merge PDF without uploading". Crude, but it is
  the only feedback loop available for AI visibility.

**Give anything eight weeks before judging it.** All of this is slower than it
feels like it should be.

---

## Sources

- Search engine market share 2026 — <https://www.digitalapplied.com/blog/search-engine-market-share-2026-global-data>
- llms.txt evidence review — <https://livegodigital.com/the-great-llms-txt-confusion-of-2026/>
- How AI engines source information — <https://www.leapd.ai/blog/ai-visibility/how-chatgpt-google-ai-overviews-and-perplexity-source-information-in-2026>
- Google on word count and thin content — <https://www.seroundtable.com/google-word-count-34092.html>
- ICO, business-to-business marketing — <https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/>
- WordPress detailed plugin guidelines — <https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/>
