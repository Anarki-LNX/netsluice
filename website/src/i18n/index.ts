// Locale helpers and the interface ("chrome") strings of the site: navigation,
// footer, buttons, aria labels. Page copy lives in src/data/copy and the content
// collections; nothing here makes a product claim.

export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'de';
}

/** For `getStaticPaths` of every page under `src/pages/[lang]/`. */
export function localeStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

/** Route keys of the site, in nav order. Paths are the same in both languages. */
export const routes = {
  home: '/',
  features: '/features/',
  howItWorks: '/how-it-works/',
  hardware: '/hardware/',
  gettingStarted: '/getting-started/',
  docs: '/docs/',
  downloads: '/downloads/',
  changelog: '/changelog/',
  faq: '/faq/',
  demo: '/demo/',
  security: '/security/',
  privacy: '/privacy/',
  about: '/about/',
  contributing: '/contributing/',
  license: '/license/',
  support: '/support/',
} as const;
export type RouteKey = keyof typeof routes;

/** `/features/` + `de` → `/de/features/`. Accepts paths with or without a locale prefix. */
export function localizePath(path: string, locale: Locale): string {
  const clean = stripLocale(path);
  const withSlash = clean.endsWith('/') || clean.includes('#') || clean.includes('?') ? clean : `${clean}/`;
  return `/${locale}${withSlash === '/' ? '/' : withSlash}`;
}

/** `/de/features/` → `/features/` */
export function stripLocale(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const m = /^\/(en|de)(\/.*)?$/.exec(p);
  if (!m) return p;
  return m[2] && m[2] !== '' ? m[2] : '/';
}

/** The same page in the other language, for the language switcher and hreflang. */
export function alternatePath(pathname: string, target: Locale): string {
  return localizePath(stripLocale(pathname), target);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'de' : 'en';
}

