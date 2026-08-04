# Content plan

Tracks how finished each tool page is, so nothing gets forgotten. The
`contentStatus` field in `src/data/tools.json` is the source of truth; this
file is the readable view of it.

**Last audited:** 4 August 2026 — 26 tools: 24 complete, 0 partial, 2 stubs.

---

## Definition of "complete"

A page counts as complete only when it has **all six**:

1. Working tool above the fold
2. Intro paragraph
3. "How it works" with the actual method or formula
4. Worked example with real numbers
5. 4–6 genuine FAQs (not filler)
6. 3+ related tool links

Note on criterion 6: `ToolPage.astro` only renders related tools that are
**published**. Listing three relateds in `tools.json` isn't enough if one of
them is still a stub — the page renders two links and fails the check. This is
what the three partials below are blocked on.

---

## Complete (24)

Nothing outstanding on these.

### Financial Calculators (6)

| Tool | FAQs | Related |
|---|---|---|
| Mortgage Calculator | 11 | 3 |
| Mortgage Comparison Calculator | 6 | 3 |
| Mortgage Overpayment Calculator | 7 | 3 |
| Stamp Duty Calculator | 6 | 3 |
| Take-Home Pay Calculator | 6 | 3 |
| Compound Interest Calculator | 6 | 3 |

The three mortgage pages were previously blocked at "partial" for want of a
third published sibling. Publishing Stamp Duty resolved all three, exactly as
predicted.

**These six carry a maintenance obligation the other tools don't.** Stamp duty
and take-home pay depend on rates that change with Budgets. Every figure lives
in `src/components/tools/taxData.js` with its official source URL and a
`LAST_VERIFIED` date that is displayed on the pages. When a Budget lands, that
one file is what needs updating — nothing else.

### Text Tools (10)

| Tool | FAQs | Related |
|---|---|---|
| Word Unscrambler | 7 | 3 |
| Anagram Solver | 6 | 3 |
| Words Starting With | 5 | 3 |
| Word Counter | 5 | 3 |
| Case Converter | 5 | 3 |
| Text Diff Checker | 5 | 3 |
| Duplicate Line Remover | 5 | 3 |
| Remove Extra Spaces | 5 | 3 |
| Lorem Ipsum Generator | 5 | 3 |
| Text Reverser | 4 | 3 |

### PDF Tools (8)

| Tool | FAQs | Related |
|---|---|---|
| Merge PDF | 6 | 3 |
| Split PDF | 6 | 3 |
| Delete PDF Pages | 5 | 3 |
| Rotate PDF | 5 | 3 |
| Reorder PDF Pages | 5 | 3 |
| Images to PDF | 6 | 3 |
| Add Page Numbers to PDF | 6 | 3 |
| Watermark PDF | 6 | 3 |

---

## Partial (0)

None outstanding.

---

## Stubs (2)

Entry exists in `tools.json` with `"published": false`. No page, no widget.
Invisible to the site and the sitemap until built.

### Text Tools (2)

| Tool | Why it's worth building |
|---|---|
| Scrabble Word Finder | Needs its own tournament dictionary and letter scoring — the everyday word list is deliberately wrong for it. |
| Words With Friends Cheat | Same engine as above but a different dictionary and different tile values. |

---

## Suggested order

1. **Scrabble Word Finder** and **Words With Friends** — the two remaining stubs. Both need a tournament word list and tile-value table sourced first; they share that work, so build them together.
2. **PDF→images, extract text, page count** — the second PDF batch. Needs PDF.js alongside pdf-lib.
3. **Developer quick wins** — JWT decoder, hash generator, regex tester, QR generator, CSV↔JSON. These would bring the currently empty Developer Tools category to life, and none needs external data.

Deliberately not built: **PDF compress** and **PDF password protect**. pdf-lib
cannot meaningfully do either — no image recompression, no encryption — and a
tool that claims to compress but shaves 2% is worse than no tool at all.

---

## Keeping the tax figures current

The finance tools are the only ones on the site that can silently go wrong
without any code changing. Rates move at Budgets, typically in the spring.

- All figures live in **`src/components/tools/taxData.js`**, each with the official source URL it came from.
- Update `LAST_VERIFIED` in the same file — it is rendered on the pages, so visitors can see how current the numbers are.
- `npm test` checks the engine against worked examples published by HMRC and Revenue Scotland. If a rate changes, those expected values change too, and the tests will tell you which.
- Never edit a rate from memory. Check the source first.

---

## Keeping this current

When a page is finished, update `contentStatus` in `tools.json` and move the
row here. The audit can be re-run at any time — it checks each page for the
intro, how-it-works and example slots, counts the FAQ entries, and counts how
many related links actually resolve to published tools.
