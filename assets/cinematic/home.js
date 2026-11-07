/* Navigation enhancement only; benchmark and diagram code are retained separately. */
(() => {
  const toggle = document.querySelector('.al-mobile-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;
  document.body.classList.add('al-js');
  const setOpen = (open, returnFocus = false) => {
    nav.classList.toggle('al-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    setOpen(false);
    // Move focus to the destination so it does not remain in the hidden menu.
    const target = document.getElementById(link.hash.slice(1));
    if (target && window.matchMedia('(max-width: 1000px)').matches) {
      target.setAttribute('tabindex', '-1');
      target.focus({preventScroll: true});
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('al-open')) setOpen(false, true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.al-header')) setOpen(false);
  });
  const links = [...nav.querySelectorAll('a')];
  const sections = [...document.querySelectorAll('main section[id]')]
    .filter(section => links.some(link => link.hash === '#' + section.id));
  let scheduled = false;
  const update = () => {
    scheduled = false;
    let current = 'overview';
    for (const section of sections) if (section.getBoundingClientRect().top <= 170) current = section.id;
    for (const link of links) {
      const active = link.hash === '#' + current;
      link.classList.toggle('al-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, {passive: true});
  window.addEventListener('resize', () => { setOpen(false); update(); });
  update();
})();
