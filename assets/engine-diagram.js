/* Illustrative activity only. No telemetry, model data or benchmark sampling. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-engine-diagram]').forEach(root => {
    const controls = root.querySelector('.engine-controls');
    const modes = root.querySelectorAll('[data-engine-mode]');
    const pause = root.querySelector('.engine-pause');
    const pauseText = pause.querySelector('span');
    const pauseIcon = pause.querySelector('path');
    const caption = root.querySelector('[data-engine-caption]');
    const cells = root.querySelectorAll('.engine-grid span');
    let mode = 'prefill';
    let paused = false;
    let visible = false;
    let frame = 0;
    let timer = null;

    const explanations = {
      prefill: ['Prefill: process the prompt.', ' A batch can reuse each loaded expert across several input tokens.'],
      decode: ['Decode: generate the answer.', ' For each token, each MoE layer selects 16 experts. Cache hits avoid some disk reads.']
    };

    function draw() {
      // The grid is a visual subset, not 896 experts or a measured hit rate.
      cells.forEach((cell, index) => {
        const slot = (index * 17 + frame * 7) % 53;
        const active = mode === 'prefill' ? slot < 34 : slot < 17;
        const source = (index + Math.floor(frame / 2)) % 7;
        cell.className = active ? (source < 3 ? 'from-gpu' : source < 5 ? 'from-ram' : 'from-disk') : '';
      });
    }

    function sync() {
      const running = visible && !document.hidden && !paused && !reducedMotion.matches;
      root.dataset.running = String(running);
      pause.disabled = reducedMotion.matches;
      pauseText.textContent = reducedMotion.matches ? 'Motion off' : paused ? 'Play' : 'Pause';
      pause.setAttribute('aria-label', reducedMotion.matches ? 'Animation disabled by reduced-motion preference' : paused ? 'Play diagram animation' : 'Pause diagram animation');
      pauseIcon.setAttribute('d', paused ? 'M3 2 11 7 3 12Z' : 'M3 2h2v10H3zM9 2h2v10H9z');
      if (running && timer === null) {
        timer = window.setInterval(() => { frame += 1; draw(); }, 1100);
      } else if (!running && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    modes.forEach(button => button.addEventListener('click', () => {
      mode = button.dataset.engineMode;
      root.dataset.mode = mode;
      modes.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      const heading = document.createElement('strong');
      heading.textContent = explanations[mode][0];
      caption.replaceChildren(heading, document.createTextNode(explanations[mode][1]));
      frame = 0;
      draw();
      sync();
    }));
    pause.addEventListener('click', () => { paused = !paused; sync(); });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      root.dataset.running = 'false';
    });
    window.addEventListener('pageshow', sync);
    reducedMotion.addEventListener('change', sync);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0 });
      observer.observe(root);
    } // A static diagram is the fallback if visibility observation is unavailable.
    draw();
    controls.hidden = false;
    sync();
  });
})();
