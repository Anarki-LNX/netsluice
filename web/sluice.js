// The sluice: requests arrive blue from the home network, are inspected inside
// the chamber, and either leave green towards the internet or burst in red.

const BLUE = [78, 168, 255], GREEN = [92, 227, 154], RED = [255, 90, 90], GOLD = accent();
function accent() { const m = /^#([0-9a-f]{6})$/i.exec(getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : [245, 196, 81]; }
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));

export function createSluice(canvas) {
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('still');
  let W = 0, H = 0, dpr = 1, last = 0;
  const dots = [], shards = [], rings = [];
  const MAX = 140;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (still) draw(0);
  }

  // Chamber geometry, as fractions of the width.
  const X0 = 0.34, X1 = 0.66;

  function add(kind) {
    if (still || !W || dots.length >= MAX) return;
    dots.push({
      x: -8, y: H * (0.16 + Math.random() * 0.68), v: 90 + Math.random() * 70, r: 3.2 + Math.random() * 1.4,
      bad: kind === 'no', decideAt: W * (X0 + 0.07 + Math.random() * (X1 - X0 - 0.14)),
      phase: 'in', t: 0, wob: Math.random() * 6.28,
    });
  }

  function burst(d) {
    const n = 12 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, s = 60 + Math.random() * 190;
      shards.push({ x: d.x, y: d.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 14, size: 2 + Math.random() * 3.5, life: 0, ttl: .45 + Math.random() * .4 });
    }
    rings.push({ x: d.x, y: d.y, life: 0, ttl: .5 });
  }

  function glow(x, y, r, c, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, rgba(c, .55 * a)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }

  function gate(x, now, flip) {
    // an energy curtain between two solid posts
    const pulse = .5 + .5 * Math.sin(now / 520 + (flip ? 1.7 : 0));
    const g = ctx.createLinearGradient(x - 14, 0, x + 14, 0);
    g.addColorStop(0, rgba(GOLD, 0)); g.addColorStop(.5, rgba(GOLD, .16 + .14 * pulse)); g.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 14, 10, 28, H - 20);
    ctx.fillStyle = rgba(GOLD, .95);
    ctx.fillRect(x - 3, 6, 6, 16); ctx.fillRect(x - 3, H - 22, 6, 16);
    ctx.fillStyle = rgba(GOLD, .35 + .3 * pulse); ctx.fillRect(x - 1, 22, 2, H - 44);
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const x0 = W * X0, x1 = W * X1;

    // chamber
    const cg = ctx.createLinearGradient(x0, 0, x1, 0);
    cg.addColorStop(0, rgba(GOLD, .10)); cg.addColorStop(.5, rgba(GOLD, .04)); cg.addColorStop(1, rgba(GOLD, .10));
    ctx.fillStyle = cg; ctx.fillRect(x0, 8, x1 - x0, H - 16);
    ctx.fillStyle = rgba(GOLD, .8); ctx.fillRect(x0, 6, x1 - x0, 3); ctx.fillRect(x0, H - 9, x1 - x0, 3);
    // scanning beam sweeping through the chamber
    if (!still) {
      const sx = x0 + (x1 - x0) * (.5 + .46 * Math.sin(now / 900));
      const sg = ctx.createLinearGradient(sx - 22, 0, sx + 22, 0);
      sg.addColorStop(0, rgba(GOLD, 0)); sg.addColorStop(.5, rgba(GOLD, .22)); sg.addColorStop(1, rgba(GOLD, 0));
      ctx.fillStyle = sg; ctx.fillRect(sx - 22, 9, 44, H - 18);
    }
    gate(x0, now, false); gate(x1, now, true);

    for (const r of rings) {
      const k = r.life / r.ttl;
      ctx.strokeStyle = rgba(RED, (1 - k) * .8); ctx.lineWidth = 2 * (1 - k) + .5;
      ctx.beginPath(); ctx.arc(r.x, r.y, 4 + k * 34, 0, 6.283); ctx.stroke();
    }
    for (const s of shards) {
      const k = s.life / s.ttl;
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      ctx.fillStyle = rgba(mix(RED, GOLD, k * .6), 1 - k);
      ctx.beginPath(); ctx.moveTo(-s.size, s.size * .7); ctx.lineTo(s.size, 0); ctx.lineTo(-s.size, -s.size * .7); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (const d of dots) {
      let c = BLUE, r = d.r, a = 1, x = d.x, y = d.y;
      if (d.phase === 'pass') c = mix(BLUE, GREEN, Math.min(1, d.t / .35));
      if (d.phase === 'caught') {
        const k = Math.min(1, d.t / .42);
        c = mix(BLUE, RED, Math.min(1, k * 2.2)); r = d.r * (1 + k * 1.3);
        x += Math.sin(d.t * 70) * 2.2 * k; y += Math.cos(d.t * 83) * 2.2 * k;
      }
      // short tail
      ctx.strokeStyle = rgba(c, .28); ctx.lineWidth = r * 1.1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - (d.phase === 'caught' ? 0 : d.v * .09), y); ctx.lineTo(x, y); ctx.stroke();
      glow(x, y, r, c, a);
    }
  }

  function step(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (W && !document.hidden) {
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i]; d.t += dt;
        if (d.phase === 'in') {
          d.x += d.v * dt; d.y += Math.sin(now / 400 + d.wob) * 6 * dt;
          if (d.x >= d.decideAt) { d.phase = d.bad ? 'caught' : 'pass'; d.t = 0; if (!d.bad) d.v *= 1.35; }
        } else if (d.phase === 'pass') {
          d.x += d.v * dt;
          if (d.x > W + 12) dots.splice(i, 1);
        } else if (d.t > .42) { burst(d); dots.splice(i, 1); }
      }
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i]; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .94; s.vy = s.vy * .94 + 180 * dt; s.rot += s.vr * dt;
        if (s.life >= s.ttl) shards.splice(i, 1);
      }
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].life += dt; if (rings[i].life >= rings[i].ttl) rings.splice(i, 1); }
      draw(now);
    }
    requestAnimationFrame(step);
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  if (!still) requestAnimationFrame(step);
  return { add };
}
