# Website architecture audit

Stand: 2026-11-26 · Repository `Anarki-LNX/netsluice` at `7b4f597` (VERSION 0.1.28)

This file records what exists before the public website was built, and the
decisions that follow from it. It is written by the lead agent. Content facts
are double-checked in `WEBSITE_CONTENT_PLAN.md`.

## 1. What the repository is

| Part | What it is | Relevant for the website |
|---|---|---|
| `web/` | The device's own interface. Plain HTML, CSS, JS modules. No framework, no build step. Canvas drawings in `sluice.js`, `scene.js`, `worldmap.js`. DE + EN texts in `app.js`. | Visual language (colours, logo, sluice metaphor), real screenshots, and the code itself can run as a clearly marked demo. |
| `service/` | `netsluiced.py` (stdlib-only Python service: sign-in, map, device recognition, schedules, LEDs, messages, updates), `netsluice-root.py` (root helper with a short command list), `netsluice-install.sh` (card → eMMC). | Source of truth for feature claims. Not touched. |
| `provision/`, `rootfs/`, `scripts/build-image.sh`, `scripts/fetch-bundle.py` | Building the system and the ready-made image. | Source of truth for "build it yourself". Not touched. |
| `scripts/demo.py` | Serves `web/` with invented data on `127.0.0.1:8099`. | Basis for the public "live demo". |
| `scripts/release.sh` | Tags and uploads release assets via `gh`. | Defines which assets exist. |
| `docs/` | `hardware.md`, `development.md`, `logo.svg`, five screenshots (1440 px, demo data). | Reused in the documentation section and gallery. |
| `tests/` | Shell smoke tests for the service. No interface tests. | — |
| `LICENSE`, `THIRD-PARTY.md` | MIT. AdGuard Home GPL-3.0, Caddy Apache-2.0, DB-IP CC BY 4.0, world-atlas ISC, iso-codes, Feather MIT. | License page. |

There was **no public website** in the repository. Nothing existing had to be
replaced. The website lives in its own folder `website/` and does not import
anything from `service/`, `provision/` or `rootfs/` at runtime.

## 2. What is implemented, by the project's own account

From `README.md` ("Status: early, tested on one device"):

- **Works:** ready-made microSD image, boot from microSD, backup of the internal
  storage, installation to it and putting the backup back (from the interface),
  both Ethernet ports at 1 Gbit/s, LEDs, button, every feature in "What it does".
- **Not built yet:** inline ("sluice") mode, listening mode, changing the fixed
  address from the interface.
- **Not working:** USB-C as a data port (it still powers the device).
- **Untested:** other board revisions. Pico, Nano, Air are different hardware.
- **Idea only:** WireGuard tunnel. Not planned yet. The interface shows a
  "Tunnel" tab in some screenshots; the website must not present the tunnel as a
  feature.

Tested hardware: exactly one Deeper Connect Mini, board marking
`mini_v21_20210521` (RK3328, 2 GB RAM, 8 GB eMMC).

## 3. Releases (GitHub API, checked 2026-11-26)

29 releases, `v0.1.0` … `v0.1.28`, all published on 2026-11-20/21.
**Only three carry a card image:** `v0.1.28`, `v0.1.5`, `v0.1.4`
(`netsluice-<v>-deeper-connect-mini.img.xz`, ~428 MB, plus `.img.xz.sha256`).
Most others carry only `netsluice-<v>.tar.gz` (the update archive a device
downloads). `v0.1.0`–`v0.1.2` have no assets.

Consequences for the download center:

- "Newest version" and "newest image" are two different things and must be shown
  as such. Today they happen to be the same release (0.1.28). The README says
  so explicitly: small releases reach a device as an update.
- There are **SHA-256 files, no signatures**. The site must not claim signing.
- Devices update themselves from these releases (newest by version number,
  pre-releases included, `VERSION` inside must match the tag).

## 4. Existing visual identity

- Logo: a rounded square gate in gold `#F5C451`, a blue stroke in (`#4EA8FF`,
  traffic arriving), a gold bar (the gate), a green stroke out (`#5CE39A`,
  passed). Red `#FF5A5A` = stopped. Ground `#06141B`, panel `#0A222C`.
- Interface fonts: Bricolage Grotesque (display), Figtree (body).
- loopout.tech project page: Instrument Serif headlines, Geist body, mono
  labels, thin vertical light lines, near-black ground, green accent.
- The user's references: glowing wireframe globe hero (Nexus), dense dark
  dashboard with glowing data (Sparrow), dark docs layout with sidebar and card
  grid (Parseable).

The website keeps the product's colour semantics (blue = arriving, gold = the
gate, green = passed, red = stopped) so that the site and the device feel like
one product, and borrows the editorial typography of loopout.tech.

## 5. Hosting found

- `loopout.tech` → `85.215.241.66` (IONOS VPS), served by **Caddy** in Docker,
  configured in the repository `Anarki-LNX/wetter-crinitz`
  (`server/caddy/Caddyfile`), with HSTS, nosniff, Referrer-Policy,
  Permissions-Policy, COOP already set as a snippet `(sicherheit)`.
- `netsluice.loopout.tech` has **no DNS record yet**.
- The device at `https://192.168.1.254/` uses a self-signed certificate; it
  could not be opened from this session and was not needed: `scripts/demo.py`
  shows the same interface with invented data.

## 6. Decisions

| Decision | Why |
|---|---|
| **Astro 7, static output** | The site is content: product pages and documentation in two languages. Astro ships zero JavaScript by default and adds it only where an island needs it (demo, gallery, copy buttons). Next.js would need a Node server or a static export that loses most of its value. Static files fit the existing Caddy and are the smallest attack surface. |
| **TypeScript strictest, plain CSS with tokens, no Tailwind** | The product interface itself is hand-written CSS with custom properties. Reusing that approach keeps the design tokens identical and avoids a utility layer for a site of this size. |
| **Release data at build time, rebuilt on a timer** | Visitors never call the GitHub API: no rate limit per visitor, GitHub never sees visitor addresses, no token in the browser. The build validates the answer with zod and keeps the last good answer on disk, so a GitHub outage degrades to "data from <time>" or to a plain link to the releases page. |
| **Paths `/en/…` and `/de/…`, no automatic redirect** | `/` is a small language choice page with `hreflang` links. The visitor can always switch. |
| **Self-hosted fonts (`@fontsource`)** | No request to Google Fonts. |
| **Live demo = the real interface with invented data, client-side** | The user asked for live views. The device's own `web/` code is copied at build time and its API calls are answered in the browser by a port of `scripts/demo.py`. Labelled "Demo · invented data" everywhere. It never contacts a real device. |
| **No forms, no accounts, no cookies, no analytics** | Nothing to store, nothing to protect. Contact = GitHub issues and the public address of LOOP OUT TECH. |
| **Donations = one plain PayPal.me link** | Requested by the owner. No payment function, no PayPal script. Shown in the header, footer and a support block on every page. |

## 7. Hard boundaries

- The site never contacts `netsluice.local`, private address ranges or a
  visitor's devices. The CSP's `connect-src 'self'` enforces this.
- No part of the device's API is proxied or exposed.
- Firmware, service and the device interface stay unchanged. The website only
  **reads** `web/` and `docs/screenshots/` at build time.
