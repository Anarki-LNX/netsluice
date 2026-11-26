// Five screenshots of the real device interface (NetSluice 0.1.28), taken from the
// website's own demo with invented data, one set per language, 1440 px wide.
// Retake them with: chromium --headless=new --window-size=1440,960
//   --virtual-time-budget=4000 --screenshot=… 'http://localhost:4322/demo/app/?lang=en#devices'
import overviewEn from '~/assets/screenshots/en/overview.png';
import mapEn from '~/assets/screenshots/en/map.png';
import devicesEn from '~/assets/screenshots/en/devices.png';
import filtersEn from '~/assets/screenshots/en/filters.png';
import settingsEn from '~/assets/screenshots/en/settings.png';
import overviewDe from '~/assets/screenshots/de/overview.png';
import mapDe from '~/assets/screenshots/de/map.png';
import devicesDe from '~/assets/screenshots/de/devices.png';
import filtersDe from '~/assets/screenshots/de/filters.png';
import settingsDe from '~/assets/screenshots/de/settings.png';
import type { ImageMetadata } from 'astro';
import type { Locale } from '~/i18n';

export type ShotKey = 'overview' | 'map' | 'devices' | 'filters' | 'settings';

export interface Shot {
  key: ShotKey;
  src: Record<Locale, ImageMetadata>;
  alt: Record<Locale, string>;
  caption: Record<Locale, string>;
}

export const shots: Shot[] = [
  {
    key: 'overview',
    src: { en: overviewEn, de: overviewDe },
    alt: {
      en: 'Overview screen: requests arrive, are checked in the sluice, and pass or are stopped. Counters for the last 24 hours, most active devices, names stopped most recently and most often.',
      de: 'Übersicht: Anfragen kommen an, werden in der Schleuse geprüft und ziehen weiter oder werden gestoppt. Zähler der letzten 24 Stunden, aktivste Geräte, zuletzt und am häufigsten gestoppte Namen.',
    },
    caption: { en: 'Overview', de: 'Übersicht' },
  },
  {
    key: 'map',
    src: { en: mapEn, de: mapDe },
    alt: {
      en: 'World map of where the network talks to, coloured by traffic and by how much was stopped.',
      de: 'Weltkarte, wohin das Netzwerk spricht, eingefärbt nach Verkehr und nach dem Anteil gestoppter Anfragen.',
    },
    caption: { en: 'World map', de: 'Weltkarte' },
  },
  {
    key: 'devices',
    src: { en: devicesEn, de: devicesDe },
    alt: {
      en: 'Devices, the one stopped most often first, with name, maker, kind and, where known, model and firmware.',
      de: 'Geräte, das am häufigsten aufgehaltene zuerst, mit Name, Hersteller, Art und, wo bekannt, Modell und Firmware.',
    },
    caption: { en: 'Devices', de: 'Geräte' },
  },
  {
    key: 'filters',
    src: { en: filtersEn, de: filtersDe },
    alt: {
      en: 'Filter lists, each with its own switch.',
      de: 'Filterlisten, jede mit eigenem Schalter.',
    },
    caption: { en: 'Filters', de: 'Filter' },
  },
  {
    key: 'settings',
    src: { en: settingsEn, de: settingsDe },
    alt: {
      en: 'Settings of the NetSluice interface.',
      de: 'Einstellungen der NetSluice-Oberfläche.',
    },
    caption: { en: 'Settings', de: 'Einstellungen' },
  },
];

export const shot = (key: ShotKey): Shot => shots.find((s) => s.key === key) ?? shots[0]!;
