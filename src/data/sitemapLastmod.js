// <lastmod> for each sitemap URL: the date the page's source last changed in
// git. Google ignores lastmod values that are obviously fake (e.g. every page
// stamped with the build time), so use real change dates or nothing at all.
//
// Tool pages share layouts and data, so this records the page file's own
// history only. That is a conservative choice and does not overstate freshness.
// If git history is unavailable (e.g. shallow clone without the file), the
// entry is left without lastmod rather than guessed.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/** Map a site URL to the source file that renders it, if one exists. */
export function sourceFor(url) {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
  const candidates = path
    ? [`src/pages/${path}.astro`, `src/pages/${path}/index.astro`]
    : ['src/pages/index.astro'];
  if (path && !path.includes('/')) candidates.push('src/data/categoryContent.js');
  return candidates.find((c) => existsSync(c)) || null;
}

export function gitLastmod(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

export function serializeWithLastmod(item) {
  const file = sourceFor(item.url);
  const lastmod = file && gitLastmod(file);
  return lastmod ? { ...item, lastmod } : item;
}
