# Content plan

Tracks how finished each tool page is, so nothing gets forgotten. The
`contentStatus` field in `src/data/tools.json` is the source of truth; this
file is the readable view of it.

**Last audited:** 4 August 2026 — 26 tools: 18 complete, 3 partial, 5 stubs.

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

## Complete (18)

Nothing outstanding on these.

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

## Partial (3)

All three are content-complete in every other respect — tool, intro, method,
worked example and FAQs are all done. They render only **2 related links**
because Financial Calculators has just three published tools, so each mortgage
page has only two published siblings to point at.

| Tool | FAQs | Related | Blocked on |
|---|---|---|---|
| Mortgage Calculator | 11 | 2 / 3 | Any second finance tool going live |
| Mortgage Comparison Calculator | 6 | 2 / 3 | Same |
| Mortgage Overpayment Calculator | 7 | 2 / 3 | Same |

**This resolves itself.** Publishing Stamp Duty (already listed as a related on
the main calculator) flips all three to complete with no further work.

---

## Stubs (5)

Entry exists in `tools.json` with `"published": false`. No page, no widget.
Invisible to the site and the sitemap until built.

### Financial Calculators (3)

| Tool | Why it's worth building |
|---|---|
| Stamp Duty Calculator | UK-specific, changes with budgets, high commercial intent. Unblocks the three mortgage partials. |
| Take-Home Pay Calculator | High volume, multi-input, country-specific — hard for Google to answer inline. |
| Compound Interest Calculator | Simple to build, natural sibling to the mortgage cluster. |

### Text Tools (2)

| Tool | Why it's worth building |
|---|---|
| Scrabble Word Finder | Needs its own tournament dictionary and letter scoring — the everyday word list is deliberately wrong for it. |
| Words With Friends Cheat | Same engine as above but a different dictionary and different tile values. |

---

## Suggested order

1. **Stamp Duty Calculator** — clears the three partials as a side effect, and is the strongest remaining finance query.
2. **Scrabble Word Finder** and **Words With Friends** — needs a scoring dictionary sourcing first; they share the work.
3. **Take-Home Pay** and **Compound Interest** — round out the finance cluster.

Beyond the current stubs, the next clusters worth opening are PDF→images and
text extraction (needs PDF.js alongside pdf-lib), then the developer quick wins
— JWT decoder, hash generator, regex tester, QR generator, CSV↔JSON — which
would bring the empty Developer Tools category to life.

---

## Keeping this current

When a page is finished, update `contentStatus` in `tools.json` and move the
row here. The audit can be re-run at any time — it checks each page for the
intro, how-it-works and example slots, counts the FAQ entries, and counts how
many related links actually resolve to published tools.
