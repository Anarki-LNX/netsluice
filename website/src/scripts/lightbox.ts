// Lightbox for Gallery. Uses a modal <dialog>: the browser traps focus, makes the
// page behind it inert and closes on Escape. Arrow keys move between pictures.
// Without JavaScript the links simply open the full-size image.

for (const gallery of document.querySelectorAll<HTMLElement>('[data-gallery]')) {
  const dialog = gallery.querySelector<HTMLDialogElement>('[data-lb-dialog]');
  const img = dialog?.querySelector<HTMLImageElement>('[data-lb-img]');
  const cap = dialog?.querySelector<HTMLElement>('[data-lb-cap]');
  const count = dialog?.querySelector<HTMLElement>('[data-lb-count]');
  const links = Array.from(gallery.querySelectorAll<HTMLAnchorElement>('a[data-lb]'));
  if (!dialog || !img || !links.length || typeof dialog.showModal !== 'function') continue;

  const of = dialog.dataset.labelOf ?? '/';
  let index = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number) => {
    index = (i + links.length) % links.length;
    const a = links[index];
    if (!a) return;
    img.src = a.href;
    img.width = Number(a.dataset.lbW) || 1440;
    img.height = Number(a.dataset.lbH) || 960;
    img.alt = a.dataset.lbAlt ?? '';
    if (cap) cap.textContent = a.dataset.lbCaption ?? '';
    if (count) count.textContent = `${index + 1} ${of} ${links.length}`;
  };

  links.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      opener = a;
      show(i);
      dialog.showModal();
      document.documentElement.classList.add('dialog-open');
      dialog.querySelector<HTMLButtonElement>('[data-lb-close]')?.focus();
    });
  });

  dialog.querySelector('[data-lb-prev]')?.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lb-next]')?.addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-lb-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      show(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      show(index + 1);
    }
  });
  // a click on the dark area around the picture closes it
  dialog.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === dialog || target.classList.contains('lb__inner')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('dialog-open');
    opener?.focus();
  });
}
