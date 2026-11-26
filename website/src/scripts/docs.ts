// Docs: the sidebar <details> starts open (so it works without JS); on phones it
// is folded here to keep the article first. The table of contents marks the
// section in view.

const nav = document.querySelector<HTMLDetailsElement>('[data-docs-nav]');
const narrow = window.matchMedia('(max-width: 959px)');
if (nav) {
  const sync = () => {
    nav.open = !narrow.matches;
  };
  sync();
  narrow.addEventListener('change', sync);
}

const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.docs__toc a[href^="#"]'));
if (tocLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const targets = Array.from(byId.keys())
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  const visible = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      }
      const first = targets.find((t) => visible.has(t.id));
      if (!first) return;
      for (const a of tocLinks) a.classList.remove('is-current');
      byId.get(first.id)?.classList.add('is-current');
    },
    { rootMargin: '-80px 0px -60% 0px' },
  );
  for (const t of targets) io.observe(t);
}
