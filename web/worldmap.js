// The world map: packets leave home in blue, turn green on the way to the
// country that answers, or burst in red when the filter stopped them.
// Countries are tinted by how much traffic they get and how much of it was stopped.

const BLUE = [78, 168, 255], GREEN = [92, 227, 154], RED = [255, 90, 90], GOLD = accent(), LAND = [157, 191, 198];
function accent() { const m = /^#([0-9a-f]{6})$/i.exec(getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : [245, 196, 81]; }
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));

// Equal Earth projection (Šavrič, Patterson, Jenny 2018)
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
function project(lon, lat) {
  const l = lon * Math.PI / 180, th = Math.asin(M * Math.sin(lat * Math.PI / 180)), t2 = th * th, t6 = t2 * t2 * t2;
  return [l * Math.cos(th) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
}
const X_MAX = project(180, 0)[0], Y_TOP = project(0, 84)[1], Y_BOT = project(0, -57)[1];

function decode(topo) {
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map((arc) => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; }); });
  const ring = (ids) => { const pts = []; for (const i of ids) { const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i]; for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k]); } return pts; };
  return topo.objects.countries.geometries.filter((g) => g.id !== '010').map((g) => ({
    id: g.id, name: g.properties && g.properties.name,
    polys: (g.type === 'Polygon' ? [g.arcs] : g.arcs).map((poly) => poly.map(ring)),
  }));
}

