/* Bentley Studios v2. Progressive enhancement: without JS, GSAP or motion the page is complete and readable. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  let paused = false;

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- text scramble (the "system readout" voice) ---------- */
  const GLYPHS = '#%&*+=<>/\\[]{}01ABCDEFX';
  function scramble(el, text = el.dataset.text || el.textContent, dur = 700) {
    el.dataset.text = text;
    if (reduce) { el.textContent = text; return; }
    const start = performance.now();
    const tick = now => {
      const k = Math.min(1, (now - start) / dur);
      const done = Math.floor(k * text.length);
      let out = text.slice(0, done);
      for (let i = done; i < text.length; i++) out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (k < 1) requestAnimationFrame(tick); else el.textContent = text;
    };
    requestAnimationFrame(tick);
  }

  /* ---------- hero canvas: Ouchi illusion ---------- */
  const B_SIL = 'M100,100 H312 Q368,100 368,156 V200 Q368,236 344,252 Q384,270 384,312 V364 Q384,420 328,420 H100 Z';
  const UPPER = 'M0,0 H512 V160 H190 Q160,160 160,190 V230 Q160,260 190,260 H300 Q330,260 330,290 V330 Q330,360 300,360 H0 Z';
  const SEAM = 'M420,160 H190 Q160,160 160,190 V230 Q160,260 190,260 H300 Q330,260 330,290 V330 Q330,360 300,360 H60';
  const canvas = $('.hero__canvas');
  const hero = $('.hero');
  const C = { navy: '#0a1a3a', field: '#16306a', white: '#f5f7fb', blue: '#3d7bff' };
  let ctx, W = 0, H = 0, dpr = 1, heroOn = true, raf = 0, t0 = performance.now();
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const pB = new Path2D(B_SIL), pU = new Path2D(UPPER), pS = new Path2D(SEAM);

  function sizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
  }

  function checker(x0, y0, w, h, cw, ch, ox, oy, colour) {
    // 2:1 bricks as a checkerboard, offset by (ox, oy)
    ctx.fillStyle = colour;
    ctx.beginPath();
    const sx = ((ox % (cw * 2)) + cw * 2) % (cw * 2) - cw * 2;
    const sy = ((oy % (ch * 2)) + ch * 2) % (ch * 2) - ch * 2;
    for (let y = y0 + sy, r = 0; y < y0 + h; y += ch, r++) {
      for (let x = x0 + sx, c = 0; x < x0 + w; x += cw, c++) {
        if ((r + c) & 1) ctx.rect(x, y, cw, ch);
      }
    }
    ctx.fill();
  }

  function draw(now) {
    if (!ctx) return;
    const t = reduce || paused ? 0 : (now - t0) / 1000;
    ptr.x += (ptr.tx - ptr.x) * 0.08; ptr.y += (ptr.ty - ptr.y) * 0.08;
    const r = hero.getBoundingClientRect();
    const sy = Math.max(0, -r.top / Math.max(1, r.height));          // 0 at top, 1 when the hero has scrolled away
    const cw = Math.max(30, Math.min(64, W / 26)), ch = cw / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
    // field: horizontal bricks drifting one way
    checker(0, 0, W, H, cw, ch, -t * 16 - ptr.x * 28, -sy * 160 - ptr.y * 16, C.field);

    // the B: vertical bricks drifting the other way
    const mobile = W < 860;
    const S = mobile ? Math.min(W * 0.86, H * 0.5) : Math.min(H * 0.74, W * 0.4);
    const bx = mobile ? (W - S) / 2 : W - S - W * 0.045;
    const by = mobile ? H * 0.1 : (H - S) / 2 + H * 0.05;
    const k = S / 360;
    const toB = () => ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (bx + (14 - 76) * k), dpr * (by + (-4 - 76) * k));
    const ox = t * 10 + ptr.x * 28, oy = t * 22 + sy * 160 + ptr.y * 16;

    ctx.save();
    toB(); ctx.clip(pB);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.navy; ctx.fillRect(bx - S * 0.1, by - S * 0.1, S * 1.2, S * 1.2);
    checker(bx - S * 0.1, by - S * 0.1, S * 1.2, S * 1.2, ch, cw, ox, oy, C.blue);
    toB(); ctx.clip(pU);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.navy; ctx.fillRect(bx - S * 0.1, by - S * 0.1, S * 1.2, S * 1.2);
    checker(bx - S * 0.1, by - S * 0.1, S * 1.2, S * 1.2, ch, cw, ox, oy, C.white);
    ctx.restore();
    // the S seam, cut through in the ground colour
    ctx.save(); toB(); ctx.strokeStyle = C.navy; ctx.lineWidth = 24; ctx.stroke(pS); ctx.restore();
  }

  function loop(now) {
    raf = 0;
    draw(now);
    if (heroOn && !reduce && !paused) raf = requestAnimationFrame(loop);
  }
  const startLoop = () => { if (!raf && canvas) raf = requestAnimationFrame(loop); };

  if (canvas) {
    sizeCanvas();
    startLoop();
    new ResizeObserver(() => { sizeCanvas(); draw(performance.now()); }).observe(canvas);
    new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; if (heroOn) startLoop(); }).observe(hero);
    addEventListener('pointermove', e => {
      ptr.tx = (e.clientX / innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / innerHeight - 0.5) * 2;
      if (reduce) draw(performance.now());
    }, { passive: true });
  }

  /* ---------- header: solid after the hero starts to move, hides on scroll down ---------- */
  const hdr = $('[data-hdr]');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 40);
    hdr.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.6);
    lastY = y;
  }, { passive: true });

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const label = $('[data-copy-label]', btn);
    try { await navigator.clipboard.writeText(btn.dataset.copy); scramble(label, 'Copied', 400); }
    catch (e) { label.textContent = btn.dataset.copy; }
    setTimeout(() => scramble(label, 'Copy email', 400), 2200);
  }));

  /* ---------- custom cursor + magnetic buttons ---------- */
  if (fine && !reduce) {
    root.classList.add('has-cursor');
    const dot = $('.cursor__dot'), ring = $('.cursor__ring');
    const m = { x: innerWidth / 2, y: innerHeight / 2 }, rr = { x: m.x, y: m.y };
    addEventListener('pointermove', e => {
      m.x = e.clientX; m.y = e.clientY;
      dot.style.transform = `translate(${m.x}px, ${m.y}px)`;
    }, { passive: true });
    (function follow() {
      rr.x += (m.x - rr.x) * 0.16; rr.y += (m.y - rr.y) * 0.16;
      ring.style.transform = `translate(${rr.x}px, ${rr.y}px)`;
      requestAnimationFrame(follow);
    })();
    document.addEventListener('pointerover', e => root.classList.toggle('cursor-hover', !!e.target.closest('a, button, summary')));
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const b = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.3}px, ${(e.clientY - b.top - b.height / 2) * 0.4}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; setTimeout(() => { el.style.transition = ''; }, 500); });
    });
  }

  /* ---------- motion toggle ---------- */
  let lenis = null;
  $$('[data-motion-toggle]').forEach(btn => btn.addEventListener('click', () => {
    paused = !paused;
    root.classList.toggle('motion-paused', paused);
    btn.setAttribute('aria-pressed', String(paused));
    btn.textContent = paused ? 'Play motion' : 'Pause motion';
    if (lenis) paused ? lenis.stop() : lenis.start();
    if (!paused) startLoop();
  }));

  /* ---------- preloader, then the intro ---------- */
  function intro() {
    $$('[data-scramble]').forEach(el => scramble(el, el.textContent, 900));
    if (!hasGSAP || reduce) return;
    gsap.from('.hero .line__in', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.09 });
    gsap.from('.hero__foot > *', { y: 28, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.35, stagger: 0.08 });
    gsap.from('.hdr', { y: -30, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.2 });
  }

  const loader = $('.loader');
  const seen = root.classList.contains('seen');
  if (!loader || seen || reduce) { root.classList.add('loaded'); intro(); }
  else {
    const count = $('[data-count]', loader), bar = $('.loader__bar span', loader);
    const t1 = performance.now(), DUR = 1500;
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    let fontsDone = false; fontsReady.then(() => { fontsDone = true; });
    (function tick(now) {
      let k = Math.min(1, (now - t1) / DUR);
      if (!fontsDone) k = Math.min(k, 0.9);
      const v = Math.round((1 - Math.pow(1 - k, 3)) * 100);
      count.textContent = String(v).padStart(3, '0');
      bar.style.setProperty('--lp', v);
      if (k < 1 || !fontsDone) { if (now - t1 < 4000) return requestAnimationFrame(tick); }
      root.classList.add('loaded');
      try { sessionStorage.setItem('bs-loaded', '1'); } catch (e) { /* storage blocked */ }
      setTimeout(intro, 250);
    })(t1);
  }

  /* ---------- scroll choreography (GSAP + ScrollTrigger + Lenis) ---------- */
  if (!hasGSAP || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && $(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.4 });
      if (id === '#main') el.focus({ preventScroll: true });
    }));
  }

  // labels decode as they arrive
  $$('.label').forEach(el => {
    if (el.hasAttribute('data-scramble')) return;
    const span = el.lastChild;
    if (!span || span.nodeType !== 3) return;
    const holder = document.createElement('span');
    holder.textContent = span.textContent; el.replaceChild(holder, span);
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => scramble(holder, holder.textContent, 700) });
  });

  // marquee: skews with scroll speed
  const groups = $$('.marquee__group');
  const skewTo = gsap.quickTo(groups, 'skewX', { duration: 0.5, ease: 'power3' });
  ScrollTrigger.create({ onUpdate: self => skewTo(gsap.utils.clamp(-12, 12, self.getVelocity() / -260)) });

  // manifesto: words light up as you read
  const mt = $('[data-words]');
  if (mt) {
    mt.innerHTML = mt.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    gsap.fromTo($$('.w', mt), { opacity: 0.14 }, { opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: mt, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 } });
  }

  // big headings rise through a mask
  $$('.principles__title, .method__title, .apps__title, .faq__title, .seam__title').forEach(h => {
    gsap.from(h, { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  gsap.from('.contact .line__in', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.contact__title', start: 'top 80%' } });

  const mm = gsap.matchMedia();

  // the seam: pinned, halves part, cues swap, then it locks
  mm.add('(min-width: 900px) and (min-height: 600px)', () => {
    const seam = $('.seam'), cues = $$('.seam__cue'), status = $('[data-status]');
    seam.classList.add('is-pinned');
    gsap.set(cues, { opacity: 0, y: 24 }); gsap.set(cues[0], { opacity: 1, y: 0 });
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' },
      scrollTrigger: { trigger: seam, start: 'top top', end: '+=220%', pin: '.seam__stage', scrub: 0.8,
        onUpdate: self => {
          const locked = self.progress > 0.9;
          if (locked !== seam.classList.contains('is-locked')) {
            seam.classList.toggle('is-locked', locked);
            scramble(status, locked ? 'Locked' : 'Seam open', 500);
          }
        } } });
    tl.to('.seam__half--upper', { xPercent: -13, yPercent: -10, rotate: -5, duration: 3 }, 0)
      .to('.seam__half--lower', { xPercent: 13, yPercent: 10, rotate: 5, duration: 3 }, 0)
      .to('.seam__ring', { rotate: 120, duration: 10, ease: 'none' }, 0)
      .to(cues[0], { opacity: 0, y: -24, duration: 0.6 }, 3)
      .to(cues[1], { opacity: 1, y: 0, duration: 0.6 }, 3.4)
      .to(cues[1], { opacity: 0, y: -24, duration: 0.6 }, 5.6)
      .to(cues[2], { opacity: 1, y: 0, duration: 0.6 }, 6)
      .to('.seam__half--upper', { xPercent: 0, yPercent: 0, rotate: 0, duration: 2.4, ease: 'expo.inOut' }, 6.2)
      .to('.seam__half--lower', { xPercent: 0, yPercent: 0, rotate: 0, duration: 2.4, ease: 'expo.inOut' }, 6.2)
      .to('.seam__art', { scale: 1.04, duration: 0.4, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 8.6)
      .to({}, { duration: 1 });
    return () => { seam.classList.remove('is-pinned', 'is-locked'); gsap.set(cues, { clearProps: 'all' }); };
  });

  // principles: each card sinks back as the next one stacks on top
  const cards = $$('.card');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.fromTo(card, { scale: 1, filter: 'brightness(1)' }, { scale: 0.92 + i * 0.015, filter: 'brightness(0.72)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } });
  });

  // method: the rail scrolls sideways while the section is pinned
  mm.add('(min-width: 900px) and (min-height: 600px)', () => {
    root.classList.add('rail-on');
    const rail = $('.rail');
    const dist = () => Math.max(0, rail.scrollWidth - innerWidth);
    gsap.to(rail, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.method', start: 'top top', end: () => '+=' + dist(), pin: '.method__pin', scrub: 0.6, invalidateOnRefresh: true } });
    gsap.from('.rail__n', { yPercent: 60, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.method', start: 'top 60%' } });
    return () => root.classList.remove('rail-on');
  });

  // footer wordmark: the bricks slide, the Ouchi shimmer one last time
  gsap.fromTo('.ftr__word', { '--fx': '0px' }, { '--fx': '320px', ease: 'none',
    scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.from('.ftr__word', { yPercent: 30, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 90%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
