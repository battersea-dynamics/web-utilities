# AdSense & SEO reference notes

Working notes for when we optimise the pages. Source: the YouTube video that prompted this project, **fact-checked against independent sources** rather than taken at face value. Nothing here has been implemented yet.

Bear in mind the video is a sponsored piece (Hostinger Horizons) with affiliate links (Clearer, and a referral-commission scheme for templates). That doesn't make it worthless, but the tool recommendations are paid placements and the timelines are marketing.

---

## 1. What checks out

**The business model is real.** Single-purpose utility pages monetised with display ads, evergreen traffic, build-once-run-indefinitely. This holds up and is the premise of the project plan.

**RPM of $3–12 for AdSense.** Independently confirmed. Note the tiering above AdSense: Ezoic $8–20, Mediavine $15–40+ (needs 50k sessions/30 days), Raptive $18–50+ (needs ~100k pageviews). So the plan's "move to a higher-paying network at scale" is the correct sequence.

**You get paid for impressions, not just clicks.** Correct — display revenue is largely impression-based.

**RPM varies enormously by niche.** Finance & insurance is cited at $25–50+ RPM, education $15–30, entertainment/news often under $2. This directly supports leading with Money & Property tools over word games for revenue, even though word games have the better traffic moat. Worth holding both in mind — they optimise for different things.

**Geography matters as much as topic.** Traffic outside US/UK/CA/AU typically earns 50–80% lower RPM. UK-focused tools are fine here.

**Q4 RPMs run 40–80% above Q1.** Seasonal — don't judge early performance from a January number.

**You need more than a bare tool before AdSense will approve you.** The video was honest about this, and it checks out. See section 3.

---

## 2. What's exaggerated or wrong

**The $500k/month figure is two estimates multiplied together.** It takes a Similarweb third-party traffic estimate (which can be substantially off for any given site) and multiplies it by an assumed $9 RPM — near the top of the $3–12 range he himself quotes. The real figure is unknowable from outside the business. Treat all the headline numbers in the video (the sleep calculator, the IP checker, Calculator.net) the same way: directionally interesting, not evidence.

**"15 minutes" is to a publishable toy, not a business.** The video itself later concedes you need multiple related tools, legal pages, and in-depth explanatory content before AdSense accepts you — and separately that ranking is "an entire industry in itself." Both true. The 15-minute framing and the 15-minute reality are different things.

**The domain-name advice is wrong and worth actively ignoring.** He says a keyword-matching domain "is what determines whether Google can actually find your site." Exact-match domains have not been a direct ranking factor for years — Google has repeatedly confirmed no inherent boost. EMDs help marginally via click-through rate and naturally keyword-rich anchor text, nothing more.

This matters for us: `gazza.ltd` is a neutral brandable umbrella, which the project plan already identified as the correct choice for a multi-topic site. The video's logic would say that's a mistake. It isn't. People will land on `/mortgage-calculator`, not the homepage.

**"Publish five sites in a day" ignores the actual bottleneck.** The bottleneck is not build time — it's Google trusting a new site, which takes months regardless of how fast you shipped. The project plan's 12–18 month expectation is the realistic one.

---

## 3. AdSense approval — what to have in place before applying

Verified against multiple independent sources. **Caveat: Google does not publish a hard page-count minimum**, so the specific numbers below are the community consensus from SEO publications, not an official threshold. Treat them as a target, not a rule.

- **15–25+ pages of substantive content** is the commonly cited range. Quality over quantity — a handful of genuinely useful pages beats a pile of thin ones.
- **"Low value content" is the single most common rejection reason.** Thin pages are the main risk for a tools site, since a bare widget with no prose reads as thin.
- **Privacy policy and a real About page.** ✅ Both done. Note that a two-sentence About or a copy-pasted placeholder policy is called out as a common failure — ours are substantive.
- **Mobile experience is explicitly assessed.** Worth a proper mobile pass before applying.
- **Clear navigation and professional design.** ✅ Category hubs, breadcrumbs, footer already in place.
- **Decision usually takes 1–3 weeks.**
- Rejections in 2026 are reportedly stricter, with more weight on helpful-content and E-E-A-T signals and anti-AI-spam enforcement.

**Where we currently stand:** 11 published tools, each with intro / how-it-works / worked example / FAQ prose. That's below the 15–25 target on page count but well above the bar on per-page depth. Building out the rest of the finance cluster (Phase 2) would clear both.

---

## 4. Ad placement rules (from Google's own AdSense documentation)

This is the part the video glosses over, and getting it wrong can mean ad serving disabled rather than just lower revenue.

- **Above-the-fold ads are allowed** — but only if enough genuine content is visible without scrolling.
- **You may not push all content below the fold** so that ads are the only thing visible. This is an explicit violation.
- **Ad density above the fold should be reasonable** — one is fine, a wall of them is not.
- **Mobile is where violations usually happen.** A 300×250 placed at the very top of a mobile page has historically been the classic violation, because it pushes content down. Google now permits 300×250 above the fold on mobile, but implementation needs care.
- **Consequence of non-compliance:** ad serving can be disabled on the site, not merely a warning.

**Implication for our layout:** the current `ad-slot` sits directly beneath the tool panel and above the prose. That ordering is good — the tool itself is real content and it's above the ad. The thing to verify at optimisation time is the **mobile** rendering: that the tool is still meaningfully visible above the ad on a small screen, and that the reserved `min-height: 90px` doesn't cause layout shift.

Also worth copying from the reference sites the project plan cites: 1–2 plain display units per page, no sticky units, no pop-ups.

---

## 5. The keyword-research idea (worth keeping, tool choice optional)

Strip out the affiliate tool and the underlying heuristic is sound:

> If the first page of Google for a query contains **new, low-authority sites**, established sites aren't fully answering that query — so there's a gap a new site can fill.

This is a reasonable proxy for "rankable," and more informative than raw keyword difficulty scores alone. It's a heuristic, not a guarantee — a new site ranking might also mean the query is low-value, seasonal, or that Google is still testing results.

The method, tool-agnostic:

1. Start with a broad seed ("calculator", "generator", "converter")
2. Filter to low-difficulty keywords
3. Keep the ones a web app could actually answer
4. Manually check the first page of Google for those queries — are new/low-authority sites ranking?

Any keyword tool does steps 1–3; step 4 can be done by hand. No need for the specific paid tool he recommends.

---

## 6. Open question this raises for us

The video's own example (WordUnscrambler.me) and the project plan disagree on one point worth deciding deliberately later: **one domain with many tools, or separate exact-match domains per tool.**

The plan chose one domain — authority compounds, one thing to manage. That's the right call for now. But the highest-traffic reference sites in this space are single-purpose exact-match domains, and Ramesh Jha's portfolio uses separate cross-linked sites. Revisit only if a specific tool here starts showing real traction and it becomes worth giving it its own home.

---

*Sources: Google AdSense Help (required content, above-the-fold policy), plus independent 2026 RPM benchmark and AdSense approval guides. Numbers from SEO publications rather than Google itself are flagged as such above.*
