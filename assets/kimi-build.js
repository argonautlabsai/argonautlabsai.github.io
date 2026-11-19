/* Illustration only: the order of events for one token. No telemetry, model data or benchmark sampling. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FRAME_MS = 600;
  const FRAMES_PER_STEP = 6;

  const steps = [
    ['Route.', ' In every layer the attention and the router run on the card. The router picks 16 of that layer’s 896 experts, and the CPU gets the same list.'],
    ['Look up.', ' Each of the 16 is looked for in three places: the card’s cache, the pinned pool in RAM, and the drives. One that is already on the card costs nothing.'],
    ['Read.', ' Whatever is in neither memory is read from NVMe straight into pinned memory, two chunks per file. An expert with a second copy is read from the drive expected to finish first.'],
    ['Upload.', ' Experts found in the RAM pool, and the ones just read, are uploaded to the card that runs the layer.'],
    ['Compute.', ' Each expert computes the moment its bytes land. The layer is finished when the last of its 16 is, so the slowest read sets the pace.'],
    ['Cross.', ' After layer 45 the token’s state is copied to the second card, runs layers 46 to 92 there and comes back for the output head. Then the next token starts.']
  ];
  const lastStepOneCard = ['Next layer.', ' With one card nothing crosses: the same card runs every layer, with room for 1,536 experts in its cache instead of 7,239. Then the next token starts.'];
  const labels = {
    1: { card0: 'Embedding, every layer, output head', card1: 'Not used', cache0: '1,536 experts', cache1: 'None', last0: '92', plain: '2.04', drafter: '3.87' },
    2: { card0: 'Embedding, layers 0–45, output head', card1: 'Layers 46–92', cache0: 'Part of one 7,239-expert cache', cache1: 'Part of one 7,239-expert cache', last0: '45', plain: '2.97', drafter: '5.52' }
  };

  document.querySelectorAll('[data-build-diagram]').forEach(root => {
    const controls = root.querySelector('.bd-controls');
    const stepList = root.querySelector('.bd-steps');
    const stepButtons = root.querySelectorAll('[data-bd-step]');
    const cardButtons = root.querySelectorAll('[data-bd-cards]');
    const pause = root.querySelector('.bd-pause');
    const pauseText = pause.querySelector('span');
    const pauseIcon = pause.querySelector('path');
    const caption = root.querySelector('[data-bd-caption]');
    const grids = Array.from(root.querySelectorAll('.bd-grid'), grid => Array.from(grid.children));
    const strips = Array.from(root.querySelectorAll('.bd-layers'), strip => Array.from(strip.children));
    const pins = Array.from(root.querySelectorAll('.bd-pins i'));
    const slots = {};
    root.querySelectorAll('[data-bd-text]').forEach(node => { slots[node.dataset.bdText] = node; });

    let step = 1;       // 1..6
    let cards = 2;      // 1 or 2
    let turn = 0;       // which token; changes the lit cells from one token to the next
    let sub = 0;        // frames spent in the current step
    let auto = true;    // advance through the steps unaided
    let paused = false;
    let visible = false;
    let timer = null;

    function draw() {
      const two = cards === 2;
      const crossing = step === 6;
      const working = crossing && two ? 1 : 0;
      const layer = 9 + (turn * 5) % 24;

      // The strips are one tick per layer; the lit tick is where the token is.
      strips.forEach((ticks, card) => {
        let on = -1;
        let done = 0;
        if (card === 0 && !crossing) { on = layer; done = layer; }
        else if (card === 0 && two) { done = ticks.length; }
        else if (card === 0) { on = Math.min(ticks.length - 1, layer + sub * 4); done = on; }
        else if (crossing && two) { on = Math.min(ticks.length - 1, sub * 9); done = on; }
        ticks.forEach((tick, index) => { tick.className = index === on ? 'on' : index < done ? 'done' : ''; });
      });

      // The grids are a visual subset, not 896 experts or a measured hit rate.
      grids.forEach((cells, card) => {
        const unused = !two && card === 1;
        cells.forEach((cell, index) => {
          const held = !unused && ((index * 7 + card * 3) % 5) < 2;
          let name = held ? 'held' : '';
          if (!unused && card === working && ((index * 17 + turn * 7 + card * 5) % 53) < 13) {
            const source = held ? 'gpu' : ((index * 11 + turn * 5) % 7) < 3 ? 'ram' : 'disk';
            const arrived = step >= 5 || (source === 'gpu' ? step >= 2 : source === 'disk' ? step >= 3 : step >= 4);
            name = arrived ? 'from-' + source : 'want';
          }
          cell.className = name;
        });
      });

      const lit = step === 4 ? 7 : step === 3 ? 5 : 4;
      pins.forEach((pin, index) => { pin.className = ((index * 5 + turn * 3 + (step === 4 ? sub : 0)) % 12) < lit ? 'on' : ''; });
    }

    function describe() {
      const entry = step === 6 && cards === 1 ? lastStepOneCard : steps[step - 1];
      const heading = document.createElement('strong');
      heading.textContent = step + '. ' + entry[0];
      caption.replaceChildren(heading, document.createTextNode(entry[1]));
    }

    function setStep(next) {
      step = next;
      sub = 0;
      root.dataset.step = String(step);
      stepButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.bdStep) === step)));
      describe();
      draw();
    }

    function setCards(next) {
      cards = next;
      root.dataset.cards = String(cards);
      cardButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.bdCards) === cards)));
      Object.entries(labels[cards]).forEach(([key, value]) => { if (slots[key]) slots[key].textContent = value; });
      describe();
      draw();
    }

    function tick() {
      sub += 1;
      if (sub >= FRAMES_PER_STEP) {
        if (auto) {
          if (step === 6) turn += 1;
          setStep(step === 6 ? 1 : step + 1);
          return;
        }
        sub = 0;
      }
      draw();
    }

    function sync() {
      const running = visible && !document.hidden && !paused && !reducedMotion.matches;
      root.dataset.running = String(running);
      pause.disabled = reducedMotion.matches;
      pauseText.textContent = reducedMotion.matches ? 'Motion off' : paused ? 'Play' : 'Pause';
      pause.setAttribute('aria-label', reducedMotion.matches ? 'Animation disabled by reduced-motion preference' : paused ? 'Play the diagram' : 'Pause the diagram');
      pauseIcon.setAttribute('d', paused ? 'M3 2 11 7 3 12Z' : 'M3 2h2v10H3zM9 2h2v10H9z');
      if (running && timer === null) {
        timer = window.setInterval(tick, FRAME_MS);
      } else if (!running && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    // Choosing a step holds it; Pause stops all motion; Play starts the tour again.
    stepButtons.forEach(button => button.addEventListener('click', () => { auto = false; setStep(Number(button.dataset.bdStep)); sync(); }));
    cardButtons.forEach(button => button.addEventListener('click', () => { setCards(Number(button.dataset.bdCards)); }));
    pause.addEventListener('click', () => {
      if (paused) { paused = false; auto = true; } else { paused = true; }
      sync();
    });
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
    } // Without visibility observation the diagram stays a static picture of step 1.
    setCards(2);
    setStep(1);
    controls.hidden = false;
    stepList.hidden = false;
    sync();
  });
})();
