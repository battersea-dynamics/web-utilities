import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { sitemapFilter } from './src/data/sitemapFilter.js';
import { serializeWithLastmod } from './src/data/sitemapLastmod.js';

export default defineConfig({
  site: 'https://gazza.ltd',
  integrations: [react(), sitemap({ filter: sitemapFilter, serialize: serializeWithLastmod })],
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
});
