# Website content audit

Stand: 2026-11-26 · Repository `Anarki-LNX/netsluice` at `7b4f597` (VERSION 0.1.28) · Agent 2

Every factual claim made in `src/content/**` and `src/data/copy/**`, the file and
line it comes from, and its status:

- **verified**: stated as the source says.
- **adjusted**: the source was imprecise or contradicted by code; the site says what the code does.
- **removed**: a claim from a source that the site does not repeat, and why.

Paths are relative to the repository root. `nd` = `service/netsluiced.py`,
`nr` = `service/netsluice-root.py`, `app` = `web/app.js`, `hw` = `docs/hardware.md`,
`dev` = `docs/development.md`, `fb` = `rootfs/netsluice-firstboot`,
`is` = `provision/install-stack.sh`, `bi` = `scripts/build-image.sh`.

## 1. Discrepancies found

| # | Where | What | How the site handles it |
|---|---|---|---|
| D1 | README 182–190 "Privacy" | Says lookups stay on the device unless messages are on, and that GitHub sees "your address … and nothing else". Code also: sends **stopped names** as plain DNS to Quad9's unfiltered resolver `9.9.9.10` to find their country (nd 47, 166–173, 467–476); asks **Google's name server** `216.239.32.10` for the public address at start and every 6 h (nd 176–186, 409–414); the GitHub request carries `User-Agent: NetSluice/<version>` (nr 296). Lookups that pass go to the upstream resolver, as any DNS filter does. | **adjusted.** Docs privacy-and-dns, how-it-works data-flow table, privacy page and FAQ list every flow, incl. "GitHub sees your address and the installed version". Suggest the README be updated. |
| D2 | README 101–104, fb 8–10, 158 vs nd 700–709, app 48 (`ld.modeSub`) | First boot ends with **green steady** ("ready"). Once the service's LED loop sets its state (every service start), green is a **heartbeat** ("Green blinks while the device runs"). | **adjusted.** Steady green = ready is stated only for the setup; normal use = green blinks. |
| D3 | dev 485–489 "Wanted: … a light theme" | Light variants of all three designs exist since 0.1.18 (release notes, app 57 `lk.themeSub`). | **removed** "light theme" from the Wanted list on the contributing page. |
| D4 | app 57 `lk.themeSub` "Both come in dark and light" | Three designs exist (Sluice, Glass, Graphite). Interface text says "Both". README 40 says three. | Site says three. Product text is stale (not ours to change). |
| D5 | README 34 alt text "Devices sorted by activity" and loopout.tech "Geräte sind nach Aktivität sortiert" | Code/UI: sorted by **stopped requests first** (app 26 `dv.sub`, release 0.1.6/0.1.25). | **adjusted.** Alt text and copy say "the one stopped most often first". |
| D6 | README 60 "changing the fixed address from the interface: not built" vs nr 13–15, 110–151 and nd 33, 1293 | Helper and service already implement `addr-try/confirm/revert` with a 5-minute auto-revert, but the interface does not offer it (app 64 `nw.later`). | Site follows README + UI: **Not implemented** (in the interface). Not presented as a feature. |
| D7 | app 124–129 `pl.*` texts (incl. "an update is ready" as a message) | `PLANNED = []` (app 289): these planned tiles are never shown. No update notification exists in nd (events: newdev, malware, down, test). | **removed.** Site lists only the three real message types plus test. |
| D8 | hw 349–352 path `/boot/dtb/rockchip/…` vs `rootfs/dcm-dtb-restore` `/boot/dtb-*/rockchip/…` | Armbian's `/boot/dtb` is normally a link to `dtb-<version>`; not verifiable from the repo. | Kept as hw.md says. Open question to owner. |
| D9 | README 91 "8 GB or more" vs README 139 "16 GB or more" | Two routes: ready-made image vs build-yourself. Not a contradiction; backup of the 8 GB eMMC needs free space up to its size (nr 587). | Both stated per route; backup space note added from code. |
| D10 | loopout.tech uses "gestoppt", app uses "aufgehalten" | Wording only. | German site follows the product: "aufgehalten". |

## 2. Claims and sources

### Product, status, hardware

