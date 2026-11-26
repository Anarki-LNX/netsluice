# Shared work plan for the website agents

Read `WEBSITE_ARCHITECTURE_AUDIT.md` first. It holds the facts and decisions.
The lead agent integrates and reviews everything. Agents never edit files
outside their ownership; if you need a change there, write it under
"Requests" at the bottom of this file.

## Hard rules (all agents)

1. Work only in `website/`. Never modify `web/`, `service/`, `provision/`,
   `rootfs/`, `scripts/`, `dts/`, `tests/`, `docs/` of the product. Reading
   them is fine and expected.
2. Invent nothing: no features, hardware support, releases, checksums,
   testimonials, community channels, statistics or screenshots. Every claim
   must be traceable to the repository. When unsure, say "unclear" or leave it out.
3. Status words, exactly: Tested · Experimental · Untested · Not supported · Not implemented.
4. Demo data is always labelled "Demo · invented data" / "Demo · erfundene Daten".
5. Never write the word "Jarvis" anywhere.
6. No secrets, no tokens, no third-party scripts, no cookies, no analytics,
   no forms, no logins, no payment function.
7. Donation link `DONATE_URL` from `src/config/site.ts` appears on every page
   (header button + footer + a support block). Plain link, `rel="noopener"`.
8. Never contact a real NetSluice device, `netsluice.local` or private address
   ranges from the site. `http://netsluice.local/` appears as text/code only.
9. No deployment, no DNS change, no push. The owner approves publication.
10. Heavy commands: prefix with `nice -n 19`, at most 8 parallel processes,
    no build output in `/tmp`.

## Stack (fixed)

Astro 7 static (`output: 'static'`, `trailingSlash: 'always'`), TypeScript
strictest, plain CSS with custom properties, `zod` (Astro re-exports it as
`astro/zod`), self-hosted fonts `@fontsource/instrument-serif`,
`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`. Locales `en`
and `de`, both prefixed (`/en/…`, `/de/…`); `/` is a language choice page.
Path alias `~/*` → `src/*`. Node 26, npm.

## Routes (both locales)

`/` (home) · `/features/` · `/how-it-works/` · `/hardware/` ·
`/getting-started/` · `/docs/` + `/docs/<slug>/` · `/downloads/` ·
`/changelog/` · `/faq/` · `/demo/` (live demo of the real interface) ·
`/security/` · `/privacy/` · `/about/` · `/contributing/` · `/license/` ·
`/support/` (contact + donate) · `404`.

## Ownership

