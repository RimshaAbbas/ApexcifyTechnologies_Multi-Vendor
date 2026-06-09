/* ui.js — Gold/Silver luxury interaction layer */

// ── 1. Canvas Particle Network ────────────────────────────────────────────────
(function initCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'cyber-canvas';
  Object.assign(canvas.style, {
    position:'fixed', inset:'0', zIndex:'0', pointerEvents:'none', willChange:'transform',
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const GOLD   = '#D4AF37';
  const SILVER = '#C0C0C0';
  const LINK   = 160;
  const SPEED  = 0.3;

  let W, H, nodes, mouse = { x: -999, y: -999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeNode() {
    const gold = Math.random() < 0.35;
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: gold ? 2.2 : 1.5,
      color: gold ? GOLD : SILVER,
    };
  }

  function init() {
    resize();
    nodes = Array.from({ length: Math.min(90, Math.floor(W * H / 12000)) }, makeNode);
  }

  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 100) { const f = (100 - d) / 100 * 0.5; n.x += dx / d * f; n.y += dy / d * f; }
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist > LINK) continue;
        const a = (1 - dist / LINK) * 0.55;
        const isGold = nodes[i].color === GOLD || nodes[j].color === GOLD;
        ctx.beginPath();
        ctx.strokeStyle = isGold ? `rgba(212,175,55,${a * 0.75})` : `rgba(192,192,192,${a * 0.5})`;
        ctx.lineWidth = isGold ? 0.9 : 0.5;
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }

    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle  = n.color;
      ctx.shadowBlur = n.color === GOLD ? 10 : 6;
      ctx.shadowColor = n.color;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener('visibilitychange', () => { document.hidden ? cancelAnimationFrame(raf) : draw(); });
  window.addEventListener('resize', () => { clearTimeout(window._rt); window._rt = setTimeout(init, 200); });

  init(); draw();
})();


// ── 2. Cursor Glow Orb ────────────────────────────────────────────────────────
(function initCursorGlow() {
  const orb = document.createElement('div');
  Object.assign(orb.style, {
    position:'fixed', width:'300px', height:'300px',
    borderRadius:'50%', pointerEvents:'none', zIndex:'0',
    background:'radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)',
    transform:'translate(-50%,-50%)', willChange:'left,top',
  });
  document.body.appendChild(orb);
  let cx = -500, cy = -500, tx = -500, ty = -500;
  window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
    orb.style.left = cx + 'px'; orb.style.top = cy + 'px';
    requestAnimationFrame(loop);
  })();
})();


// ── 3. Tilt on .tilt-card ─────────────────────────────────────────────────────
(function initTilt() {
  const MAX = 8;

  function apply(card, e) {
    const r = card.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    card.style.transform = `perspective(900px) rotateX(${-ny * MAX}deg) rotateY(${nx * MAX}deg) scale(1.02)`;
    card.style.boxShadow = nx > 0
      ? '0 0 0 1px rgba(212,175,55,0.6), 0 0 28px rgba(212,175,55,0.2)'
      : '0 0 0 1px rgba(192,192,192,0.5), 0 0 24px rgba(192,192,192,0.15)';
  }

  function attach(card) {
    if (card._tilt) return;
    card._tilt = true;
    card.addEventListener('mousemove',  (e) => apply(card, e));
    card.addEventListener('mouseleave', ()  => { card.style.transform = ''; card.style.boxShadow = ''; });
  }

  document.querySelectorAll('.tilt-card').forEach(attach);
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) {
      if (n.classList?.contains('tilt-card')) attach(n);
      n.querySelectorAll?.('.tilt-card').forEach(attach);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();


// ── 4. Ripple on .btn ─────────────────────────────────────────────────────────
(function initRipple() {
  function ripple(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px;`;
    e.currentTarget.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }

  document.querySelectorAll('.btn').forEach((b) => b.addEventListener('click', ripple));
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) {
      if (n.classList?.contains('btn')) n.addEventListener('click', ripple);
      n.querySelectorAll?.('.btn').forEach((b) => b.addEventListener('click', ripple));
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
