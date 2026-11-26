# Website design plan

Owner: agent 1 (frontend and design). Stand: 2026-11-26.
Implementation: `src/styles/`, `src/layouts/`, `src/components/`, `src/scripts/`, `src/pages/`, `src/i18n/`.

## 1. Concept: "Your Network. Your Rules."

The site is the device's own interface seen from a calm distance. It keeps the
product's four signal colours and their meaning, and frames them in the
editorial calm of the loopout.tech project page: a near-black ground, a serif
headline, small numbered mono labels, thin vertical light lines.

One idea runs through every page: **the sluice**. Something arrives (blue), meets
a gate (gold), and either travels on (green) or is stopped (red). The hero
drawing, the how-it-works diagram, the 404 picture, the step lines and the
release timeline all repeat it in a quiet form.

Not an admin template: no dense tiles, no fake numbers, no neon, no 3D for its
own sake, no stock photos. Light and depth are used where they explain
something (the gate glows, the globe has an atmosphere) and nowhere else.

### How the four references were combined

| Source | Taken | Left out |
|---|---|---|
| loopout.tech project page | Instrument Serif headlines, numbered mono labels (`01 · OPEN SOURCE · …`), numbered lists 01–04, pill buttons with ↗ | its green accent (the site uses the product's semantics instead) |
| Ref. 3 (Nexus globe) | the large dotted/wireframe globe on deep navy as the hero visual, a pill nav rail, a light outlined/filled pill CTA | marketing badges ("trusted by …"), a full-bleed purple glow |
| Ref. 1 (dashboard) | glowing blue/green data points on dark, used only in the canvas and in the real screenshot | charts with invented numbers, orb bubbles, dense panels |
| Ref. 2 (docs) | left sidebar with sections, 3×2 card grid with icon + title + text + arrow links, centered copyable command | search (no JS search index; the sidebar and the docs index cover 17 pages) |
| The product (`web/`) | colours, logo, sluice metaphor, gold focus ring, 44 px targets, `prefers-reduced-motion` respect, the real screenshots | its fonts (Bricolage/Figtree), so the site reads as the project's front door, not a copy of the UI |

## 2. Tokens (`src/styles/tokens.css`)

### Colour

| Token | Value | Use |
|---|---|---|
| `--bg` | `#050F15` | page ground (a shade darker than the device's `#06141B`) |
| `--bg-deep` | `#030A0F` | code blocks, footer, diagram stage |
| `--ground` | `#06141B` | behind real screenshots (the device's own ground) |
| `--panel` / `--panel-2` | `#0A1E27` / `#0E2731` | cards, raised surfaces |
| `--text` / `--soft` / `--muted` / `--faint` | `#EAF6F7` / `#C6E0E4` / `#93B4BC` / `#7898A1` | four text tones |
| `--in` / `--in-ink` | `#4EA8FF` / `#8CC6FF` | **arriving** (also links) |
| `--gate` / `--gate-ink` | `#F5C451` / `#F8D88A` | **the sluice gate** (also focus, donate, numbers) |
| `--ok` / `--ok-ink` | `#5CE39A` / `#9BF0C2` | **passed** (and only "Tested") |
| `--no` / `--no-ink` | `#FF5A5A` / `#FF8F84` | **stopped** |
| `--water` | `#67D8E8` | cyan light for depth; never carries meaning |
| `--violet` | `#B3A6FF` | "Not implemented" only |

`-ink` variants are the text-safe versions of each signal colour.

### Contrast (WCAG 2.2 AA, measured)

| Pair | Ratio | Requirement |
|---|---|---|
| `--text` on `--bg` | 17.5 : 1 | 4.5 |
| `--soft` on `--bg` | 14.0 : 1 | 4.5 |
| `--muted` on `--bg` / `--panel` / `--panel-2` | 8.8 / 7.7 / 7.0 : 1 | 4.5 |
| `--faint` on `--bg` / `--panel-2` | ≈ 6.0 / ≈ 4.8 : 1 | 4.5 (smallest text tone, used ≥ 13 px) |
| `--in-ink` (links) on `--bg` / `--panel` | 10.7 / 9.5 : 1 | 4.5 |
| `--gate-ink` on `--bg` | > 12 : 1 | 4.5 |
| `--ok-ink` on `--bg` | > 13 : 1 | 4.5 |
| `--no-ink` on `--bg` / `--panel-2` | 8.8 / 7.0 : 1 | 4.5 |
| `--violet` on `--bg` | 9.0 : 1 | 4.5 |
| `--on-gate` `#1B1403` on `--gate` (donate button) | 11.2 : 1 | 4.5 |
| `#04170D` on `--ok` (download button) | 11.4 : 1 | 4.5 |
| `--bg` on `--text` (primary pill) | 17.5 : 1 | 4.5 |
| gold focus ring on `--bg` | 11.9 : 1 | 3 (non-text) |

### Type

- Display: **Instrument Serif** 400 (and italic for one accent per title), h1/h2 only.
- Body: **Geist Variable**, 400–620.
- Labels, data, code: **Geist Mono Variable**, uppercase labels with 0.14 em tracking.
- All self-hosted from `@fontsource`, `font-display: swap`; the two first-needed
  files (Instrument Serif latin 400, Geist latin) are preloaded in `Base.astro`.
  Other subsets load only if a page needs them (unicode-range).

Fluid scale (360 → 1440 px): hero 52 → 120 px, h1 44 → 80, h2 34 → 56, h3 20 → 24,
lead 18 → 21, body 17, small 15, label 12, code 14.4. Line height 1.65 body,
1.02–1.15 headings. Measure: prose max 44 rem (≈ 70 characters).

### Space, shape, depth

4 px steps (`--s-1` … `--s-24`), section padding `clamp(72px, …, 144px)`,
container 76 rem + fluid gutter (16 → 40 px). Radii 6 / 10 / 16 / 24 / pill.
Two shadows (`--shadow-1`, `--shadow-2`) and one water glow, used on hover only.

## 3. Components

| Component | Purpose / notes |
|---|---|
| `Header` | logo, pill nav rail (6 items + "More" `<details>`), language link, GitHub, gold **Donate** pill. Below 1080 px a `<details>` mobile menu (numbered list, full-screen panel). |
| `Footer` | brand + tagline, newest version (when passed), donate, four link columns, trademark note, "no cookies" line. |
| `Button` | pill; `primary` (light fill), `secondary` (outline), `ghost`, `donate`; external links get `target=_blank`, `rel="noopener noreferrer"`, ↗ and a hidden "(opens in a new tab)". |
| `SectionHeader` | mono numbered label + serif h2 (+ optional italic accent) + lead. |
| `PageHero` | the h1 block of every inner page. (The vertical light lines were removed at the owner's request, 2026-11-26.) |
| `FeatureCard` | 3×2 grid card: icon tile, number, title, text, arrow links, whole card clickable when it has one target. |
| `StatusBadge` | Tested (green filled dot) · Experimental (gold half dot) · Untested (slate ring, dashed border) · Not supported (red bar) · Not implemented (violet square). Colour **and** shape differ; only Tested is green. |
| `Callout` | info (blue) / warn (gold) / danger (red), icon + title. |
| `CodeBlock` | escaped text, copy button (hidden until JS proves the clipboard works), result announced via `aria-live`; `inline` variant for a single command. |
| `Steps` / `Step` | numbered gold circles joined by a thin gold-to-water line. |
| `Accordion` | native `<details>` (FAQ). |
| `Gallery` + lightbox | `<Picture>` avif/webp, intrinsic width/height, lazy except an optional first; each picture links to its full-size webp (works without JS); with JS a modal `<dialog>` (focus trapped by the browser, Escape, ← →, focus returns to the opener). Every caption says "Demo data". |
| `ScreenshotFrame` | one real screenshot in a quiet browser frame, address bar shows `netsluice.local` as text, badge "Demo · invented data". |
| `DemoFrame` | iframe to `/demo/app/?lang=…` (sandboxed `allow-scripts allow-same-origin`, no referrer) in a gold frame with the demo badge; falls back to the screenshot if `public/demo/app/index.html` is not in the build. |
| `DonateBlock` | warm short text + gold PayPal button, at the bottom of every page. |
| `ReleaseCard` / `DownloadPanel` / `ReleaseHistory` | presentational; take `ReleaseData`/`Release`. Newest image and newest version shown separately; SHA-256 + `sha256sum -c` with copy buttons; notes only through `renderNotes()`. |
| `HardwareTable` | table on wide screens, stacked cards on phones, status as badges. |
| `SluiceDiagram` | inline SVG: devices → DNS :53 → AdGuard Home in the sluice → internet, stopped ends at the gate, dashed "stays on the device" frame. A separate top-to-bottom drawing for phones. `role="img"` with title + desc. |
| `HeroCanvas` | the decorative canvas (below). |
| `DocsLayout` | sidebar (sections, numbered), breadcrumb, h1 + lead, mobile TOC `<details>`, prose, "last updated", "edit on GitHub", prev/next; right-hand TOC with scroll spy at ≥ 1240 px. |

## 4. The hero drawing

`src/scripts/hero.ts`, ~9 kB source, canvas 2D, no library.

- A globe of 820 evenly spread points (Fibonacci sphere), turning slowly, with a
  few faint meridians and parallels and a blue atmosphere: the internet.
- A gold gate in front of it (a line between two posts with a soft curtain).
- Lookups appear as blue points with short tails. At the gate about one in five
  turns red, shivers and bursts into gold-red shards with a ring; the gate
  flashes. The others turn green and arc onto the globe, where a small green
  light stays for three seconds and turns away with it.
- Layout follows the box: wide (desktop overlay behind the headline, flow from
  40 % of the width) or tall (phones: its own block under the text, flow top to
  bottom). Configured from CSS via `--hero-start`, no inline styles.
- `aria-hidden`, no text, nothing that looks like a number.
- Paused when off screen (IntersectionObserver) and in background tabs; device
  pixel ratio capped at 2; at most 60 lookups alive.
- `prefers-reduced-motion: reduce`: one composed still frame (deterministic
  random), also when the preference changes while the page is open.

## 5. Motion rules

- Durations: 140 ms (hover colour), 260 ms (chevrons, borders), 700 ms (reveal).
  One easing: `cubic-bezier(.2,.7,.2,1)`.
- Scroll reveal: 14 px rise + fade, once per element, only for elements below the
  fold at load (no flash), only with JS, never under reduced motion.
- Nothing loops except the hero canvas. No parallax, no scroll-jacking.
- Under reduced motion all CSS durations become 0 and smooth scrolling is off.

## 6. Responsive strategy (designed for the phone, not shrunk)

| Width | Layout |
|---|---|
| < 480 | header: logo, language, heart-only donate, menu. Hero: text first, then the drawing as its own 1:1 block with vertical flow. Status rows and hardware rows become cards. Steps use smaller circles. Diagram switches to its tall SVG. |
| 480–719 | same, donate pill gets its word back, GitHub icon appears. |
| 720–1079 | two-column cards and gallery, docs sidebar still folded (`<details>`), wide diagram. |
| ≥ 1080 | desktop nav rail, hero drawing behind the right half of the hero, three-column cards, sticky docs sidebar. |
| ≥ 1240 | docs on-page TOC column. |

All targets ≥ 44 × 44 px (small pills extend their hit area). No horizontal
scroll at 320 px; tables and code scroll inside their own box.

## 7. Accessibility (WCAG 2.2 AA)

- One `h1` per page, headings in order; landmarks: header, nav (labelled), main, footer.
- Skip link to `#main` (first focusable element, gold pill when focused).
- Focus: 2 px gold outline with 3 px offset on everything, never removed.
- Language: `<html lang>`; the language link carries `hreflang` and `lang`; the
  choice page and 404 mark each language part with `lang`.
- Colour never alone: status badges differ in shape and word; stopped/passed in
  the diagram carry text labels.
- Menus: `<details>`/`<summary>` (native expanded state); Escape closes and returns
  focus; Tab stays inside the open mobile menu; outside click closes.
- Lightbox: native modal `<dialog>`, labelled, Escape, arrow keys, focus returns.
- Copy buttons: real `<button>`, label "Copy to clipboard", result in `aria-live`.
- External links say "(opens in a new tab)" to screen readers.
- Decorative canvas and SVG ornaments are `aria-hidden`; diagrams have `title` + `desc`.
- `forced-colors` mode: borders become system colours.
- Reduced motion as above.

## 8. Performance and security constraints

- Zero JS by default; islands: `nav.ts` (every page, ~1.5 kB), `reveal.ts`,
  `copy.ts`, `lightbox.ts`, `docs.ts`, `hero.ts` (home only), `lang-suggest.ts` (`/` only).
- Images through `astro:assets`: avif + webp, `srcset`, intrinsic sizes (no CLS),
  lazy except the hero screenshot.
- No inline `style=""`, no inline event handlers, no third-party requests. The only
  inline `<script>` is the JSON-LD data block (not executed, not affected by
  `script-src`). `astro.config.mjs` sets `inlineStylesheets: 'never'` and
  `assetsInlineLimit: 0`, so every script and stylesheet is an external file
  (checked in the build output).
- Social image: `public/og/netsluice-og.png` (1200 × 630), rendered once from an
  HTML/canvas composition with the site's own fonts.
