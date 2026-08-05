// Derived views over tools.json, so the "what is actually visible" rule lives
// in one place rather than being repeated in every template.
//
// Categories stay in tools.json even when empty — they're filtered out at
// render time, so a category reappears everywhere automatically the moment it
// gains its first published tool.

// The `with { type: 'json' }` attribute is required, not decorative. Since
// package.json declares "type": "module", plain Node treats this file as ESM
// and refuses a bare JSON import without it. Astro's bundler is more lenient,
// so the build would pass while `node --test` failed — remove it and the
// tests break without the site ever noticing.
import data from './tools.json' with { type: 'json' };

export const allCategories = data.categories;
export const allTools = data.tools;

/** Every tool marked published. */
export const publishedTools = data.tools.filter((t) => t.published);

/** Published tools in a given category. */
export const toolsIn = (categorySlug) =>
  publishedTools.filter((t) => t.category === categorySlug);

/**
 * Categories that have at least one published tool. These are the only ones
 * that should appear in the nav, the footer, the homepage grid, or the
 * sitemap — an empty hub page is a dead end for users and for crawlers.
 */
export const visibleCategories = data.categories.filter(
  (c) => publishedTools.some((t) => t.category === c.slug)
);

/** Look up a category by slug, whether or not it's currently visible. */
export const categoryBySlug = (slug) =>
  data.categories.find((c) => c.slug === slug);
