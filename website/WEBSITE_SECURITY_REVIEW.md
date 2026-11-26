# Website security review

Stand: 2026-11-26 · reviewed by the lead agent after agents 1–3 finished.
Scope: the public website in `website/` and its deployment files. Not in scope:
the NetSluice device software (unchanged).

## Result

**No critical or high findings.** The site is static files only. It has no
server-side code, no forms, no sessions, no cookies, no accounts, no third-party
scripts and no payment function. Two deployment steps need the owner (DNS,
Caddy) and are not done yet; until then nothing is public.

## Checks run

| Check | Result |
|---|---|
| `npm run check:security` over `dist/` (inline scripts/styles, `on*=` handlers, external origins, `http://` resources, private-range or `netsluice.local` links/fetches, secret-like strings, `set:html` use, `target="_blank"` without `noopener`) | **0 failures, 0 warnings** (120 files) |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `astro check` (TypeScript strictest) | **0 errors** |
| `vitest` (release loader, schema validation, cache fallback, rate limits, checksum parsing, 20 XSS cases for release notes) | **40/40 passed** |
| SHA-256 shown for v0.1.28 vs. the `.sha256` file on GitHub | **identical** (`ffc2b724…f83c420`) |
| Demo under the production CSP (agent 3, Caddy 2.11 container) | no CSP or console errors, **zero requests to `/api`** |
| Lighthouse mobile, `/de/` | Best Practices 100 |

## Findings and how they were handled

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Astro inlined module scripts and small stylesheets; the strict CSP would block them | medium (breakage) | **COMPLETED** — `inlineStylesheets: 'never'`, `assetsInlineLimit: 0` |
| 2 | Shiki writes `style=""` on every code token (~300) | medium (breakage) | **COMPLETED** — Prism (class-based) |
| 3 | GFM turned `http://netsluice.local/` and `127.0.0.1:8099` into links | low (rule: never link into the home network) | **COMPLETED** — written as code text |
| 4 | Demo iframe had `sandbox="allow-scripts allow-same-origin"`: no protection for a same-origin frame, but broke dialogs, downloads and the back link | low | **COMPLETED** — removed |
| 5 | Demo showed "Update to 0.1.8" (demo.py value) next to a real 0.1.28 | content | **COMPLETED** — the website mock reports the real `VERSION` as installed and up to date |
| 6 | Old README screenshots show a "Tunnel" tab that no longer exists | content | **COMPLETED** — new screenshots of 0.1.28 per language, taken from the demo, with the demo banner visible |
| 7 | JSON-LD is the only inline `<script>` (type `application/ld+json`, data, not executed) | info | accepted; not affected by `script-src` |
| 8 | Release notes are untrusted Markdown from GitHub | — | rendered only through `renderNotes()` (escape first, allow-list of tags, `https:` links with `rel="noopener noreferrer nofollow"`) |

## Guarantees (verifiable)

- **No device or home-network access.** CSP `connect-src 'self'`; the demo
  answers all `/api`, `/control`, `/auth` requests in the browser and never
  sends them. `http://netsluice.local/` appears as text only.
- **No visitor data to third parties while browsing.** Fonts are self-hosted.
  GitHub is contacted only by the build, never by a visitor's browser. PayPal
  and GitHub are plain links the visitor chooses to open.
- **No secrets in the build.** `GITHUB_TOKEN` is optional, used only server-side
  at build time, sent only to `api.github.com`, never written to output.
- **Headers** (in `deploy/caddy/netsluice.loopout.tech.caddy`, also on error
  pages): CSP `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests`,
  HSTS 1 year (`includeSubDomains` covers only `*.netsluice.loopout.tech`),
  nosniff, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
  deny-all Permissions-Policy, COOP/CORP `same-origin`, no `Server` header,
  only GET/HEAD.
- **No access log.** Caddy's runtime log keeps certificate events and requests
  that caused a server error.

## Not verified yet

| Item | Status |
|---|---|
| Headers on the real domain (`curl -I https://netsluice.loopout.tech/`) | **BLOCKED — REQUIRES ACCESS** (DNS + Caddy not set up) |
| TLS certificate issuance and renewal | **BLOCKED — REQUIRES ACCESS** |
| Open ports on the VPS unchanged (only 80/443 used by this site) | **BLOCKED — REQUIRES ACCESS** — the site adds no port |
| Safari / Firefox / Edge by hand | **NOT IMPLEMENTED** in this session (Chromium only) |
