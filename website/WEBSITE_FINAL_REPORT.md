# Website final report: netsluice.loopout.tech

Stand: 2026-11-26 · NetSluice 0.1.28 (`7b4f597`) · nothing published, nothing committed.

## How it was built

A lead agent and three specialised agents (Claude Opus 5.5, medium effort),
with file ownership defined in `WORKPLAN.md`:

1. **Frontend & design** — design system, layouts, components, all pages, hero, gallery.
2. **Content** — every text in English and German, docs, FAQ, legal pages, content audit.
3. **Infra & security** — GitHub release loader, live demo, CSP and Caddy, CI, deploy scripts.

The lead wrote the architecture audit, set the stack, integrated the work,
retook the screenshots, reviewed security and tested in the browser.

## Status

| Area | Status | Notes |
|---|---|---|
| Architecture audit and plans (`WEBSITE_*_PLAN.md`, audit) | **COMPLETED** | |
| Stack: Astro 7 static, TypeScript strictest, plain CSS tokens, zod | **COMPLETED** | reasons in `WEBSITE_ARCHITECTURE_AUDIT.md` §6 |
| Design system and visual identity | **COMPLETED** | loopout.tech typography (Instrument Serif, Geist, Geist Mono, numbered labels, light lines) + the product's colour semantics + the three references (globe hero, dashboard depth, docs layout). The existing logo was kept. |
| Pages, both languages (34 routes + language choice + 404, 68 HTML pages) | **COMPLETED** | Home, Features, How it works, Hardware, Getting started, Docs (17 articles), Downloads, Changelog, FAQ (23), Demo, Security, Privacy, About, Contributing, License (+ disclaimer), Support |
| German and English, `/de/` and `/en/`, no auto-redirect | **COMPLETED** | `/` offers both, highlights the browser language without redirecting |
| Live demo of the real interface ("live views", no login) | **COMPLETED** | the device's own `web/` code with an in-browser port of `demo.py`; banner "Demo · invented data" on every screen; never contacts a device |
| Screenshots | **COMPLETED** | retaken from 0.1.28 per language (the README ones still show the removed "Tunnel" tab) |
| Download center from GitHub Releases | **COMPLETED** | newest version and newest image shown separately; SHA-256 read from the `.sha256` file and checked against the file name; "no signatures, only checksums"; cache fallback and plain link if GitHub fails |
| Changelog / release history | **COMPLETED** | 29 releases, notes rendered safely, each linked to GitHub |
| Donation link on every page | **COMPLETED** | header pill, support block, footer → `https://www.paypal.me/HenryMeinekat`; plain link, no PayPal script, no payment on the site |
| SEO | **COMPLETED** | titles, descriptions, canonical, hreflang, Open Graph + Twitter card (1200×630), JSON-LD `SoftwareApplication`, sitemap, robots.txt |
| Accessibility | **COMPLETED** | skip link, focus ring, ≥44 px targets, native `<details>`/`<dialog>`, reduced motion, measured contrast ≥4.5:1 |
| Security | **COMPLETED** | see `WEBSITE_SECURITY_REVIEW.md` |
| CI (`.github/workflows/website.yml`) | **COMPLETED** | check, test, build, security check, audit; no deploy job |
| Deploy and rollback scripts, Caddy block, pull timer | **COMPLETED**, not run | refuse to run without `--yes` |
| DNS, Caddy on the VPS, first deploy | **REQUIRES MY APPROVAL** / **BLOCKED — REQUIRES ACCESS** | `WEBSITE_DEPLOYMENT_GUIDE.md`, `WEBSITE_RELEASE_CHECKLIST.md` |
| Manual tests in Safari, Firefox, Edge, real phones | **NOT IMPLEMENTED** | only Chromium (desktop 1440 px, phone 375 px) in this session |
| Tests for page components | **NOT IMPLEMENTED** | unit tests cover the release loader and the notes renderer |

## Measured

| | |
|---|---|
| `astro check` | 0 errors |
| `vitest` | 40/40 |
| `check:security` | 0 failures (120 files) |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Lighthouse mobile `/de/` | Performance 98 · Accessibility 100 · Best Practices 100 · SEO 100 |
| FCP / LCP / CLS / TBT | 1.7 s / 2.0 s / 0 / 100 ms |
| JavaScript | ~13 kB own code (hero 7.7 kB, home page only) |

## Where things are

```
website/
  src/config/site.ts        links, donation, contact (change them here only)
  src/lib/releases.ts        GitHub release loader, safe notes renderer
  src/data/copy/             page texts (en.ts, de.ts)
  src/content/               docs, faq, pages (Markdown, en + de)
  src/components/, layouts/  design and pages; src/styles/ tokens
  scripts/sync-demo.mjs      builds the live demo from ../web
  scripts/check-security.mjs scans dist/ after every build
  deploy/                    Caddy block, deploy/rollback, server pull timer
```

Run it locally:

```bash
cd website && npm ci && npm run build && npx astro preview
```

## Decisions taken by the lead

- **Hero buttons** use the brief's set (Explore features · Get NetSluice ·
  Read the docs). The demo is reachable from the nav and a dedicated home section.
- **Release data at build time**, refreshed by CI on every release and daily,
  so visitors never contact GitHub.
- **The website demo reports the real version (0.1.28) as up to date.** `demo.py`
  says "0.1.7 → 0.1.8"; on a public site next to 0.1.28 that would mislead.

## Findings about the product (not changed)

From the content audit (`WEBSITE_CONTENT_AUDIT.md`):

1. **Privacy, important:** the README says lookups stay on the device. The code
   also sends stopped names to Quad9 `9.9.9.10` for the map, asks Google's name
   server `216.239.32.10` for the public address (start, ~every 6 h), and the
   daily GitHub check sends `NetSluice/<version>` as User-Agent. The website
   says all three; the README does not yet.
2. Devices are sorted by stopped requests, not by activity (README alt text and
   loopout.tech say "activity").
3. A light theme exists since 0.1.18, but `development.md` still lists it as wanted.
4. The dtb restore path differs between `docs/hardware.md` and `rootfs/dcm-dtb-restore`.

## Open questions for the owner

1. Update the README privacy section (finding 1)?
2. Is there a way to reset a forgotten interface password? The site only says there is no reset by e-mail.
3. Security reports: keep `hallo@loopout.tech`, or enable GitHub private vulnerability reporting / add a `SECURITY.md`?
4. Which filter lists and which upstream resolver are active by default? Not stated on the site.
5. dtb restore path: `/boot/dtb/rockchip/…` or `/boot/dtb-<version>/…`?
6. Name IONOS as host on the privacy page?
7. The device at `https://192.168.1.254/` could not be opened from this session (self-signed certificate); the demo was used instead. Nothing was needed from it.
