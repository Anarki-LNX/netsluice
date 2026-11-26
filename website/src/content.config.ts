// Content collections of the NetSluice website.
//
// Every entry exists in English and German with the same file name:
//   src/content/docs/en/install-image.md  <->  src/content/docs/de/install-image.md
// The entry id is "<lang>/<slug>" (for example "de/install-image"). Pages split it
// with `entrySlug()` below and list only the entries whose `lang` matches.
//
// Facts in these files are traced to the product repository in
// WEBSITE_CONTENT_AUDIT.md. Change a claim there first, then here.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const LANGS = ['en', 'de'] as const;
export type Lang = (typeof LANGS)[number];

/** Sections of the documentation, in the order the sidebar shows them. */
export const DOC_SECTIONS = ['start', 'install', 'use', 'hardware', 'develop'] as const;
export type DocSection = (typeof DOC_SECTIONS)[number];

/** Groups of the FAQ, in the order the page shows them. */
export const FAQ_CATEGORIES = ['basics', 'install', 'use', 'updates', 'security', 'project'] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

/** Long-form pages that are not documentation. */
export const PAGE_SLUGS = ['security', 'privacy', 'about', 'contributing', 'license', 'support', 'disclaimer'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

const lang = z.enum(LANGS);

const docs = defineCollection({
  loader: glob({ pattern: '{en,de}/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    /** one sentence, used for meta description and the docs index cards */
    description: z.string().min(1).max(200),
    lang,
    section: z.enum(DOC_SECTIONS),
    /** sort key across all docs: 10s Start, 20s Install, 30s Use, 40s Hardware, 50s Develop */
    order: z.number().int().nonnegative(),
    updated: z.coerce.date().optional(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '{en,de}/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string().min(1).max(160),
    lang,
    category: z.enum(FAQ_CATEGORIES),
    order: z.number().int().nonnegative(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '{en,de}/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(200),
    lang,
    updated: z.coerce.date(),
  }),
});

export const collections = { docs, faq, pages };

/** "de/install-image" -> "install-image". */
export function entrySlug(id: string): string {
  const i = id.indexOf('/');
  return i === -1 ? id : id.slice(i + 1);
}
