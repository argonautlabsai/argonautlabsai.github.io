(() => {
  document.querySelectorAll('.install-code').forEach((block) => {
    const code = block.querySelector('code');
    const head = block.querySelector('.install-code-head');
    if (!code || !head) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy: ' + head.textContent.trim());
    const status = document.createElement('span');
    status.setAttribute('role', 'status');
    head.append(status, button);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = 'Copied';
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = 'Selected — copy manually';
      }
    });
  });
})();
