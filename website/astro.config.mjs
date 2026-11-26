// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// A static site: every page is built ahead of time and served as plain files.
// Release data is read from GitHub at build time (src/lib/releases.ts) and the
// site is rebuilt on a timer, so visitors never talk to the GitHub API.
export default defineConfig({
  site: 'https://netsluice.loopout.tech',
  output: 'static',
  trailingSlash: 'always',
  // The CSP allows no inline script or style: everything goes to external files,
  // and code blocks get classes (Prism) instead of Shiki's style attributes.
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  markdown: { syntaxHighlight: 'prism' },
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', de: 'de' } },
    }),
  ],
  prefetch: false,
  devToolbar: { enabled: false },
});