const en = {
  'meta.siteName': 'NetSluice',
  'meta.tagline': 'Your Network. Your Rules.',
  'meta.ogAlt': 'NetSluice: a gold sluice gate between a blue arriving line and a green passing line.',

  'a11y.skip': 'Skip to content',
  'a11y.mainNav': 'Main',
  'a11y.mobileNav': 'Menu',
  'a11y.footerNav': 'Footer',
  'a11y.home': 'NetSluice home',
  'a11y.langSwitch': 'DE: Diese Seite auf Deutsch',
  'a11y.newTab': '(opens in a new tab)',
  'a11y.breadcrumb': 'Breadcrumb',
  'a11y.docsNav': 'Documentation',
  'a11y.toc': 'On this page',
  'a11y.decorative': 'Decorative animation',

  'nav.features': 'Features',
  'nav.howItWorks': 'How it works',
  'nav.hardware': 'Hardware',
  'nav.gettingStarted': 'Getting started',
  'nav.docs': 'Docs',
  'nav.downloads': 'Downloads',
  'nav.changelog': 'Changelog',
  'nav.faq': 'FAQ',
  'nav.demo': 'Demo',
  'nav.security': 'Security',
  'nav.privacy': 'Privacy',
  'nav.about': 'About',
  'nav.contributing': 'Contributing',
  'nav.license': 'License',
  'nav.support': 'Support',
  'nav.more': 'More',
  'nav.menu': 'Menu',
  'nav.close': 'Close menu',
  'nav.github': 'GitHub',
  'nav.githubLabel': 'Source code on GitHub',

  'lang.en': 'English',
  'lang.de': 'Deutsch',
  'lang.short.en': 'EN',
  'lang.short.de': 'DE',
  'lang.choose': 'Choose your language',
  'lang.suggested': 'Suggested for your browser',

  'donate.button': 'Donate',
  'donate.cta': 'Support NetSluice',
  'donate.label': 'Support NetSluice with a donation via PayPal',
  'donate.note': 'via PayPal · opens in a new tab',

  'cta.features': 'Explore features',
  'cta.get': 'Get NetSluice',
  'cta.docs': 'Read the docs',
  'cta.demo': 'Open the demo',
  'cta.github': 'Source code on GitHub',
  'cta.allReleases': 'All releases on GitHub',
  'cta.readMore': 'Read more',

  'demo.badge': 'Demo · invented data',
  'demo.caption': 'Demo data',
  'demo.open': 'Open the demo in its own tab',
  'demo.frameTitle': 'NetSluice interface, demo with invented data',
  'demo.missing': 'The demo is not part of this build yet.',

  'code.copy': 'Copy',
  'code.copied': 'Copied',
  'code.copyLabel': 'Copy to clipboard',
  'code.failed': 'Copy failed: select the text and copy it by hand.',

  'gallery.open': 'Show larger',
  'gallery.close': 'Close',
  'gallery.prev': 'Previous picture',
  'gallery.next': 'Next picture',
  'gallery.of': 'of',
  'gallery.label': 'Screenshots',

  'status.tested': 'Tested',
  'status.experimental': 'Experimental',
  'status.untested': 'Untested',
  'status.notSupported': 'Not supported',
  'status.notImplemented': 'Not implemented',

  'callout.info': 'Note',
  'callout.warn': 'Caution',
  'callout.danger': 'Warning',

  'docs.prev': 'Previous',
  'docs.next': 'Next',
  'docs.toc': 'On this page',
  'docs.sections': 'Sections',
  'docs.edit': 'Edit this page on GitHub',
  'docs.toggle': 'Documentation menu',
  'docs.index': 'Overview',
  'docs.section.start': 'Start',
  'docs.section.install': 'Install',
  'docs.section.use': 'Use',
  'docs.section.hardware': 'Hardware',
  'docs.section.develop': 'Develop',
  'docs.updated': 'Last updated',

  'release.latest': 'Newest version',
  'release.latestImage': 'Newest card image',
  'release.published': 'Published',
  'release.download': 'Download',
  'release.checksum': 'Checksum (SHA-256)',
  'release.checksumFile': 'Checksum file',
  'release.size': 'Size',
  'release.notes': 'Release notes',
  'release.onGitHub': 'Release on GitHub',
  'release.prerelease': 'Pre-release',
  'release.image': 'Card image',
  'release.updateArchive': 'Update archive',
  'release.noImage': 'No card image in this release',
  'release.unavailable': 'Release data is not available right now.',
  'release.stale': 'Release data from',
  'release.history': 'Release history',
  'release.assets': 'Files',
  'release.verify': 'Verify the download',

  'footer.project': 'Project',
  'footer.docs': 'Documentation',
  'footer.legal': 'Legal',
  'footer.imprint': 'Imprint',
  'footer.privacy': 'Privacy',
  'footer.license': 'License (MIT)',
  'footer.thirdParty': 'Third-party licences',
  'footer.issues': 'Report a problem',
  'footer.releases': 'Releases',
  'footer.trademark':
    'NetSluice is not affiliated with, endorsed by, or supported by Deeper Network. “Deeper Connect” is their trademark and is used here only to name the hardware.',
  'footer.madeBy': 'An open-source project by LOOP OUT TECH.',
  'footer.version': 'Newest version',
  'footer.noCookies': 'No cookies, no tracking, no external scripts.',

  '404.title': 'Page not found',
  '404.text': 'This address leads nowhere. The page may have moved, or the link was mistyped.',
  '404.home': 'Back to the start',

  'diagram.title': 'How a lookup travels through NetSluice',
  'diagram.desc':
    'Devices in the home network send their DNS lookups to NetSluice on port 53. Inside the sluice, AdGuard Home checks each one against the block lists. Allowed lookups pass on to the internet; blocked ones stop at the gate. All of this happens on the device.',
  'diagram.devices': 'Your devices',
  'diagram.dns': 'DNS',
  'diagram.engine': 'AdGuard Home',
  'diagram.sluice': 'The sluice',
  'diagram.internet': 'Internet',
  'diagram.passed': 'Passed',
  'diagram.stopped': 'Stopped',
  'diagram.onDevice': 'On the device',
  'table.item': 'Item',
  'table.status': 'Status',
  'table.note': 'Note',

  'common.onThisPage': 'On this page',
  'common.backToTop': 'Back to top',
  'common.todo': 'Text follows.',
} as const;

export type UiKey = keyof typeof en;

