import { getCollection, type CollectionEntry } from 'astro:content';
import { DOC_SECTIONS, entrySlug, type DocSection } from '~/content.config';
import type { Locale } from '~/i18n';

export interface DocLink {
  slug: string;
  title: string;
  description: string;
  section: DocSection;
  href: string;
}

export async function getDocs(locale: Locale): Promise<CollectionEntry<'docs'>[]> {
  const all = await getCollection('docs', (e) => e.data.lang === locale);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function getDocLinks(locale: Locale): Promise<DocLink[]> {
  return (await getDocs(locale)).map((e) => ({
    slug: entrySlug(e.id),
    title: e.data.title,
    description: e.data.description,
    section: e.data.section,
    href: `/${locale}/docs/${entrySlug(e.id)}/`,
  }));
}

export function groupBySection(links: DocLink[]): { section: DocSection; links: DocLink[] }[] {
  return DOC_SECTIONS.map((section) => ({ section, links: links.filter((l) => l.section === section) })).filter(
    (g) => g.links.length > 0,
  );
}
