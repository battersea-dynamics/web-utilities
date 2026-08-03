# gazza-tools

The utilities site behind **gazza.ltd**. Astro (static HTML) with React islands for the interactive widgets.

---

## Step 1 — Install

A working `package.json` is included and this scaffold has been build-tested, so the quick route is:

```bash
cd gazza-tools
npm install
```

Then skip to Step 3.

If you'd rather have Astro generate everything itself, do this instead — in the folder where you keep projects:

```bash
npm create astro@latest gazza-tools
```

Answer the prompts:

| Prompt | Answer |
|---|---|
| How would you like to start? | **Empty** |
| Install dependencies? | **Yes** |
| TypeScript? | **No** |
| Initialise a git repository? | **Yes** |

Then add the two integrations:

```bash
cd gazza-tools
npx astro add react
npx astro add sitemap
```

Say yes to each prompt. This installs React and writes `astro.config.mjs` for you.

## Step 2 — Copy these files in

Copy everything from this folder into your new `gazza-tools` folder, overwriting when asked. That gives you:

```
src/data/tools.json                       the master tool list
src/styles/global.css                     design tokens + all styling
src/layouts/Base.astro                    header, footer, meta tags
src/layouts/ToolPage.astro                the ranking skeleton
src/components/tools/MortgageWidget.jsx   the calculator (React)
src/pages/index.astro                     homepage
src/pages/[category]/index.astro          all hub pages, generated
src/pages/mortgage-calculator.astro       the first tool
public/robots.txt, public/favicon.svg
astro.config.mjs
```

## Step 3 — Run it locally

```bash
npm run dev
```

Open http://localhost:4321 — you should see the homepage, `/finance`, and a working mortgage calculator.

Leave this running while you work. Edits appear instantly in the browser.

## Step 4 — Push to GitHub

Create an empty repo on GitHub called `gazza-tools`, then:

```bash
git add .
git commit -m "Phase 1: scaffold + mortgage calculator"
git remote add origin https://github.com/YOURNAME/gazza-tools.git
git branch -M main
git push -u origin main
```

## Step 5 — Deploy on Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pick the `gazza-tools` repo
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Output directory: `dist`
4. **Save and Deploy**

Every `git push` to `main` now redeploys automatically.

## Step 6 — Point the domain

1. In Cloudflare Pages → your project → **Custom domains** → add `gazza.ltd`
2. Cloudflare gives you nameservers or DNS records
3. In **Spaceship**, open the DNS settings for `gazza.ltd` and enter them

Allow up to a few hours for DNS to propagate.

## Step 7 — Google Search Console

Add `gazza.ltd` as a property, verify it (DNS TXT record via Spaceship is easiest), and submit:

```
https://gazza.ltd/sitemap-index.xml
```

Do this on day one. The clock on ranking starts when Google finds the site.

---

## Adding tool number two

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

That alone puts it on the homepage, the `/finance` hub, the footer and the sitemap.

**2. Write the widget** at `src/components/tools/CompoundWidget.jsx` — plain React, same pattern as the mortgage one.

**3. Create the page** at `src/pages/compound-interest-calculator.astro`, copying the mortgage page and swapping the widget, the FAQ array and the three prose slots.

The filename must match the `slug` exactly. That's what makes the URL.

---

## The rules worth not breaking

- **Tools are flat files** in `src/pages/`. Hubs are folders. Changing this changes your URLs.
- **Every tool needs all seven parts** — H1, tool, intro, how it works, worked example, FAQ, related. The layout enforces the shape; you supply the content. Skipping the prose is the difference between ranking and not.
- **`tools.json` is the source of truth.** Never hard-code a tool name or link in a template.
- Keep `"published": false` on anything unfinished. It stays off the sitemap and out of the nav.

## Commands

```bash
npm run dev       # local preview at :4321
npm run build     # production build into dist/
npm run preview   # serve the built site locally
```
