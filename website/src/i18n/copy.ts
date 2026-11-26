// Bridge to the page copy of agent 2 (src/data/copy). Uses import.meta.glob so
// the site keeps building while the copy module is still being written: pages
// get `null` and show a marked placeholder until then.
// TODO(phase-b): once src/data/copy/index.ts is final, pages may import getCopy directly.
import type { Copy, LinkTarget } from '~/data/copy/types';
import { DONATE_URL, REPO } from '~/config/site';
import { localizePath, routes, type Locale } from '~/i18n';

type CopyModule = { getCopy: (locale: Locale) => Copy };
const found = import.meta.glob<CopyModule>('../data/copy/index.ts', { eager: true });
const mod = Object.values(found)[0];

export function maybeCopy(locale: Locale): Copy | null {
  try {
    return mod?.getCopy ? mod.getCopy(locale) : null;
  } catch {
    return null;
  }
}

export type { Copy };

/** Resolve a copy link target to an href. */
export function hrefOf(to: LinkTarget, locale: Locale): { href: string; external: boolean } {
  if ('route' in to) {
    const base = localizePath(routes[to.route], locale);
    return { href: to.hash ? `${base}#${to.hash}` : base, external: false };
  }
  if ('doc' in to) {
    const base = `/${locale}/docs/${to.doc}/`;
    return { href: to.hash ? `${base}#${to.hash}` : base, external: false };
  }
  const ext: Record<typeof to.external, string> = {
    repo: REPO.url,
    issues: REPO.issues,
    newIssue: REPO.newIssue,
    releases: REPO.releases,
    pulls: REPO.pulls,
    donate: DONATE_URL,
    hardwareDoc: REPO.hardwareDoc,
    developmentDoc: REPO.developmentDoc,
  };
  return { href: ext[to.external], external: true };
}
