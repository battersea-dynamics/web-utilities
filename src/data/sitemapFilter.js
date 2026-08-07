// Which pages belong in the sitemap.
//
// Lives in its own module so astro.config.mjs and the test suite use the
// *same* function. The test used to extract this from the config source with
// a regex and eval it, which broke the moment a comment containing a comma
// was added — a test failing on punctuation rather than behaviour.

/** Pages that are noindex, internal, or duplicates must not be listed. */
export function sitemapFilter(page) {
  // /embed/<tool> are noindex iframe copies of the tool pages. Listing a
  // noindex page sends contradictory signals. The /embed landing page itself
  // DOES belong — it targets "add mortgage calculator to website".
  if (/\/embed\/[^/]+\/?$/.test(page)) return false;

  // Internal diagnostic, not content.
  if (/\/pwa-check\/?$/.test(page)) return false;

  return true;
}
