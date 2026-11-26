# Website security plan

Stand: 2026-11-26 · Scope: `netsluice.loopout.tech` (folder `website/`) · Author: agent 3 (infra, security, demo)

## 1. What the site is, and what it is not

- **Static files only.** Astro builds HTML, CSS, JS, fonts and images ahead of time. The server
  (Caddy on the IONOS VPS) only reads files from `/opt/netsluice-web/current`. No application
  server, no database, no PHP, no Node process, no API.
- **No NetSluice device, admin port or home-network service is exposed.** The Caddy block has no
  `reverse_proxy`; nothing on the server can reach a device. The live demo is the device's
  interface copied as files, with every API call answered *inside the browser* by
  `demo-mock.js`. The CSP (`connect-src 'self'`) stops any page from contacting
  `netsluice.local`, `192.168.x.x` or any other host. `check:security` fails the build if a
  private address or `*.local` URL appears in code or in an attribute.
- **Nothing to steal:** no accounts, no forms, no cookies, no analytics, no third-party scripts,
  no fonts or images from other hosts. The only secret in the whole chain is a read-only
  GitHub token used at build time (and one on the server for downloading CI builds), neither
  of which ever reaches the browser.

## 2. Threats and answers

| Threat | Answer |
|---|---|
| XSS through release notes (untrusted Markdown from GitHub) | `renderNotes()` escapes **all** input first, then adds only `p ul ol li h4 h5 pre code strong em a`. Links only for `https:` URLs, rebuilt from a parsed `URL`, with `rel="noopener noreferrer nofollow"`. Tested against `<script>`, `onerror=`, `javascript:`/`data:` links, quote breaking, placeholder forgery, nested tricks (`tests/releases.test.ts`). Pages may use `set:html` only with `renderNotes()` output, JSON-LD, or an entry in the reviewed list in `scripts/check-security.mjs`. |
| XSS in general / injected script | CSP `script-src 'self'`, no inline scripts, no `eval`. `check:security` fails on inline `<script>`/`<style>`, `on*=` attributes, `style=` attributes, `javascript:` URLs. |
| Tampered GitHub API answer / supply of wrong download links | zod validation; asset URLs must start with `https://github.com/Anarki-LNX/netsluice/releases/download/`, release pages with `…/releases/`; drafts and non-semver tags dropped; the checksum is shown only if the `.sha256` file parses and names exactly the image file. Never invented: if GitHub fails, last good cache (`source: 'cache'`) or nothing (`source: 'none'`). |
| Checksum file abuse (huge, redirect elsewhere) | 4 KB cap (header and stream), 10 s timeout, redirect target must be a GitHub host, no token sent. |
| Token leak | `GITHUB_TOKEN` only in the build environment, sent only to `api.github.com`, never logged, never written to cache or `build.json`. `check:security` fails if the token's value or anything token-shaped appears in `dist/`. CI token is `contents: read`. |
| Clickjacking | `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`. Only the site's own `/demo/` page may frame `/demo/app/`. |
| Demo misleads visitors | Fixed banner "Demo · invented data — nothing here is a real network" / German, link back to the site. Actions that would affect a real system (password, wipe log, test message, backup/install/restore/power off, updates, device name, file downloads) answer "Not available in the demo" instead of demo.py's success. Toggles answer but change nothing (demo.py's behaviour). |
| Downgrade / MITM | HTTPS by Caddy (Let's Encrypt), HTTP→HTTPS redirect automatic, HSTS one year, `upgrade-insecure-requests`. |
| Cross-origin leaks | COOP `same-origin`, CORP `same-origin`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| Powerful browser features | `Permissions-Policy` denies camera, microphone, geolocation, sensors, USB/serial/HID, payment, etc.; only `clipboard-write` (copy buttons) and `fullscreen` for the site itself. |
| Server compromise via deploy path | No inbound access for CI. Manual deploy uses the owner's SSH key; the automatic path is *pull*: the VPS downloads a CI artifact with a read-only token, as an unprivileged user `netsluice-web` in a hardened systemd unit (writes only `/opt/netsluice-web`). Artifacts are checked: no symlinks, no `..`, no hidden files, size caps, `build.json` must name the same commit as the run. |
| Broken deploy | Atomic symlink switch; health check through the real URL; automatic switch-back on failure; 5 builds kept for `rollback.sh`. |
| Dependency vulnerabilities | `npm audit --omit=dev --audit-level=high` in CI. Result 2026-11-26: **found 0 vulnerabilities**. Actions pinned to commit SHAs. |
| Privacy of visitors | No access log. Caddy's runtime log (docker logs, 3 × 10 MB) contains certificate events and, only for server errors (5xx), the failing request including the client address. A missing page never makes the error handler fail (tested), so 404s are not logged. |

## 3. HTTP headers (exact)

Set by `deploy/caddy/netsluice.loopout.tech.caddy`, on normal and on error responses
(tested locally with `caddy:2.11-alpine`, read-only, `cap_drop: ALL`, like production):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), autoplay=(), browsing-topics=(), camera=(), clipboard-read=(), clipboard-write=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), hid=(), idle-detection=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), xr-spatial-tracking=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
(no Server header)
```

### HSTS decision

`includeSubDomains` on `netsluice.loopout.tech` covers only `*.netsluice.loopout.tech`, of which
none exist. It does **not** reach `loopout.tech` or its other subdomains (elwa, gym, suna), which
keep their own `max-age=31536000` without it. So it is safe. No `preload`: preloading works only
on the registrable domain and would bind every loopout.tech subdomain; that is the owner's
decision, not this site's.

### CSP: what it required

- **No `'unsafe-inline'` anywhere.** Astro 7 inlines small processed scripts and small stylesheets
  by default (`vite.build.assetsInlineLimit` 4 KB, `build.inlineStylesheets: 'auto'`). Today's
  build has two inline `<script type="module">` blocks on every page (Base layout and Header).
  With `build.inlineStylesheets: 'never'` and `vite.build.assetsInlineLimit: 0` they become
  files under `/_astro/` (verified: zero inline script/style, `check:security` green). This is a
  **request to the lead** (astro.config.mjs). Until it is applied, `check:security` fails on
  purpose.
- JSON-LD (`<script type="application/ld+json">`) is data, not script: CSP does not apply; the
  check makes sure it contains no `</script` or `<!--`.
- `style=` attributes are blocked by `style-src 'self'`; Astro output has none today and the
  check keeps it that way. Setting styles from JS (`el.style.x = …`) is allowed and is what
  the demo uses.
- `img-src data:` stays for small inlined SVG/PNG data URIs.
- **The demo needs no relaxed CSP.** The product's `index.html` had one inline script; the copy
  moves it to `boot.js`. It has no inline handlers or style attributes (sync fails if it ever
  gets some). Canvas drawing, `localStorage`, `confirm()`, `/demo/app/data/*.json`, blob
  download of the settings export: all allowed. Verified in a browser under the exact header:
  no console errors, no CSP reports, no request to `/api`, `/control`, `/auth`, embedding in a
  same-origin iframe works.

## 4. Checks that run on every build (CI)

1. `astro check` (TypeScript strictest)
2. `vitest run` (40 tests: schema, mapping, checksums, rate limit → cache, XSS cases, bytes)
3. `npm run build` (runs `demo:sync` first) + `write-build-info.mjs --require-release-data` on main
4. `npm run check:security` (rules in `scripts/check-security.mjs`, see the file head)
5. `npm audit --omit=dev --audit-level=high`

## 5. Open points

- Lead: apply the two Astro options above, else CSP blocks the header/menu scripts.
- Lead: Markdown code highlighting. Shiki (Astro's default) writes `style="color:…"` on every
  token, which `style-src 'self'` blocks. Use `markdown.syntaxHighlight: 'prism'` (classes) or
  `false`. Only if Shiki must stay: add `style-src-attr 'unsafe-inline'` (style attributes only;
  `<style>` elements and all scripts stay blocked) — a small, documented relaxation.
- Agent 2: local addresses (`http://netsluice.local/`, `http://127.0.0.1:8099/`) must be code
  text, not links (GFM autolinks bare URLs). `check:security` fails on them.
- Agent 1: the demo iframe's `sandbox="allow-scripts allow-same-origin"` protects nothing for a
  same-origin frame and breaks confirm dialogs, downloads, the new-tab link and the banner's
  link back. Drop it or add the missing `allow-*` tokens (see WORKPLAN Requests).
- Agent 1: no `is:inline` scripts, no `style=`/`define:vars`, no `<form>`; embed the demo with
  `<iframe src="/demo/app/?lang=…">` **without** `sandbox` (the demo is first-party; a sandbox
  with `allow-scripts allow-same-origin` would add nothing) and add a `title`. Ship a
  `src/pages/404.astro` so `/404.html` exists (Caddy falls back to a plain text 404 otherwise).
- Owner: CAA record for loopout.tech (`0 issue "letsencrypt.org"`, `0 issuewild ";"`) was already
  recommended in the server README; it also protects this subdomain.
