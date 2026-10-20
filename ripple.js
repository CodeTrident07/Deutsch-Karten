// Letter ripple: a faint field of German letters behind the page. Every few
// seconds a ripple spreads through it, brightening and shuffling the letters
// it passes. Clicking empty space starts one from that spot.
//
// It sits behind all content (z-index -1), so cards, bars and buttons cover it
// and it only shows in the empty space around them. Stays still for people
// who prefer reduced motion, and pauses while the tab is hidden.
(function () {
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß';
  const CELL = 18, FONT = 12;
  const SPEED = 0.2;         // px per ms
  const WIDTH = 48;          // thickness of the ring
  const LIFE = 3600;         // ms before a ripple fades out
  const BASE = 0.045, PEAK = 0.3;
  const IGNORE = 'a, button, input, textarea, select, label, [onclick], [role="button"], .key, .tile, .card-scene, .chat-panel, .chat-fab, .modal';

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const randomLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

  let cols, rows, letters, ripples = [], last = 0, nextAuto = 0, raf;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1; rows = Math.ceil(h / CELL) + 1;
    letters = Array.from({ length: cols * rows }, randomLetter);
    draw(performance.now());
  }

  function addRipple(x, y, t) {
    ripples.push({ x, y, t });
    if (ripples.length > 5) ripples.shift();
  }

  function draw(now) {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.font = FONT + 'px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ripples = ripples.filter(r => now - r.t < LIFE);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * CELL + CELL / 2, y = j * CELL + CELL / 2;
        let glow = 0;
        for (const r of ripples) {
          const age = now - r.t;
          const d = Math.hypot(x - r.x, y - r.y) - age * SPEED;
          const g = Math.exp(-(d * d) / (2 * WIDTH * WIDTH)) * (1 - age / LIFE);
          if (g > glow) glow = g;
        }
        const k = j * cols + i;
        if (glow > 0.55 && Math.random() < 0.08) letters[k] = randomLetter();
        const a = BASE + glow * PEAK;
        ctx.fillStyle = glow > 0.6 ? `rgba(240,240,240,${a})` : `rgba(171,171,171,${a})`;
        ctx.fillText(letters[k], x, y);
      }
    }
  }

  function frame(now) {
    if (now - last > 33) {                     // about 30 fps
      if (now > nextAuto) {
        addRipple(Math.random() * window.innerWidth, Math.random() * window.innerHeight, now);
        nextAuto = now + 4000 + Math.random() * 2500;
      }
      draw(now);
      last = now;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduce.matches || document.hidden) { draw(performance.now()); return; }
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener('pointerdown', e => {
    if (reduce.matches || e.target.closest(IGNORE)) return;
    addRipple(e.clientX, e.clientY, performance.now());
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', start);
  if (reduce.addEventListener) reduce.addEventListener('change', start);

  resize();
  nextAuto = performance.now() + 900;
  start();
})();