| Claim | Source | Status |
|---|---|---|
| Debian instead of AtomOS, filter with own interface | README 5–6 | verified |
| Sluice metaphor sentence | README 8–10 | verified |
| Not affiliated / trademark sentence | README 12–14 | verified |
| Tested on one Mini, board `mini_v21_20210521`, runs its owner's home network | README 54–55 | verified |
| Works / not built / not working / untested table | README 57–64 | verified (USB-C "Not working" shown as status "Not supported" with note "does not work") |
| Pico, Nano, Air are different hardware | README 62 | verified → "Not supported" |
| WireGuard tunnel only an idea, not planned; needs reachable device | README 66–74, dev 487–489 | verified |
| Mini is relative of NanoPi R2S, RK3328; AtomOS on Armbian; bootloader looks at card first; no soldering; remove card → original | README 78–82, hw 229–241 | verified |
| Three device-tree differences (card 1.8 V, PHY address 3, PHY clock) | hw 246–309 | verified (summarised) |
| Spec table, measured values, U-Boot 2020.07, boot_targets, vendor kernel 5.9.11, LUKS | hw 204–244 | verified |
| Loopback test 5000 pings × 1400 bytes | hw 300–304 | verified |
| Probe command, steps, expected lines, serial/MAC warning | hw 311–338 | verified |
| Serial console instructions | hw 340–344 | verified |
| dtb recovery copy | hw 349–352 | verified (see D8) |
| Debian 13 "trixie" Armbian community image | THIRD-PARTY.md 21–23 | verified |

### Install and first start

| Claim | Source | Status |
|---|---|---|
| Card 8 GB+, cable, any computer | README 91–92 | verified |
| Image/asset names, not every release has an image | README 94–97, `gh api …/releases` (images only in v0.1.28, v0.1.5, v0.1.4) | verified |
| balenaEtcher / Raspberry Pi Imager "Use custom", take .xz as is | README 98–99 | verified |
| LEDs during setup: green blink / green steady / red steady, retry every minute, status page at same address, no internet needed | README 100–106, fb 6–12, 38, 158, netsluice-firstboot.service 15–16 | verified |
| Setup log `/var/lib/netsluice-setup/setup.log`, survives power cut | fb 11, 36 | verified |
| `http://netsluice.local/` or router address; first visitor chooses password | README 108–110, nd 1258–1265 | verified |
| Password ≥ 8 characters | nd 1262, app 132 | verified |
| No reset by e-mail | app 130 `gate.setupSub` | verified |
| Set router DNS; lists download once online, nothing stopped before | README 110–112, rootfs/netsluice-lists | verified |
| Nothing on the device changed; wallet included | README 116–119 | verified |
| SSH off, account locked, key `/boot/netsluice-ssh.pub`, ext4 → Linux, keys only | README 120–123, rootfs/netsluice-sshkey 2–16, bi 98–112 | verified |
| Accepted key types | rootfs/netsluice-sshkey 8 | verified |
| No console auto-login on the image | bi 102–108 | verified |
| `sha256sum -c` | README 125; .sha256 written by bi 143 | verified |
| macOS `shasum -a 256 -c`, Windows `Get-FileHash` | general tool usage for the sha256sum file format (bi 143) | verified (tool behaviour, not repo) |
| Tip: reserve address in router | general advice, marked "Tip" | adjusted (no product claim) |
| Build-yourself: tools, 16 GB, Armbian minimal, commands, dd warning, root password | README 137–162, bi 12–13 | verified |
| `build-image.sh` needs no root; `--netsluice` builds image, SSH off, root locked, needs internet for bundle, .xz + .sha256 | bi 1–13, 75–116, 140–144 | verified |
| Bundle contents, SOURCES.txt, AdGuard Home checked against checksums, Debian packages against index | scripts/fetch-bundle.py 1–16, is 26–39, THIRD-PARTY.md 24–29 | verified |
| install-stack safe to run again | is 4–5, dev 393 | verified |

### Back up and install

| Claim | Source | Status |
|---|---|---|
| Card ~24 MB/s, eMMC ~5× faster (133 MB/s) | README 166, hw 225–226 | verified |
| Three steps, backup to card, download, install erases, restore | README 166–172, app 68–96 | verified |
| Only while running from the card; one job at a time | nr 498–504, 597 | verified |
| Room check, worst case size of storage | nr 587, 599 | verified |
| Download file name `netsluice-backup-internal-storage.img.gz` | nd 1199 | verified |
| Backup stays on the card, not copied | netsluice-install.sh 38, 76 | verified |
| Install needs backup or "Install without a backup"; confirmation | nr 601–606, app 82–85 | verified |
| Filter pauses a few seconds near the end | app 83, netsluice-install.sh 85–89 | verified |
| Switch off, pull card, power again | app 86–87, nr 636–643 | verified |
| Restore: checked first, same size only, read back | nr 609–610, 731–791 | verified |
| Bootloader sectors 64–32767 never written; compared before/after; restore checks bootloader match | nr 509, 760–772, netsluice-install.sh 4–7, 44, 103, dev 472–477 | verified |
| By-hand command | README 174–175 | verified |

