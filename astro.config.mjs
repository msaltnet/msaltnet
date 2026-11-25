import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import appFeed from './src/integrations/app-feed.mjs';
import rehypeResponsiveImages from './src/lib/rehype-responsive-images.mjs';
import rehypeTables from './src/lib/rehype-tables.mjs';
import { remarkKramdownClasses, remarkResponsiveImageInclude } from './src/lib/remark-jekyll-compat.mjs';

const images = JSON.parse(readFileSync(new URL('./_data/images.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: 'https://msalt.net',
  base: '/',
  trailingSlash: 'always',
  outDir: './_site',
  publicDir: './public',
  build: { format: 'directory' },
  integrations: [appFeed()],
  markdown: {
    remarkPlugins: [remarkKramdownClasses, [remarkResponsiveImageInclude, { images }]],
    rehypePlugins: [[rehypeResponsiveImages, { images }], rehypeTables] },
});
