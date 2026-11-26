// Subtle scroll reveal for elements marked [data-reveal]. Off under reduced
// motion; content is visible without JavaScript (the hiding class is set here).

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

if (!still && items.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  // whatever is already on screen stays visible from the start (no flash)
  const vh = window.innerHeight;
  for (const el of items) {
    if (el.getBoundingClientRect().top < vh) el.classList.add('is-visible');
    else io.observe(el);
  }
  document.documentElement.classList.add('js-reveal');
}