### Interface

| Claim | Source | Status |
|---|---|---|
| Live view colours, last 24 h, top devices, recent/most stopped | app 12–23 | verified |
| Top-bar switch pauses 10 min, "Keep it off" | app 11, 572–587 | verified |
| "Live"/"Offline" | app 12, release v0.1.24 | verified |
| Update hint in top bar | app 11 `status.update`, nd 828–839 | verified |
| Lockout 5 tries / 5 min, wait | nd 529–538, app 133, tests/auth-smoke.sh 28–29 | verified |
| Session 30 days, sign-out, password change signs out others | nd 56, 1287, app 116, 122 | verified |
| Device naming (router PTR, mDNS, OUI maker, kind, model, firmware, private MAC) | nd 933–1110 | verified |
| Device page contents | nd 307–375, app 16–20 | verified |
| Same list formats as AdGuard Home and Pi-hole; add by address; update all with progress | app 31–35 | verified |
| List catalog (vendor tracking lists, Encrypted DNS bypass, TIF full ~500 MB) | app 265–280 | verified |
| Map: registered country, CDN note | app 42 | verified |
| Map IPv4 only, one event per A lookup, fewer than overview | dev 478–479, nd 447 | verified |
| Settings tiles and their names | web/index.html 218–313, app texts | verified |
| Appearance: three designs × dark/light, size, accent, animations, per browser | app 57–60, README 40–41 | verified (see D4) |
| Language: switch, ?lang, browser default | app 282–285 | verified |

### Children, messages, privacy, HTTPS, LEDs

| Claim | Source | Status |
|---|---|---|
| Modes on/schedule/off, days, default 15:00–19:00, over-midnight rule | nd 762–776, 1326–1335 | verified |
| Extra time +30 / +1 h, end | app 47, nd 1320–1324 | verified |
| Rule follows MAC; without MAC bound to address | nd 744, app 47 | verified |
| Works by refusing DNS; open page may continue; own DNS bypasses | app 44, dev 480–481 | verified |
| Rules enforced every 20 s and at once on change | nd 914–930, 1339–1342 | verified |
| Encrypted DNS bypass list | app 270 | verified |
| ntfy / webhook JSON `event,title,text`; http(s) URL | nd 648–664, 640, app 54 | verified |
| Events new device (first run only learns), malware ≤ 1/h per device+host, down after a minute and back | nd 1096–1107, 455–462, 914–927, app 55 | verified |
| Messages carry device and host names; ntfy topic guessable | app 52 | verified |
| Notify address stored 0600 | nd 612 | verified |
| Six DoH resolvers with interface descriptions | app 111, 921–927 | verified |
| Resolver tested before switch | app 945–948, 110 | verified |
| DNSSEC | app 110, 955 | verified |
| Log retention 24 h/7/30/90 d, hide device, delete all | app 112–115 | verified |
| Export contents, not password/log, file name, import behaviour; export contains notify address | app 61–62, 1211–1245 | verified |
| HTTPS: tls internal on demand, "Caddy Local Authority", root cert download `netsluice-root.crt`, fingerprint, HTTP stays, no redirect, rollback on failure | nr 822–929, nd 848–864, 1215–1226, app 117–121 | verified |
| Secure cookie over HTTPS | nd 1153–1155 | verified |
| LEDs: green heartbeat, red flash default on, on/night/off | nd 586–587, 671–715, app 48–49 | verified (see D2) |
| Button pauses 10 min, second press back, 3 blinks, can be disabled | nd 718–739, app 50 | verified |

### Updates

