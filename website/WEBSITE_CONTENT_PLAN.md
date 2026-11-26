# Website content plan

Stand: 2026-11-26 · Product repository at `7b4f597` (VERSION 0.1.28) · Agent 2 (content)

Every claim is traced in `WEBSITE_CONTENT_AUDIT.md`. If code and README disagree,
the code wins and the audit says so.

## 1. Where content lives

| What | Where | Shape |
|---|---|---|
| Structured page copy (home, features, how it works, hardware, getting started, downloads, changelog, demo, donate, page meta, status/section/category labels, screenshot alt texts) | `src/data/copy/{types,en,de,index}.ts` | `getCopy(locale): Copy` |
| Documentation | `src/content/docs/{en,de}/<slug>.md` | collection `docs` |
| FAQ, one file per question | `src/content/faq/{en,de}/<slug>.md` | collection `faq` |
| Long-form pages | `src/content/pages/{en,de}/{security,privacy,about,contributing,license,support,disclaimer}.md` | collection `pages` |
| Schemas and helpers | `src/content.config.ts` | `LANGS`, `DOC_SECTIONS`, `FAQ_CATEGORIES`, `PAGE_SLUGS`, `entrySlug(id)` |

Entry ids are `<lang>/<slug>`; both languages share the slug. Filter by `data.lang`,
get the slug with `entrySlug(entry.id)`.

### Collections

- **docs**: `title`, `description` (≤200), `lang`, `section` (`start | install | use | hardware | develop`), `order` (10s Start, 20s Install, 30s Use, 40s Hardware, 50s Develop), `updated?`.
- **faq**: `question`, `lang`, `category` (`basics | install | use | updates | security | project`), `order`; body = answer.
- **pages**: `title`, `description`, `lang`, `updated`.

Section and category labels per language: `copy.common.docSections`, `copy.common.faqCategories`.

### Copy type outline

`common` (statusLabels, docSections, faqCategories, screenshots alt+caption, demoLabel, localUiNote, trademark, disclaimerShort, updated(), sourceLink) ·
`meta` (title/description per RouteKey) ·
`home` (hero, tenSeconds, sluice, howItWorks, highlights → feature ids, privacy, status rows, openSource) ·
`features` (items: Feature[] with id/title/summary/details/caveat?/screenshot?/doc?; limits rows; demo CTA) ·
`howItWorks` (lookup steps, boot, firstStart, parts + diagram, dataFlows table, updates, homeOnly) ·
`hardware` (specs, measured, compatibility, functions, limitations, boot, differences, probe, serial, report) ·
`gettingStarted` (prerequisites, 10 steps, LED table, warnings, after, buildYourself, help) ·
`downloads` (latestVersion/latestImage texts, sameRelease()/differentRelease(), labels, verify per OS, source.live()/cache()/none) ·
`changelog`, `demo`, `donate`, `faq`, `docs`.

CTAs use `LinkTarget`: `{ route: RouteKey }`, `{ doc: slug, hash? }` or `{ external: ExternalKey }`;
external keys map to `REPO.*` / `DONATE_URL` in `src/config/site.ts`.

## 2. Information architecture

| Route | Content source |
|---|---|
| `/` home | `copy.home`, highlights from `copy.features.items`, donate block `copy.donate` |
| `/features/` | `copy.features` (14 features, 5 screenshots, limits table) |
| `/how-it-works/` | `copy.howItWorks` (incl. data-flow table) |
| `/hardware/` | `copy.hardware` |
| `/getting-started/` | `copy.gettingStarted` |
| `/docs/`, `/docs/<slug>/` | collection `docs`, 17 entries per language |
| `/downloads/` | `copy.downloads` + release data |
| `/changelog/` | `copy.changelog` + release data (notes stay English) |
| `/faq/` | collection `faq`, 23 entries per language |
| `/demo/` | `copy.demo` |
| `/security/`, `/privacy/`, `/about/`, `/contributing/`, `/license/`, `/support/` | collection `pages` |
| footer legal | `pages/disclaimer`, `copy.common.trademark`, imprint link `LOOPOUT.imprint` |

Docs, in order: overview, requirements, demo · install-image, releases-and-checksums, backup-and-install, ssh · first-steps, updates, children-and-schedules, notifications, privacy-and-dns, https · hardware, troubleshooting · build-from-source, architecture.

