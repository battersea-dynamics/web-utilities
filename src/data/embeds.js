// Everything about the embeddable widgets, in one place.
//
// Two rules worth not breaking:
//
// 1. EMBED URLS ARE NOT VERSIONED. One URL per tool, forever, serving current
//    rates. That is the entire structural advantage of an iframe over a copied
//    script: when a Budget changes stamp duty, you update taxData.js, push, and
//    every site running the embed is correct within minutes. Versioning would
//    freeze each host on whatever they pasted and you could never fix them.
//
// 2. THE ATTRIBUTION LINK LIVES IN THE HOST'S PAGE, NOT THE IFRAME. Content
//    inside an iframe is credited to the source domain, so a link in there does
//    nothing for us. The link that matters is the one in the snippet, sitting
//    in the host's own HTML. If someone "simplifies" the snippet by dropping
//    that line, the whole exercise becomes decorative.

import { publishedTools } from './site.js';

export const SITE = 'https://gazza.ltd';

/** Tools we offer as embeds, in the order they appear on /embed. */
export const embeddableTools = publishedTools.filter((t) => t.embeddable);

export const isEmbeddable = (slug) => embeddableTools.some((t) => t.slug === slug);

/**
 * The snippet a host pastes into their page.
 *
 * Deliberately plain HTML with inline styles: WordPress, Squarespace and Wix
 * all strip <style> blocks and often strip <script> too, but every one of them
 * allows an iframe with inline styles in a custom-HTML block. A cleverer
 * snippet would work in fewer places.
 */
export function embedSnippet(tool) {
  const height = tool.embedHeight ?? 700;
  return `<iframe
  src="${SITE}/embed/${tool.slug}"
  title="${tool.title}"
  width="100%"
  height="${height}"
  loading="lazy"
  style="border:1px solid #dfe4e3;border-radius:4px;max-width:680px"
></iframe>
<p style="font:14px/1.5 system-ui,sans-serif;color:#5a6468;margin:.5rem 0 0">
  <a href="${SITE}/${tool.slug}">${tool.title}</a> by
  <a href="${SITE}">gazza.ltd</a>
</p>`;
}