const de: Record<UiKey, string> = {
  'meta.siteName': 'NetSluice',
  'meta.tagline': 'Dein Netzwerk. Deine Regeln.',
  'meta.ogAlt':
    'NetSluice: ein goldenes Schleusentor zwischen einer ankommenden blauen und einer weiterziehenden grünen Linie.',

  'a11y.skip': 'Zum Inhalt springen',
  'a11y.mainNav': 'Hauptnavigation',
  'a11y.mobileNav': 'Menü',
  'a11y.footerNav': 'Fußzeile',
  'a11y.home': 'NetSluice Startseite',
  'a11y.langSwitch': 'EN: This page in English',
  'a11y.newTab': '(öffnet in einem neuen Tab)',
  'a11y.breadcrumb': 'Brotkrumen',
  'a11y.docsNav': 'Dokumentation',
  'a11y.toc': 'Auf dieser Seite',
  'a11y.decorative': 'Dekorative Animation',

  'nav.features': 'Funktionen',
  'nav.howItWorks': 'So funktioniert’s',
  'nav.hardware': 'Hardware',
  'nav.gettingStarted': 'Erste Schritte',
  'nav.docs': 'Doku',
  'nav.downloads': 'Downloads',
  'nav.changelog': 'Änderungen',
  'nav.faq': 'FAQ',
  'nav.demo': 'Demo',
  'nav.security': 'Sicherheit',
  'nav.privacy': 'Datenschutz',
  'nav.about': 'Über das Projekt',
  'nav.contributing': 'Mitmachen',
  'nav.license': 'Lizenz',
  'nav.support': 'Unterstützen',
  'nav.more': 'Mehr',
  'nav.menu': 'Menü',
  'nav.close': 'Menü schließen',
  'nav.github': 'GitHub',
  'nav.githubLabel': 'Quelltext auf GitHub',

  'lang.en': 'English',
  'lang.de': 'Deutsch',
  'lang.short.en': 'EN',
  'lang.short.de': 'DE',
  'lang.choose': 'Sprache wählen',
  'lang.suggested': 'Vorschlag für deinen Browser',

  'donate.button': 'Spenden',
  'donate.cta': 'NetSluice unterstützen',
  'donate.label': 'NetSluice mit einer Spende über PayPal unterstützen',
  'donate.note': 'über PayPal · öffnet in einem neuen Tab',

  'cta.features': 'Funktionen ansehen',
  'cta.get': 'NetSluice holen',
  'cta.docs': 'Doku lesen',
  'cta.demo': 'Demo öffnen',
  'cta.github': 'Quelltext auf GitHub',
  'cta.allReleases': 'Alle Versionen auf GitHub',
  'cta.readMore': 'Weiterlesen',

  'demo.badge': 'Demo · erfundene Daten',
  'demo.caption': 'Demo-Daten',
  'demo.open': 'Demo in eigenem Tab öffnen',
  'demo.frameTitle': 'NetSluice-Oberfläche, Demo mit erfundenen Daten',
  'demo.missing': 'Die Demo ist in diesem Build noch nicht enthalten.',

  'code.copy': 'Kopieren',
  'code.copied': 'Kopiert',
  'code.copyLabel': 'In die Zwischenablage kopieren',
  'code.failed': 'Kopieren fehlgeschlagen: Text markieren und von Hand kopieren.',

  'gallery.open': 'Größer anzeigen',
  'gallery.close': 'Schließen',
  'gallery.prev': 'Vorheriges Bild',
  'gallery.next': 'Nächstes Bild',
  'gallery.of': 'von',
  'gallery.label': 'Bildschirmfotos',

  'status.tested': 'Getestet',
  'status.experimental': 'Experimentell',
  'status.untested': 'Ungetestet',
  'status.notSupported': 'Nicht unterstützt',
  'status.notImplemented': 'Nicht umgesetzt',

  'callout.info': 'Hinweis',
  'callout.warn': 'Vorsicht',
  'callout.danger': 'Warnung',

  'docs.prev': 'Zurück',
  'docs.next': 'Weiter',
  'docs.toc': 'Auf dieser Seite',
  'docs.sections': 'Bereiche',
  'docs.edit': 'Diese Seite auf GitHub bearbeiten',
  'docs.toggle': 'Doku-Menü',
  'docs.index': 'Überblick',
  'docs.section.start': 'Start',
  'docs.section.install': 'Installieren',
  'docs.section.use': 'Benutzen',
  'docs.section.hardware': 'Hardware',
  'docs.section.develop': 'Entwickeln',
  'docs.updated': 'Zuletzt aktualisiert',

  'release.latest': 'Neueste Version',
  'release.latestImage': 'Neuestes Kartenabbild',
  'release.published': 'Veröffentlicht',
  'release.download': 'Herunterladen',
  'release.checksum': 'Prüfsumme (SHA-256)',
  'release.checksumFile': 'Prüfsummendatei',
  'release.size': 'Größe',
  'release.notes': 'Versionshinweise',
  'release.onGitHub': 'Version auf GitHub',
  'release.prerelease': 'Vorabversion',
  'release.image': 'Kartenabbild',
  'release.updateArchive': 'Update-Archiv',
  'release.noImage': 'Kein Kartenabbild in dieser Version',
  'release.unavailable': 'Die Versionsdaten sind gerade nicht verfügbar.',
  'release.stale': 'Versionsdaten vom',
  'release.history': 'Versionsverlauf',
  'release.assets': 'Dateien',
  'release.verify': 'Download prüfen',

  'footer.project': 'Projekt',
  'footer.docs': 'Dokumentation',
  'footer.legal': 'Rechtliches',
  'footer.imprint': 'Impressum',
  'footer.privacy': 'Datenschutz',
  'footer.license': 'Lizenz (MIT)',
  'footer.thirdParty': 'Lizenzen Dritter',
  'footer.issues': 'Problem melden',
  'footer.releases': 'Versionen',
  'footer.trademark':
    'NetSluice steht in keiner Verbindung zu Deeper Network und wird von Deeper Network weder empfohlen noch unterstützt. „Deeper Connect“ ist deren Marke und wird hier nur genannt, um die Hardware zu bezeichnen.',
  'footer.madeBy': 'Ein Open-Source-Projekt von LOOP OUT TECH.',
  'footer.version': 'Neueste Version',
  'footer.noCookies': 'Keine Cookies, kein Tracking, keine fremden Skripte.',

  '404.title': 'Seite nicht gefunden',
  '404.text': 'Diese Adresse führt ins Leere. Vielleicht ist die Seite umgezogen, oder der Link hat einen Tippfehler.',
  '404.home': 'Zurück zum Anfang',

  'diagram.title': 'Wie eine Anfrage durch NetSluice läuft',
  'diagram.desc':
    'Die Geräte im Heimnetz schicken ihre DNS-Anfragen an NetSluice auf Port 53. In der Schleuse prüft AdGuard Home jede gegen die Sperrlisten. Erlaubte Anfragen ziehen weiter ins Internet, gesperrte bleiben am Tor stehen. All das geschieht auf dem Gerät.',
  'diagram.devices': 'Deine Geräte',
  'diagram.dns': 'DNS',
  'diagram.engine': 'AdGuard Home',
  'diagram.sluice': 'Die Schleuse',
  'diagram.internet': 'Internet',
  'diagram.passed': 'Durchgelassen',
  'diagram.stopped': 'Gestoppt',
  'diagram.onDevice': 'Auf dem Gerät',
  'table.item': 'Punkt',
  'table.status': 'Status',
  'table.note': 'Hinweis',

  'common.onThisPage': 'Auf dieser Seite',
  'common.backToTop': 'Nach oben',
  'common.todo': 'Text folgt.',
};

export const ui: Record<Locale, Record<UiKey, string>> = { en, de };

/** `const tr = t(locale); tr('nav.docs')` */
export function t(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}

/** Intl date for release dates etc. */
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** Primary nav (header) and the rest ("More"). */
export const primaryNav: RouteKey[] = ['features', 'howItWorks', 'hardware', 'docs', 'downloads', 'demo'];
export const moreNav: RouteKey[] = [
  'gettingStarted',
  'changelog',
  'faq',
  'security',
  'privacy',
  'about',
  'contributing',
  'license',
  'support',
];

export const navKey: Record<RouteKey, UiKey> = {
  home: 'a11y.home',
  features: 'nav.features',
  howItWorks: 'nav.howItWorks',
  hardware: 'nav.hardware',
  gettingStarted: 'nav.gettingStarted',
  docs: 'nav.docs',
  downloads: 'nav.downloads',
  changelog: 'nav.changelog',
  faq: 'nav.faq',
  demo: 'nav.demo',
  security: 'nav.security',
  privacy: 'nav.privacy',
  about: 'nav.about',
  contributing: 'nav.contributing',
  license: 'nav.license',
  support: 'nav.support',
};