Links inside Markdown are absolute with locale (`/en/docs/updates/`). Local addresses (`http://netsluice.local/`, `127.0.0.1`) are always in backticks, never links.

## 3. Voice and tone

Modelled on loopout.tech/projekte/netsluice and the README.

- Plain, concrete, short sentences. One thought per sentence. No semicolons.
- No hype words, no superlatives, no "revolutionary", no "seamless".
- Say what it does, then its limit, in the same place ("caveat").
- Status words exactly: Tested · Experimental · Untested · Not supported · Not implemented / Getestet · Experimentell · Ungetestet · Nicht unterstützt · Nicht umgesetzt. (Experimental is currently used nowhere: nothing in the repo is called experimental.)
- German in du-form, natural, not translated word by word. No mixing of languages inside a passage; product UI labels are quoted in the reader's language.
- Demo imagery always labelled "Demo · invented data" / "Demo · erfundene Daten".
- Never write the word for the old assistant name; never call the tunnel a feature.
- English spelling: British ("licence" as noun, "colour") as in the README.

## 4. Glossary (from `web/app.js`)

| English | Deutsch | Note |
|---|---|---|
| sluice | Schleuse | the metaphor and the design "Sluice"/"Schleuse" |
| lookup, request | Anfrage | app.js uses "requests"/"Anfragen" |
| stopped | aufgehalten | app.js; loopout.tech uses "gestoppt", the product wins |
| let through, passed | durchgelassen | |
| blocked (headline only) | geblockt | only `ov.blocked`; prefer stopped/aufgehalten |
| filter engine | Filter-Motor | AdGuard Home |
| resolver | Auflöser | |
| Secure DNS | Sicheres DNS | settings tile |
| request log | Anfrageprotokoll | |
| host / name | Adresse / Gegenstelle | app.js uses "Adresse" for host names in DE |
| device page | Geräteseite | |
| World map | Weltkarte | |
| Children and schedules | Kinder und Zeitpläne | |
| extra time | Zusatzzeit | |
| Button and LEDs | Taster und LEDs | |
| Messages to your phone | Meldungen aufs Handy | |
| Appearance | Aussehen | designs Sluice/Glass/Graphite = Schleuse/Glas/Graphit |
| Export and import | Export und Import | |
| Access | Zugang | |
| Back up and install | Sichern und Installieren | |
| backup | Sicherung | |
| internal storage | interner Speicher | eMMC |
| put the backup back | Sicherung zurückspielen | |
| root certificate | Stammzertifikat | |
| fingerprint | Fingerabdruck | |
| sign in / out | anmelden / abmelden | |
| listening mode | Mithören | |
| inline ("sluice") mode | Inline-Betrieb („Schleuse“) | |
| image | Abbild | |
| checksum | Prüfsumme | |
| pre-release | Vorabversion | |
| device tree | Hardware-Beschreibung (Device Tree) | as in `up.held` |
| board marking | Platinenbezeichnung | |

## 5. Page outlines with sources

- **Home**: hero (owner's headline/subline, checked) → 10 seconds → sluice → 4 steps (README 89–112) → highlights → privacy teaser (netsluiced.py, README 182–190) → status table (README 52–64) → open source (development.md 355–385).
- **Features**: README 26–50, web/app.js texts, netsluiced.py, netsluice-root.py. Map caveat from development.md 126.
- **How it works**: README 8–10, 76–85; development.md diagram; rootfs/netsluice-firstboot steps; data flows from netsluiced.py, netsluice-root.py, app.js RESOLVERS.
- **Hardware**: docs/hardware.md, README status table.
- **Getting started**: README 89–125, rootfs/netsluice-firstboot LED states.
- **Downloads**: README 94–97, development.md 432–450, release list via `gh api`, build-image.sh 140–143 (sha256 file).
- **Docs**: see audit, per doc.
- **Security**: netsluiced.py Auth/Handler, Caddyfile in install-stack.sh, netsluice-root.py, rootfs, build-image.sh; reporting advice per lead instruction (no SECURITY.md).
- **Privacy**: website facts per WORKPLAN/architecture audit and the deploy config (no access logs, confirmed by lead); device data flows from code.
- **License**: LICENSE, THIRD-PARTY.md, font package licences in node_modules.
