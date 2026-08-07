import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gazza.ltd',
  integrations: [
    react(),
    sitemap({
      // The /embed/* pages are noindex — they are iframed copies of the tool
      // pages and must never compete with them in search. Listing a noindex
      // page in the sitemap sends contradictory signals, so they're excluded.
      // The /embed landing page itself DOES belong in the sitemap: it targets
      // real searches like "add mortgage calculator to website".
      filter: (page) => !/\/embed\/[^/]+\/?$/.test(page),
    }),
  ],
  build: { inlineStylesheets: 'auto' },
});
