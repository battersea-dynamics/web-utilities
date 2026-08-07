import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { sitemapFilter } from './src/data/sitemapFilter.js';

export default defineConfig({
  site: 'https://gazza.ltd',
  integrations: [react(), sitemap({ filter: sitemapFilter })],
  build: { inlineStylesheets: 'auto' },
});