| Claim | Source | Status |
|---|---|---|
| Look about once a day (if last look > 20 h, checked hourly, 2 min after start); looking installs nothing | nd 897–911 | verified |
| Automatic install off by default; daily 04:00 + up to 2 h | nr 376–383, release v0.1.1 notes | verified ("early in the morning", app 102) |
| Newest by version number, pre-releases included | nr 324–343, dev 434–436 | verified |
| GitHub only, HTTPS, redirect refused, ≤ 30 MB | nr 256–261, 291–313 | verified |
| Fallback to source archive without percentage | nr 441, dev 443–444 | verified |
| VERSION must match tag; required files; py_compile; safe extraction | nr 447–463 | verified |
| Replaces only web/ and service/; engine untouched; previous kept | nr 246–250, 464–474, dev 437–438 | verified |
| Rollback if no answer within ~40 s | nr 400–411, 477–487 | verified |
| Releases not signed | release v0.1.1 notes "Releases are not signed yet"; no signature assets | verified |
| Debian updates: look, install, nightly unattended security updates (opt-in) | nr 154–243, app 65–67 | verified |
| Kernel held; dtb restored after package installs | rootfs/dcm-firstboot, rootfs/99-dcm-dtb, dcm-dtb-restore, app 67 | verified |
| New image only when below web/ and service/ changed | dev 446–450 | verified |

### Data leaving the device

| Claim | Source | Status |
|---|---|---|
| Passed lookups → chosen resolver | AdGuard Home upstream, app 921–948 | verified |
| Stopped names → Quad9 9.9.9.10 plain DNS, cached 1 h | nd 47, 166–173, 467–476 | verified (D1) |
| Public address → Google name server, start + every 6 h | nd 176–186, 409–414 | verified (D1) |
| Filter lists from maintainers | THIRD-PARTY.md 30–31 | verified |
| GitHub daily look with address + version | nd 897–911, nr 296 | verified (D1) |
| System package sources (Debian, Armbian) | nr 158–243; held Armbian packages in rootfs/dcm-firstboot | verified |
| Clock via Debian time service | fb 112, 125 (systemd-timesyncd) | verified (standard Debian service) |
| Local data stays (log, counters, devices, schedules, settings) | nd state files 49–57, AdGuard Home local query log | verified |
| Not mentioned: AdGuard Home's own outbound behaviour beyond upstream/lists | not in repo | removed (unknown) |

### Security page

| Claim | Source | Status |
|---|---|---|
| scrypt with salt | nd 515–527 | verified |
| Token hashed, 30 days, HttpOnly, SameSite=Strict | nd 540–557, 1155 | verified |
| Caddy forward_auth; /auth/* open; static files open | is 156–191, nr 829–856 | verified |
| Engine on 127.0.0.1:3001 without account; service 127.0.0.1:3002 | is 47–58, nd 46, dev 370–372 | verified |
| DNS on every address, ratelimit lifted | is 49, 59–62, nd 878–894 | verified |
| Service hardening flags | is 121–144 | verified |
| Root helper: allowlist, validation, O_NOFOLLOW, 20 s | nr 9, 932–994 | verified |
| NetSluice cannot make itself reachable from outside | README 72–73 | verified |
| No SECURITY.md | repository listing | verified; contact per lead's instruction (hallo@loopout.tech) |

### Website facts (not from the product repo)

| Claim | Source | Status |
|---|---|---|
| Static, no cookies, no analytics, no forms, no accounts, self-hosted fonts | WORKPLAN.md rules 6, WEBSITE_ARCHITECTURE_AUDIT.md §6 | verified |
| No access logs; only certificate events and server errors logged | lead, confirmed from deploy Caddy config | verified |
| Release data fetched at build time | WEBSITE_ARCHITECTURE_AUDIT.md §6 | verified |
| CSP `connect-src 'self'` | WEBSITE_ARCHITECTURE_AUDIT.md §7 | marked `<!-- verify -->` in security pages |
| Demo stores language/appearance in localStorage | app 284, 835, 1153–1159 | marked `<!-- verify -->` (depends on agent 3's mock) |
| Font licences OFL-1.1 | node_modules/@fontsource*/package.json | verified |
| Operator LOOP OUT TECH, imprint link | src/config/site.ts | verified |
| Donation via PayPal link | src/config/site.ts `DONATE_URL` (hard-coded once in pages/*/support.md) | verified |
| First public version 0.1.0 on 2026-11-20; first image 0.1.4 | GitHub releases API | verified |

## 3. Removed or not repeated

- "an update is ready" as a message (D7).
- "light theme" as wanted (D3).
- Which filter lists are on by default: not set by NetSluice, depends on AdGuard Home defaults → not stated.
- Which resolver is used before the owner picks one: AdGuard Home default, not set in repo → not stated; site says "all six offered use DoH".
- Recovery of a forgotten password: not documented in the repo → site only says "no reset by e-mail".