export async function createWorldMap(canvas, tip, opts = {}) {
  const [topo, iso] = await Promise.all([fetch('data/countries-110m.json').then((r) => r.json()), fetch('data/iso.json').then((r) => r.json())]);
  const countries = decode(topo);
  const byNum = new Map(countries.map((c) => [c.id, c]));
  const byA2 = new Map();
  for (const [a2, num] of Object.entries(iso)) if (byNum.has(num)) { byNum.get(num).a2 = a2; byA2.set(a2, byNum.get(num)); }

  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('still');
  let W = 0, H = 0, dpr = 1, last = 0, data = {}, max = 1, homeA2 = null, hover = null;
  const packets = [], shards = [], rings = [], ghosts = [];

  function layout() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 10, s = Math.min((W - 2 * pad) / (2 * X_MAX), (H - 2 * pad) / (Y_TOP - Y_BOT));
    const ox = W / 2, oy = pad + (H - 2 * pad - s * (Y_TOP - Y_BOT)) / 2 + s * Y_TOP;
    const P = (lon, lat) => { const [x, y] = project(lon, lat); return [ox + x * s, oy - y * s]; };
    for (const c of countries) {
      const path = new Path2D(); let best = 0;
      for (const poly of c.polys) {
        poly.forEach((rg, ri) => {
          const pts = rg.map(([lo, la]) => P(lo, la));
          // A ring that crosses the date line would draw a streak across the whole map:
          // lift the pen whenever the longitude jumps to the other side.
          let open = false;
          pts.forEach(([x, y], i) => {
            const jump = i > 0 && Math.abs(rg[i][0] - rg[i - 1][0]) > 180;
            if (i && !jump) path.lineTo(x, y); else { if (open && !jump) path.closePath(); path.moveTo(x, y); open = true; }
          });
          if (!rg.some((p, i) => i > 0 && Math.abs(p[0] - rg[i - 1][0]) > 180)) path.closePath();
          if (ri) return;                         // holes do not count for the centre
          let a = 0, cx = 0, cy = 0;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const f = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; a += f; cx += (pts[j][0] + pts[i][0]) * f; cy += (pts[j][1] + pts[i][1]) * f; }
          if (Math.abs(a) > best) { best = Math.abs(a); c.cx = cx / (3 * a); c.cy = cy / (3 * a); }
        });
      }
      c.path = path;
    }
    if (still) draw(0);
  }

  const home = () => { const c = byA2.get(homeA2); return c ? [c.cx, c.cy] : [W / 2, H * 0.36]; };
  function curve(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d, ny = dx / d; if (ny > 0) { nx = -nx; ny = -ny; }           // always arc upwards
    return { x0, y0, x1, y1, cx: (x0 + x1) / 2 + nx * d * 0.28, cy: (y0 + y1) / 2 + ny * d * 0.28, d };
  }
  const at = (q, t) => { const u = 1 - t; return [u * u * q.x0 + 2 * u * t * q.cx + t * t * q.x1, u * u * q.y0 + 2 * u * t * q.cy + t * t * q.y1]; };

  function setData(counts, homeCode) {
    data = counts || {}; homeA2 = homeCode || homeA2;
    max = Math.max(1, ...Object.values(data).map(([a, b]) => a + b));
    if (still) draw(0);
  }

  function addEvent(ev) {
    const c = byA2.get(ev.cc);
    if (still || !c || !W || packets.length > 160) return;
    const [hx, hy] = home();
    const local = ev.cc === homeA2, j = () => (Math.random() - .5) * (local ? 26 : 10);
    const q = curve(hx, hy, c.cx + j(), c.cy + j());
    packets.push({ q, c, bad: !!ev.blocked, t: 0, dur: .9 + Math.min(1.9, q.d / 330) + Math.random() * .3, stop: .34 + Math.random() * .2 });
  }

  function burst(x, y) {
    for (let i = 0, n = 10 + Math.floor(Math.random() * 6); i < n; i++) {
      const a = Math.random() * 6.283, s = 40 + Math.random() * 150;
      shards.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 14, size: 1.6 + Math.random() * 2.8, life: 0, ttl: .4 + Math.random() * .4 });
    }
    rings.push({ x, y, life: 0, ttl: .5, c: RED, r: 26 });
  }

  function dot(x, y, r, c, a = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5);
    g.addColorStop(0, rgba(c, .5 * a)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4.5, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const [hx, hy] = home();
    // land
    for (const c of countries) {
      const v = c.a2 && data[c.a2], total = v ? v[0] + v[1] : 0;
      if (total) {
        const k = Math.log1p(total) / Math.log1p(max), col = mix(GREEN, RED, Math.pow(v[1] / total, .7));
        ctx.fillStyle = rgba(col, .14 + .5 * k); ctx.fill(c.path);
        ctx.strokeStyle = rgba(col, .55 + .35 * k); ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = rgba(LAND, .07); ctx.fill(c.path);
        ctx.strokeStyle = rgba(LAND, .20); ctx.lineWidth = .6;
      }
      ctx.stroke(c.path);
      if (c.flash > 0) { ctx.fillStyle = rgba(c.flashCol || GREEN, .45 * c.flash); ctx.fill(c.path); }
      if (c === hover) { ctx.strokeStyle = rgba([255, 255, 255], .9); ctx.lineWidth = 1.4; ctx.stroke(c.path); }
    }
    const hc = byA2.get(homeA2);
    if (hc) { ctx.strokeStyle = rgba(GOLD, .95); ctx.lineWidth = 1.6; ctx.stroke(hc.path); }

    // standing routes to every country that got traffic
    for (const [a2, v] of Object.entries(data)) {
      const c = byA2.get(a2); if (!c || a2 === homeA2) continue;
      const k = Math.log1p(v[0] + v[1]) / Math.log1p(max), q = curve(hx, hy, c.cx, c.cy);
      ctx.strokeStyle = rgba(mix(GREEN, RED, v[1] / (v[0] + v[1])), .10 + .22 * k); ctx.lineWidth = .8 + 1.2 * k;
      ctx.beginPath(); ctx.moveTo(q.x0, q.y0); ctx.quadraticCurveTo(q.cx, q.cy, q.x1, q.y1); ctx.stroke();
      dot(c.cx, c.cy, 1.6 + 1.6 * k, mix(GREEN, RED, v[1] / (v[0] + v[1])), .9);
    }

    // where a stopped packet wanted to go
    for (const g of ghosts) {
      ctx.setLineDash([2, 5]); ctx.strokeStyle = rgba(RED, .5 * (1 - g.life / g.ttl)); ctx.lineWidth = 1.1;
      ctx.beginPath(); const [sx, sy] = at(g.q, g.from); ctx.moveTo(sx, sy);
      for (let i = 1; i <= 14; i++) { const [x, y] = at(g.q, g.from + (1 - g.from) * i / 14); ctx.lineTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
    }
    for (const r of rings) { const k = r.life / r.ttl; ctx.strokeStyle = rgba(r.c, (1 - k) * .85); ctx.lineWidth = 2 * (1 - k) + .5; ctx.beginPath(); ctx.arc(r.x, r.y, 3 + k * r.r, 0, 6.283); ctx.stroke(); }
    for (const s of shards) {
      const k = s.life / s.ttl; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      ctx.fillStyle = rgba(mix(RED, GOLD, k * .6), 1 - k);
      ctx.beginPath(); ctx.moveTo(-s.size, s.size * .7); ctx.lineTo(s.size, 0); ctx.lineTo(-s.size, -s.size * .7); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (const p of packets) {
      const col = p.bad ? mix(BLUE, RED, Math.min(1, p.t / (p.stop * .7))) : mix(BLUE, GREEN, Math.min(1, p.t * 1.6));
      ctx.lineCap = 'round';
      for (let i = 8; i >= 1; i--) {                      // tail
        const ta = Math.max(0, p.t - i * .018), tb = Math.max(0, p.t - (i - 1) * .018);
        const [ax, ay] = at(p.q, ta), [bx, by] = at(p.q, tb);
        ctx.strokeStyle = rgba(col, .55 * (1 - i / 9)); ctx.lineWidth = 2.6 * (1 - i / 10);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      const [x, y] = at(p.q, p.t); dot(x, y, 2.4, col);
    }

    // home
    const pulse = still ? .5 : .5 + .5 * Math.sin(now / 420);
    ctx.strokeStyle = rgba(GOLD, .5 * (1 - pulse)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, 6 + pulse * 12, 0, 6.283); ctx.stroke();
    dot(hx, hy, 4, GOLD);

    // names of the busiest countries
    ctx.font = '600 11px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    Object.entries(data).sort((a, b) => (b[1][0] + b[1][1]) - (a[1][0] + a[1][1])).slice(0, 6).forEach(([a2, v]) => {
      const c = byA2.get(a2); if (!c || a2 === homeA2) return;
      ctx.fillStyle = 'rgba(234,246,247,.92)'; ctx.fillText(`${a2} ${(v[0] + v[1]).toLocaleString()}`, c.cx, c.cy - 7);
    });
  }

  function step(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (W && !document.hidden && canvas.offsetParent !== null) {
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i]; p.t += dt / p.dur;
        if (p.bad && p.t >= p.stop) {
          const [x, y] = at(p.q, p.stop); burst(x, y); ghosts.push({ q: p.q, from: p.stop, life: 0, ttl: 1.1 });
          p.c.flash = 1; p.c.flashCol = RED; packets.splice(i, 1);
        } else if (p.t >= 1) {
          rings.push({ x: p.q.x1, y: p.q.y1, life: 0, ttl: .6, c: GREEN, r: 16 }); p.c.flash = 1; p.c.flashCol = GREEN; packets.splice(i, 1);
        }
      }
      for (let i = shards.length - 1; i >= 0; i--) { const s = shards[i]; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .94; s.vy = s.vy * .94 + 150 * dt; s.rot += s.vr * dt; if (s.life >= s.ttl) shards.splice(i, 1); }
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].life += dt; if (rings[i].life >= rings[i].ttl) rings.splice(i, 1); }
      for (let i = ghosts.length - 1; i >= 0; i--) { ghosts[i].life += dt; if (ghosts[i].life >= ghosts[i].ttl) ghosts.splice(i, 1); }
      for (const c of countries) if (c.flash > 0) c.flash = Math.max(0, c.flash - dt * 1.8);
      draw(now);
    }
    requestAnimationFrame(step);
  }

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr;
    hover = countries.find((c) => c.path && ctx.isPointInPath(c.path, x, y)) || null;
    if (tip) {
      if (hover && hover.a2) {
        const v = data[hover.a2] || [0, 0];
        tip.hidden = false; tip.textContent = opts.label ? opts.label(hover.a2, v[0], v[1]) : `${hover.a2}: ${v[0]} / ${v[1]}`;
        // the mouse is measured on the screen, the label is placed inside a page that may be drawn smaller
        const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
        tip.style.left = Math.min(W - 180, e.clientX - r.left + 14) / z + 'px'; tip.style.top = (e.clientY - r.top + 14) / z + 'px';
      } else tip.hidden = true;
    }
    if (still) draw(0);
  });
  canvas.addEventListener('mouseleave', () => { hover = null; if (tip) tip.hidden = true; if (still) draw(0); });

  new ResizeObserver(layout).observe(canvas);
  layout();
  if (!still) requestAnimationFrame(step);
  return { setData, addEvent, layout, frame: (now) => { layout(); draw(now || 0); }, known: (a2) => byA2.has(a2) };
}
