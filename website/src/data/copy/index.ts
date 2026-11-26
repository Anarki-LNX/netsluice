// Typed page copy for the structured pages (home, features, how it works,
// hardware, getting started, downloads, changelog, demo, donate).
// Long-form text lives in the content collections (src/content.config.ts).
import type { Copy, Locale } from './types';
import { en } from './en';
import { de } from './de';

export type * from './types';

const COPY: Record<Locale, Copy> = { en, de };

export function getCopy(locale: Locale): Copy {
  return COPY[locale];
}
