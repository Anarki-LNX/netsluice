// Disclosure menus built on <details>: they work without JavaScript. This adds
// Escape to close (focus back to the toggle), closing on outside click and on
// link choice, one open at a time, no page scroll behind the mobile menu, and a
// hairline under the header once the page scrolls.

const disclosures = Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-disclosure]'));

function close(d: HTMLDetailsElement, focus = false) {
  if (!d.open) return;
  d.open = false;
  if (focus) d.querySelector<HTMLElement>('summary')?.focus();
}

for (const d of disclosures) {
  d.addEventListener('toggle', () => {
    if (d.open) for (const other of disclosures) if (other !== d) close(other);
    if (d.hasAttribute('data-mobile-nav')) {
      document.documentElement.classList.toggle('nav-open', d.open);
      if (d.open) d.querySelector<HTMLAnchorElement>('nav a')?.focus({ preventScroll: true });
    }
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && d.open) {
      e.preventDefault();
      close(d, true);
    }
  });
  d.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('a');
    if (a) close(d);
  });
  // keep keyboard focus inside the open mobile menu
  if (d.hasAttribute('data-mobile-nav')) {
    d.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !d.open) return;
      const items = Array.from(d.querySelectorAll<HTMLElement>('summary, a[href]'));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
}

document.addEventListener('click', (e) => {
  for (const d of disclosures) if (d.open && !d.contains(e.target as Node)) close(d);
});

// close the mobile menu when the viewport grows into the desktop layout
const wide = window.matchMedia('(min-width: 1080px)');
wide.addEventListener('change', () => {
  for (const d of disclosures) if (d.hasAttribute('data-mobile-nav')) close(d);
});

const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.className = 'scroll-sentinel';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-scrolled', !entry?.isIntersecting);
  }).observe(sentinel);
}
