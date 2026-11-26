// On the language choice page: mark the card that matches the browser's
// language. Never redirects.
const pref = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
const match = pref.startsWith('de') ? 'de' : pref.startsWith('en') ? 'en' : null;
if (match) {
  const card = document.querySelector<HTMLElement>(`[data-lang-card="${match}"]`);
  if (card) {
    card.classList.add('is-suggested');
    card.querySelector<HTMLElement>('[data-lang-hint]')?.removeAttribute('hidden');
  }
}