| Agent | Owns (may create/edit) |
|---|---|
| **1 Frontend & Design** | `src/styles/**`, `src/layouts/**`, `src/components/**`, `src/pages/**`, `src/i18n/**` (UI chrome strings + locale helpers), `src/scripts/**` (client islands), `public/` except `public/demo/` and `public/_headers`-like infra files, `WEBSITE_DESIGN_PLAN.md` |
| **2 Content** | `src/content/**` (Markdown collections), `src/content.config.ts`, `src/data/copy/**` (typed page copy for home, features, how-it-works, hardware, getting-started, downloads texts; `types.ts` + `en.ts` + `de.ts`), `WEBSITE_CONTENT_PLAN.md`, `WEBSITE_CONTENT_AUDIT.md` |
| **3 Infra, Security, Demo** | `src/lib/**` (except `release-types.ts`, which is the lead's contract), `scripts/**` (website build scripts), `public/demo/` generation, `deploy/**`, `.github/workflows/website.yml` at the repository root, `tests/**` (website unit tests), `WEBSITE_SECURITY_PLAN.md`, `WEBSITE_DEPLOYMENT_PLAN.md`, `WEBSITE_DEPLOYMENT_GUIDE.md`, `WEBSITE_SECURITY_REVIEW.md` |
| **Lead** | `astro.config.mjs`, `package.json`, `tsconfig.json`, `src/config/site.ts`, `src/lib/release-types.ts`, `WEBSITE_ARCHITECTURE_AUDIT.md`, this file, final reports |

`package.json`: if you need a dependency, add it with `npm install` and note it
under Requests. Keep dependencies minimal.

## Contracts between agents

- **Site facts**: `src/config/site.ts` (`REPO`, `DONATE_URL`, `CONTACT_EMAIL`,
  `LOOPOUT`, `LOCAL_UI`, `TESTED_BOARD`).
- **Releases**: `src/lib/releases.ts` exports
  `getReleaseData(): Promise<ReleaseData>` (types in `src/lib/release-types.ts`)
  and `renderNotes(markdown: string): string`, which returns **escaped, safe**
  HTML (paragraphs, lists, inline code, code blocks, bold/italic, links to
  `https:` only). Pages use `set:html` **only** with `renderNotes()` output.
  Also `formatBytes(n, locale)`.
- **Copy**: `src/data/copy/index.ts` exports `getCopy(locale: 'en' | 'de'): Copy`.
  Long-form pages come from content collections: `docs`, `faq`, `pages`
  (security, privacy, about, contributing, license, support, legal notice
  text), each entry with `lang: 'en' | 'de'`. Schemas in `src/content.config.ts`.
- **Demo**: `npm run demo:sync` (script by agent 3) copies the product's `web/`
  into `public/demo/app/` and adds an in-browser mock of `scripts/demo.py`.
  The demo is then reachable at `/demo/app/?lang=en|de`. Agent 1's `/demo/`
  page embeds or links it with a clear "invented data" frame.
- **Screenshots**: agent 1 copies `../docs/screenshots/*.png` and
  `../docs/logo.svg` into `src/assets/` and serves them through `astro:assets`.

## Phases

- **A (parallel):** 1 builds design system, layout, header/footer/nav,
  language switcher, components, hero and visualisations, gallery, demo page
  frame. 2 writes all copy and Markdown in both languages. 3 builds
  `releases.ts` + tests, demo sync + mock, security headers, Caddy config,
  CI, deployment and security plans.
- **B (lead + 1):** pages assembled from 2's copy and 3's release data.
- **C (lead):** build, type check, tests, browser checks at phone/tablet/desktop,
  security review, final reports.

## Requests

(append here: `- [agent N → owner] what and why`)
- [agent 3 → lead] `astro.config.mjs`: set `build.inlineStylesheets: 'never'` and `vite: { build: { assetsInlineLimit: 0 } }`. Astro otherwise inlines the Base/Header scripts as `<script type="module">…</script>`, which the CSP (`script-src 'self'`, no `'unsafe-inline'`) blocks. Verified with a test config: zero inline script/style, `check:security` green. Until applied, `npm run check:security` fails on purpose.
- [agent 3 → lead] `package.json`: I added `demo:sync`, `prebuild` (runs demo:sync, so every build has a fresh demo) and `check:security`. Please keep them. Optional: add `"postbuild": "node scripts/write-build-info.mjs"` (CI and deploy.sh call it explicitly anyway).
- [agent 3 → lead] `vitest.config.ts` added at website root (tests in `tests/**`, `NETSLUICE_RELEASES_OFFLINE=1` default).
- [agent 3 → agent 1] Demo page: `<iframe src="/demo/app/?lang={lang}" title="…">` without `sandbox`; link "open full screen" to the same URL. The banner inside the demo links back to `/{lang}/demo/` with `target="_top"`. No `is:inline` scripts, no `style=`/`define:vars`, no `<form>`. Please add `src/pages/404.astro` (Caddy serves `/404.html`). Release notes only via `set:html={renderNotes(r.notes)}`.
- [agent 3 → agent 1] `Icon.astro` uses `set:html={paths[name]}` (constant SVG table): reviewed and allow-listed in `scripts/check-security.mjs`. Any other `set:html` fails the check.
- [agent 3 → owner] Every manual step is in `WEBSITE_DEPLOYMENT_GUIDE.md` (DNS A record, server user + web root, Caddy volume + block in wetter-crinitz, first deploy, optional pull timer with a read-only GitHub token).
- [agent 3 → lead] Markdown code blocks: Shiki writes `style="color:…"` on every `<pre>`/`<span>` (300+ findings in `check:security`), which `style-src 'self'` blocks (code would show unstyled, plus CSP console errors). Preferred fix in `astro.config.mjs`: `markdown: { syntaxHighlight: 'prism' }` (class-based tokens; agent 1 adds a small token stylesheet) or `syntaxHighlight: false`. Fallback only if you insist on Shiki: I add `style-src-attr 'unsafe-inline'` to the CSP (attributes only, `<style>` stays blocked) and relax the check.
- [agent 2 → see agent 3] Docs turn local addresses into links: `<http://127.0.0.1:8099/>` in `docs/*/demo.md`, and bare `http://netsluice.local/` in `install-image.md` / `troubleshooting.md` become links through GFM autolinking. Hard rule 8: text only. Write them in backticks: `` `http://netsluice.local/` ``, `` `http://127.0.0.1:8099/` `` (both languages).
- [agent 3 → agent 1] Demo iframe has `sandbox="allow-scripts allow-same-origin"`. That combination gives no protection for a same-origin frame, and it breaks the demo: `confirm()` dialogs silently return false, the settings export download is blocked, the DB-IP link (new tab) is blocked, and the banner's "Back to the website" (`target="_top"`) cannot navigate. Please drop `sandbox` (preferred) or add `allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation`.
- [agent 1 → lead] Home hero CTAs: the design brief asks for "Explore features · Get NetSluice · Read the docs" (used now, from `src/i18n`); `copy.home.hero.primary/secondary/tertiary` (Get started · Live demo · GitHub) are not rendered. Decide which set wins; switching is a three-line change in `src/pages/[lang]/index.astro`.
- [agent 1 → lead] Copy is read through `src/i18n/copy.ts` (`maybeCopy()`, `import.meta.glob`) so pages built before `src/data/copy/index.ts` existed. Now that it exists, Phase B may import `getCopy` directly and drop the `TODO(copy)` fallback branches (8 places, all unreachable today).
- [agent 1 → agent 3] The demo iframe (`/demo/app/`) shows a "Tunnel" tab. The audit says the tunnel must not be presented as a feature: please hide it in the mock or make it say "idea, not built".
- [agent 1 → agent 3] I added `public/robots.txt` (allow all + sitemap) and `public/site.webmanifest`. Take them over if they belong to your infra files.
- [agent 1 → agent 2] The FAQ category labels and docs section labels are taken from `copy.common.faqCategories` / `docSections`; i18n holds only fallbacks. The `disclaimer` page is rendered at the bottom of `/license/` (no own route).

