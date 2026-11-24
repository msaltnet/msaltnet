import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://msalt.net',
  base: '/',
  trailingSlash: 'always',
  outDir: './_site',
  publicDir: './public',
  build: { format: 'directory' },
});
