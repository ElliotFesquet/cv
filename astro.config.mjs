import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://elliotfesquet.github.io',
  base: '/cv',
  output: 'static',
  trailingSlash: 'always',
});
