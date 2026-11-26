// The shape of all page copy outside the Markdown collections.
// en.ts and de.ts implement it; TypeScript makes sure both languages say everything.
// Every fact here is traced in WEBSITE_CONTENT_AUDIT.md.
import type { DocSection, FaqCategory } from '../../content.config';

export type Locale = 'en' | 'de';

/** The five status words of the site. Labels per language live in `common.statusLabels`. */
export type Status = 'tested' | 'experimental' | 'untested' | 'notSupported' | 'notImplemented';

/** The five screenshots in docs/screenshots (all taken from the demo with invented data). */
export type ScreenshotKey = 'overview' | 'devices' | 'filters' | 'map' | 'settings';

/** Pages of this site, without locale prefix. Agent 1 maps them to paths. */
export type RouteKey =
  | 'home'
  | 'features'
  | 'howItWorks'
  | 'hardware'
  | 'gettingStarted'
  | 'docs'
  | 'downloads'
  | 'changelog'
  | 'faq'
  | 'demo'
  | 'security'
  | 'privacy'
  | 'about'
  | 'contributing'
  | 'license'
  | 'support';

/** Outside links. The URLs live in src/config/site.ts (REPO, DONATE_URL). */
export type ExternalKey =
  'repo' | 'issues' | 'newIssue' | 'releases' | 'pulls' | 'donate' | 'hardwareDoc' | 'developmentDoc';

/** Where a call to action points: a page of this site, a doc by slug, or an outside link. */
export type LinkTarget =
  { route: RouteKey; hash?: string } | { doc: string; hash?: string } | { external: ExternalKey };

export interface Cta {
  label: string;
  to: LinkTarget;
}

export interface TitledText {
  title: string;
  text: string;
}

export interface Step {
  title: string;
  text: string;
  /** a shell command or code to show under the text, verbatim */
  code?: string;
}

export interface StatusRow {
  item: string;
  status: Status;
  note: string;
}

export interface KeyValue {
  label: string;
  value: string;
}

export interface PageMeta {
  title: string;
  description: string;
}

export interface Feature {
  /** stable id, also usable as an anchor */
  id:
    | 'filter'
    | 'overview'
    | 'devices'
    | 'map'
    | 'kids'
    | 'dns'
    | 'notify'
    | 'backup'
    | 'updates'
    | 'https'
    | 'leds'
    | 'appearance'
    | 'export'
    | 'languages';
  title: string;
  summary: string;
  details: string[];
  /** a limit the reader must know, shown next to the feature */
  caveat?: string;
  screenshot?: ScreenshotKey;
  /** slug of the doc that explains it */
  doc?: string;
}

export interface DataFlow {
  what: string;
  to: string;
  when: string;
}

export interface Copy {
  locale: Locale;

  common: {
    productName: string;
    /** "Demo · invented data", required next to every demo view and screenshot */
    demoLabel: string;
    statusLabels: Record<Status, string>;
    docSections: Record<DocSection, string>;
    faqCategories: Record<FaqCategory, string>;
    screenshots: Record<ScreenshotKey, { alt: string; caption: string }>;
    /** said wherever http://netsluice.local/ appears */
    localUiNote: string;
    trademark: string;
    disclaimerShort: string;
    /** "Updated 26 November 2026" etc. The date comes formatted. */
    updated: (date: string) => string;
    /** for the docs and pages that exist only in English upstream */
    sourceLink: string;
  };

  meta: Record<RouteKey, PageMeta>;

  home: {
    hero: {
      eyebrow: string;
      headline: string;
      subline: string;
      primary: Cta;
      secondary: Cta;
      tertiary: Cta;
      note: string;
    };
    tenSeconds: { title: string; items: KeyValue[] };
    sluice: TitledText;
    howItWorks: { title: string; intro: string; steps: Step[]; more: Cta };
    highlights: { title: string; intro: string; features: Feature['id'][]; more: Cta };
    privacy: { title: string; text: string; more: Cta };
    status: { title: string; intro: string; rows: StatusRow[]; note: string; more: Cta };
    openSource: { title: string; text: string; points: string[]; repo: Cta; contribute: Cta };
  };

  features: {
    title: string;
    intro: string;
    items: Feature[];
    limits: { title: string; intro: string; rows: StatusRow[] };
    demo: Cta;
  };

  howItWorks: {
    title: string;
    intro: string;
    lookup: { title: string; steps: Step[] };
    boot: { title: string; text: string; points: string[] };
    firstStart: { title: string; intro: string; steps: Step[] };
    parts: { title: string; intro: string; items: TitledText[]; diagramCaption: string; diagram: string };
    dataFlows: {
      title: string;
      intro: string;
      columns: { what: string; to: string; when: string };
      rows: DataFlow[];
      note: string;
    };
    updates: { title: string; steps: Step[] };
    homeOnly: TitledText;
  };

  hardware: {
    title: string;
    intro: string;
    specs: { title: string; columns: { part: string; value: string }; rows: KeyValue[] };
    measured: { title: string; note: string; rows: KeyValue[] };
    compatibility: {
      title: string;
      intro: string;
      columns: { item: string; status: string; note: string };
      rows: StatusRow[];
    };
    functions: { title: string; rows: StatusRow[] };
    limitations: { title: string; intro: string; rows: StatusRow[] };
    boot: { title: string; text: string; code: string };
    differences: { title: string; intro: string; items: TitledText[] };
    probe: { title: string; text: string; command: string; expectedIntro: string; expected: string; warning: string };
    serial: TitledText;
    report: { title: string; text: string; cta: Cta };
  };

  gettingStarted: {
    title: string;
    intro: string;
    prerequisites: { title: string; items: string[] };
    steps: { title: string; items: Step[] };
    leds: { title: string; columns: { led: string; meaning: string }; rows: KeyValue[]; normal: string };
    warnings: { title: string; items: TitledText[] };
    after: { title: string; items: string[] };
    buildYourself: { title: string; text: string; cta: Cta };
    help: { title: string; text: string; cta: Cta };
  };

  downloads: {
    title: string;
    intro: string;
    latestVersion: TitledText;
    latestImage: TitledText;
    /** newest version and newest image are the same release */
    sameRelease: (version: string) => string;
    /** the newest image is older than the newest version */
    differentRelease: (imageVersion: string, latestVersion: string) => string;
    noImage: string;
    updateOnly: string;
    labels: {
      image: string;
      checksumFile: string;
      updateArchive: string;
      sha256: string;
      size: string;
      published: string;
      prerelease: string;
      releaseNotes: string;
      allReleases: string;
      olderImages: string;
      download: string;
    };
    verify: {
      title: string;
      intro: string;
      platforms: { os: string; command: string; note: string }[];
      noSignature: string;
    };
    source: {
      live: (date: string) => string;
      cache: (date: string) => string;
      none: string;
    };
  };

  changelog: {
    title: string;
    intro: string;
    notesLanguage: string;
    imageBadge: string;
    prereleaseBadge: string;
    noFiles: string;
    empty: string;
  };

  demo: {
    title: string;
    intro: string;
    points: string[];
    open: string;
    local: { title: string; text: string; command: string };
  };

  donate: {
    title: string;
    text: string;
    button: string;
    points: string[];
    note: string;
  };

  faq: { title: string; intro: string };
  docs: { title: string; intro: string };
}
