// Copy buttons of CodeBlock. The button is hidden in the HTML and shown here, so
// it never appears where it cannot work. Result is announced via aria-live.

function init() {
  for (const root of document.querySelectorAll<HTMLElement>('[data-copy-root]')) {
    if (root.dataset.copyReady) continue;
    root.dataset.copyReady = '1';
    const btn = root.querySelector<HTMLButtonElement>('[data-copy-button]');
    const src = root.querySelector<HTMLElement>('[data-copy-source]');
    const status = root.querySelector<HTMLElement>('[data-copy-status]');
    const label = root.querySelector<HTMLElement>('[data-copy-text]');
    if (!btn || !src || !navigator.clipboard) continue;
    const idle = label?.textContent ?? '';
    btn.hidden = false;
    let timer = 0;
    btn.addEventListener('click', async () => {
      const text = (src.textContent ?? '').replace(/\n$/, '');
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('is-done');
        if (label) label.textContent = btn.dataset.labelCopied ?? idle;
        if (status) status.textContent = btn.dataset.labelCopied ?? '';
      } catch {
        if (status) status.textContent = btn.dataset.labelFailed ?? '';
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        btn.classList.remove('is-done');
        if (label) label.textContent = idle;
        if (status) status.textContent = '';
      }, 2200);
    });
  }
}

init();
