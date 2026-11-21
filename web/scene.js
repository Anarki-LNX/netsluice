// The stage of the "Graphite" design: the devices of this network on one side, the
// world on the other, the sluice between them. Every lookup leaves the device that
// made it, is scanned in the gate, and either travels on or is blown apart.
//
// Drawn along a flow axis, so the same picture runs left to right on a wide screen
// and top to bottom on a phone.

const TAU = Math.PI * 2;
const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Icons, drawn in a box of 24 units around (0, 0). Lines only, one weight.
const ICONS = {
  phone: (c) => { rr(c, -5, -9, 10, 18, 2.4); c.moveTo(-1.6, 6); c.lineTo(1.6, 6); },
  tablet: (c) => { rr(c, -7.5, -9.5, 15, 19, 2.4); c.moveTo(-1.6, 6.6); c.lineTo(1.6, 6.6); },
  computer: (c) => { rr(c, -8, -7.5, 16, 11, 1.8); c.moveTo(-10.5, 6.5); c.lineTo(10.5, 6.5); },
  tv: (c) => { rr(c, -10, -7.5, 20, 12.5, 1.8); c.moveTo(-4.5, 8.5); c.lineTo(4.5, 8.5); c.moveTo(0, 5); c.lineTo(0, 8.5); },
  speaker: (c) => { rr(c, -5.5, -9.5, 11, 19, 3); c.moveTo(3, 3.2); c.arc(0, 3.2, 3, 0, TAU); c.moveTo(1.1, -5); c.arc(0, -5, 1.1, 0, TAU); },
  iot: (c) => { c.moveTo(-9, -1); c.lineTo(0, -9); c.lineTo(9, -1); c.moveTo(-6.5, -2.5); c.lineTo(-6.5, 8.5); c.lineTo(6.5, 8.5); c.lineTo(6.5, -2.5); c.moveTo(2.2, 3.4); c.arc(0, 3.4, 2.2, 0, TAU); },
  network: (c) => { rr(c, -9.5, 0, 19, 7.5, 2); c.moveTo(-5.5, 0); c.lineTo(-7.5, -8); c.moveTo(5.5, 0); c.lineTo(7.5, -8); c.moveTo(-4.4, 3.8); c.lineTo(-3.6, 3.8); c.moveTo(-.4, 3.8); c.lineTo(.4, 3.8); },
  printer: (c) => { rr(c, -9, -3, 18, 9, 1.8); c.moveTo(-5.5, -3); c.lineTo(-5.5, -9); c.lineTo(5.5, -9); c.lineTo(5.5, -3); c.moveTo(-5.5, 3); c.lineTo(-5.5, 9); c.lineTo(5.5, 9); c.lineTo(5.5, 3); },
  server: (c) => { rr(c, -8.5, -9, 17, 7.5, 1.8); rr(c, -8.5, 1.5, 17, 7.5, 1.8); c.moveTo(-5.4, -5.2); c.lineTo(-4.6, -5.2); c.moveTo(-5.4, 5.3); c.lineTo(-4.6, 5.3); },
  console: (c) => { rr(c, -10.5, -5.5, 21, 11, 5.5); c.moveTo(-6.5, -2.2); c.lineTo(-6.5, 2.2); c.moveTo(-8.7, 0); c.lineTo(-4.3, 0); c.moveTo(6.8, 0); c.arc(5.8, 0, 1, 0, TAU); },
  more: (c) => { for (const x of [-6, 0, 6]) { c.moveTo(x + 1.2, 0); c.arc(x, 0, 1.2, 0, TAU); } },
  unknown: (c) => { c.moveTo(8.5, 0); c.arc(0, 0, 8.5, 0, TAU); c.moveTo(1.2, 0); c.arc(0, 0, 1.2, 0, TAU); },
};
ICONS.vm = ICONS.server; ICONS.private = ICONS.phone; ICONS.self = ICONS.server;
function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// Dots spread evenly over a sphere; the globe is these, turning.
const GLOBE = (() => { const n = 620, pts = []; const g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), a = g * i; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); } return pts; })();

export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  const root = document.documentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('still');
  let W = 0, H = 0, dpr = 1, last = 0, vert = false, on = true, visible = true;
  let col = {};
  let nodes = [], byIp = new Map(), more = null;
  const packets = [], shards = [], rings = [], labels = [], sparks = [], hits = [];
  const TILT = .38;
  let spin = 0, gateFlash = 0, gateFlashV = 0, gateOk = 0;

  // ----- colours of the design, read from the page so dark and light both work
  function readColours() {
    const cs = getComputedStyle(root), probe = document.createElement('canvas').getContext('2d');
    const rgb = (name, fallback) => {
      probe.fillStyle = '#000'; probe.fillStyle = cs.getPropertyValue(name).trim() || fallback;
      const v = probe.fillStyle, m = /^#([0-9a-f]{6})$/i.exec(v);
      if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
      const p = /rgba?\(([^)]+)\)/.exec(v); return p ? p[1].split(',').slice(0, 3).map((x) => parseFloat(x)) : [128, 128, 128];
    };
    col = { text: rgb('--text', '#EDEEF0'), muted: rgb('--muted', '#8A8F98'), ok: rgb('--ok', '#3DD6A8'), no: rgb('--no', '#FF6464'),
      accent: rgb('--gold', '#8C92FF'), ground: rgb('--ground', '#0D0E11'), panel: rgb('--panel', '#15171B'), light: root.dataset.mode === 'light',
      font: cs.getPropertyValue('--body').trim() || 'system-ui, sans-serif' };
    if (still) draw(0);
  }
  const clock = () => performance.now();
  const A = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  new MutationObserver(readColours).observe(root, { attributes: true, attributeFilter: ['data-mode', 'style'] });

  // ----- where things stand: u runs along the flow (0 devices, 1 world), v across it (-1 .. 1)
  const P = (u, v) => (vert ? [W / 2 + v * W / 2, u * H] : [u * W, H / 2 + v * H / 2]);
  const along = () => (vert ? H : W), across = () => (vert ? W : H);
  const GATE = () => (vert ? .5 : .53), WORLD = () => (vert ? .86 : .825);
  const gateHalf = () => clamp(along() * .028, 22, 40);            // half the depth of the gate
  // the gate stands below the two figures and is shorter than the stage; the globe keeps
  // clear of the edge, glow included
  const GV = () => (vert ? 0 : .13), GS = () => (vert ? .92 : .64);        // centre and half height of the gate, in v
  const gvOf = (v, jitter = 0) => clamp(GV() + v * .3 + jitter, GV() - GS() * .62, GV() + GS() * .62);
  const globeR = () => Math.min(across() * (vert ? .2 : .235), along() * (vert ? .11 : .105), along() * (1 - WORLD()) / 1.62);

  function layout() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; vert = W < 680;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    place();
    if (still) draw(0);
  }

  let wanted = [], seats = [];        // seats: the devices on show, by address, in their order on the stage
  function place() {
    const room = vert ? Math.floor((W - 24) / 62) : Math.floor((H - 30) / 56);
    const max = clamp(room, 3, vert ? 5 : 11);
    const known = new Map(wanted.map((d) => [d.ip, d])), size = wanted.length > max ? max - 1 : wanted.length;
    // who sits keeps the seat; free seats go to the next in the order asked for
    seats = seats.filter((ip) => known.has(ip)).slice(0, size);
    for (const d of wanted) { if (seats.length >= size) break; if (!seats.includes(d.ip)) seats.push(d.ip); }
    const list = seats.map((ip) => known.get(ip));
    const rest = wanted.length - list.length;
    const old = byIp; byIp = new Map(); nodes = [];
    const all = rest > 0 ? [...list, { ip: '+', name: '+' + rest, kind: 'more' }] : list;
    all.forEach((d, i) => {
      const k = all.length === 1 ? 0 : (i / (all.length - 1)) * 2 - 1;        // -1 .. 1
      const v = k * .8, u = (vert ? .1 : .17) + (vert ? .02 : .035) * (1 - k * k) * -1 + (vert ? 0 : .02);
      const prev = old.get(d.ip);
      const n = { ...d, u, v, heat: prev ? prev.heat : 0, pulse: prev ? prev.pulse : 0, spoke: prev ? prev.spoke : 0 };
      nodes.push(n); byIp.set(d.ip, n);
    });
    more = byIp.get('+') || null;
  }

  // ----- packets
  function add(ev) {
    if (!W || still || !visible || document.hidden) return;
    let n = byIp.get(ev.client);
    if (!n) {
      // a device that is not on show speaks up: it takes the seat of the one that has been
      // quiet longest, so the stage shows who is talking now. Nobody else moves.
      const d = wanted.find((w) => w.ip === ev.client);
      const quiet = d && nodes.filter((x) => x.kind !== 'more' && x.heat < .05 && clock() - (x.spoke || 0) > 9000).sort((a, b) => (a.spoke || 0) - (b.spoke || 0))[0];
      if (quiet) {
        byIp.delete(quiet.ip); seats[seats.indexOf(quiet.ip)] = d.ip;
        Object.assign(quiet, d, { heat: 0, pulse: 0 }); byIp.set(d.ip, quiet); n = quiet;
      } else n = more;
    }
    if (!n || packets.length > 90) return;
    n.heat = 1; n.pulse = 1; n.spoke = clock();
    const gv = gvOf(n.v, (Math.random() - .5) * .14);
    packets.push({ n, gv, bad: !!ev.blocked && on, host: ev.host || '', phase: 'fly', t: 0, dur: .95 + Math.random() * .45,
      size: 2.6 + Math.random() * 1.2, trail: [] });
  }

  function quad(a, c, b, t) { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]]; }
  function burst(x, y, host) {
    const base = [vert ? 0 : -1, vert ? -1 : 0];                                  // debris falls back towards the devices
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * TAU, sp = 60 + Math.random() * 220;
      shards.push({ x, y, vx: Math.cos(a) * sp + base[0] * 90, vy: Math.sin(a) * sp + base[1] * 90, rot: Math.random() * TAU, vr: (Math.random() - .5) * 14, life: 0, ttl: .5 + Math.random() * .45, s: 2.5 + Math.random() * 4.5 });
    }
    for (let i = 0; i < 10; i++) { const a = Math.random() * TAU, sp = 140 + Math.random() * 260; sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, ttl: .28 + Math.random() * .2 }); }
    rings.push({ x, y, life: 0, ttl: .55, c: 'no', r: 46 }, { x, y, life: -.08, ttl: .5, c: 'no', r: 26 });
    if (host && labels.length < 5) labels.push({ x, y, text: host.length > 34 ? host.slice(0, 33) + '…' : host, life: 0, ttl: 1.9 });
    gateFlash = 1;
  }

  function step(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (W && visible && !document.hidden) {
      spin += dt * .16;
      gateFlash = Math.max(0, gateFlash - dt * 2.4); gateOk = Math.max(0, gateOk - dt * 3);
      for (const n of nodes) { n.heat = Math.max(0, n.heat - dt * .22); n.pulse = Math.max(0, n.pulse - dt * 1.6); }
      const g = GATE(), gh = gateHalf() / along(), R = globeR();
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i]; p.t += dt;
        const start = P(p.n.u, p.n.v), entry = P(g - gh, p.gv), exit = P(g + gh, p.gv);
        let pos;
        if (p.phase === 'fly') {
          const k = ease(Math.min(1, p.t / p.dur));
          pos = quad(start, P((p.n.u + g) / 2, p.n.v * .55 + p.gv * .45), entry, k);
          if (p.t >= p.dur) { p.phase = on ? 'scan' : 'leave'; p.t = 0; if (!on) p.dur = .9 + Math.random() * .3; }
        } else if (p.phase === 'scan') {
          const k = Math.min(1, p.t / .42);
          pos = [entry[0] + (exit[0] - entry[0]) * k * .5, entry[1] + (exit[1] - entry[1]) * k * .5];
          if (k >= 1) {
            if (p.bad) { burst(pos[0], pos[1], p.host); gateFlashV = p.gv; packets.splice(i, 1); continue; }
            p.phase = 'leave'; p.t = 0; p.dur = .85 + Math.random() * .4; p.from = pos; gateOk = 1; gateFlashV = p.gv;
          }
        } else {
          const k = ease(Math.min(1, p.t / p.dur));
          // each one comes down somewhere else on the side of the globe that faces us
          if (!p.land) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * .9; p.land = [Math.cos(a) * d, Math.sin(a) * d]; }
          const from = p.from || entry, c = P(WORLD(), GV() * .5);
          const target = [c[0] + p.land[0] * R, c[1] + p.land[1] * R];
          pos = quad(from, P((g + WORLD()) / 2, p.gv * .6 + p.land[1] * .2), target, k);
          if (p.t >= p.dur) {
            // remember the spot on the globe itself, so the mark turns with it
            const x = p.land[0], y = p.land[1], z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
            const ct = Math.cos(TILT), st = Math.sin(TILT), cs = Math.cos(spin), sn = Math.sin(spin), py = y * ct + z * st, z0 = -y * st + z * ct;
            hits.push({ p: [x * cs - z0 * sn, py, x * sn + z0 * cs], life: 0, ttl: 2.4, c: on ? 'ok' : 'muted' });
            if (hits.length > 60) hits.shift();
            packets.splice(i, 1); continue;
          }
        }
        p.trail.push(pos); if (p.trail.length > 9) p.trail.shift();
        p.x = pos[0]; p.y = pos[1];
      }
      for (let i = shards.length - 1; i >= 0; i--) { const s = shards[i]; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .93; s.vy *= .93; s.rot += s.vr * dt; if (s.life >= s.ttl) shards.splice(i, 1); }
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .9; s.vy *= .9; if (s.life >= s.ttl) sparks.splice(i, 1); }
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].life += dt; if (rings[i].life >= rings[i].ttl) rings.splice(i, 1); }
      for (let i = hits.length - 1; i >= 0; i--) { hits[i].life += dt; if (hits[i].life >= hits[i].ttl) hits.splice(i, 1); }
      for (let i = labels.length - 1; i >= 0; i--) { labels[i].life += dt; if (labels[i].life >= labels[i].ttl) labels.splice(i, 1); }
      draw(now);
    }
    requestAnimationFrame(step);
  }

  // ----- drawing
  function draw(now) {
    if (!W || !col.text) return;
    ctx.clearRect(0, 0, W, H);
    const g = GATE(), gh = gateHalf(), wc = P(WORLD(), GV() * .5), R = globeR(), v0 = GV() - GS(), v1 = GV() + GS();
    const gateCol = on ? col.accent : col.muted;

    // quiet lines: where a lookup of each device would travel
    ctx.lineWidth = 1;
    for (const n of nodes) {
      const a = P(n.u, n.v), b = P(g - gh / along(), gvOf(n.v));
      ctx.strokeStyle = A(col.text, .045 + n.heat * .09);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); const c = P((n.u + g) / 2, n.v * .55 + gvOf(n.v) * .45); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]); ctx.stroke();
    }

    // the world: a turning sphere of dots, lit from the side the lookups arrive at
    const halo = ctx.createRadialGradient(wc[0], wc[1], R * .7, wc[0], wc[1], R * 1.55);
    halo.addColorStop(0, A(col.accent, col.light ? .10 : .14)); halo.addColorStop(1, A(col.accent, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(wc[0], wc[1], R * 1.55, 0, TAU); ctx.fill();
    const cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(TILT), stt = Math.sin(TILT);
    for (const pt of GLOBE) {
      const x = pt[0] * cs + pt[2] * sn, z0 = -pt[0] * sn + pt[2] * cs, y = pt[1] * ct - z0 * stt, z = pt[1] * stt + z0 * ct;
      const front = z > 0, a = front ? .32 + z * .62 : .1;
      ctx.fillStyle = A(front ? col.text : col.muted, a * (col.light ? .8 : 1));
      const s = front ? 1.3 + z * 1.3 : 1;
      ctx.fillRect(wc[0] + x * R - s / 2, wc[1] + y * R - s / 2, s, s);
    }
    ctx.strokeStyle = A(col.text, .16); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(wc[0], wc[1], R + 7, 0, TAU); ctx.stroke();
    // where lookups came down: a ring that opens, and a point of light that turns away with the globe
    for (const h of hits) {
      const x = h.p[0] * cs + h.p[2] * sn, z0 = -h.p[0] * sn + h.p[2] * cs, y = h.p[1] * ct - z0 * stt, z = h.p[1] * stt + z0 * ct;
      if (z <= .02) continue;
      const k = h.life / h.ttl, hx = wc[0] + x * R, hy = wc[1] + y * R, c = col[h.c];
      if (h.life < .7) { const r = h.life / .7; ctx.strokeStyle = A(c, (1 - r) * .85); ctx.lineWidth = 1.8 * (1 - r) + .4; ctx.beginPath(); ctx.ellipse(hx, hy, (3 + ease(r) * 15) * (.35 + z * .65), 3 + ease(r) * 15, 0, 0, TAU); ctx.stroke(); }
      const gl = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9); gl.addColorStop(0, A(c, .55 * (1 - k) * z)); gl.addColorStop(1, A(c, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = A(c, (1 - k) * (.4 + z * .6)); ctx.beginPath(); ctx.arc(hx, hy, 1.9, 0, TAU); ctx.fill();
    }

    // the gate: two rails, a field between them, a line of light that never stops scanning
    const sweep = still ? 0 : Math.sin(now / 900) * .5 + .5;
    const rail = (du, flash) => {
      const a = P(g + du / along(), v0), b = P(g + du / along(), v1);
      const grad = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      grad.addColorStop(0, A(gateCol, 0)); grad.addColorStop(.12, A(gateCol, .85)); grad.addColorStop(.88, A(gateCol, .85)); grad.addColorStop(1, A(gateCol, 0));
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      if (flash > 0) { const f = P(g + du / along(), gateFlashV); const fg = ctx.createRadialGradient(f[0], f[1], 0, f[0], f[1], 70); fg.addColorStop(0, A(du < 0 ? col.no : col.ok, .55 * flash)); fg.addColorStop(1, A(du < 0 ? col.no : col.ok, 0)); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(f[0], f[1], 70, 0, TAU); ctx.fill(); }
    };
    const f0 = P(g - gh / along(), v0), f1 = P(g + gh / along(), v1);
    const field = vert ? ctx.createLinearGradient(0, f0[1], 0, f1[1]) : ctx.createLinearGradient(f0[0], 0, f1[0], 0);
    field.addColorStop(0, A(gateCol, .12)); field.addColorStop(.5, A(gateCol, .03)); field.addColorStop(1, A(gateCol, .12));
    ctx.fillStyle = field; ctx.fillRect(Math.min(f0[0], f1[0]), Math.min(f0[1], f1[1]), Math.abs(f1[0] - f0[0]), Math.abs(f1[1] - f0[1]));
    if (on) {
      const sv = GV() + (sweep * 2 - 1) * GS() * .97, s0 = P(g - gh / along(), sv), s1 = P(g + gh / along(), sv);
      const glow = vert ? ctx.createLinearGradient(s0[0] - 26, 0, s0[0] + 26, 0) : ctx.createLinearGradient(0, s0[1] - 26, 0, s0[1] + 26);
      glow.addColorStop(0, A(gateCol, 0)); glow.addColorStop(.5, A(gateCol, .3)); glow.addColorStop(1, A(gateCol, 0));
      ctx.fillStyle = glow;
      if (vert) ctx.fillRect(s0[0] - 26, Math.min(s0[1], s1[1]), 52, Math.abs(s1[1] - s0[1])); else ctx.fillRect(Math.min(s0[0], s1[0]), s0[1] - 26, Math.abs(s1[0] - s0[0]), 52);
      ctx.strokeStyle = A(gateCol, .95); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
    }
    rail(-gh, gateFlash); rail(gh, gateOk);

    // the devices
    const nr = clamp(across() / (vert ? 16 : 30), 15, 21);
    ctx.textBaseline = 'middle';
    for (const n of nodes) {
      const [x, y] = P(n.u, n.v), live = .45 + n.heat * .55;
      if (n.pulse > 0) { ctx.strokeStyle = A(col.accent, n.pulse * .6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, nr + (1 - n.pulse) * 16, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = A(col.panel, 1); ctx.beginPath(); ctx.arc(x, y, nr, 0, TAU); ctx.fill();
      ctx.strokeStyle = A(n.heat > .05 ? col.accent : col.text, n.heat > .05 ? .35 + n.heat * .5 : .16); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.save(); ctx.translate(x, y); ctx.scale(nr / 16, nr / 16);
      ctx.strokeStyle = A(col.text, live); ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); (ICONS[n.kind] || ICONS.unknown)(ctx); ctx.stroke(); ctx.restore();
      ctx.fillStyle = A(col.text, .5 + n.heat * .5); ctx.font = `${n.heat > .05 ? 600 : 500} 12.5px ${col.font}`;
      const name = n.name.length > 20 ? n.name.slice(0, 19) + '…' : n.name;
      if (vert) { ctx.textAlign = 'center'; ctx.fillText(name.length > 9 ? name.slice(0, 8) + '…' : name, x, y + nr + 13); }
      else { ctx.textAlign = 'right'; ctx.fillText(name, x - nr - 11, y); }
    }

    // the lookups on their way
    for (const p of packets) {
      if (p.x === undefined) continue;
      const c = p.phase === 'leave' ? (on ? col.ok : col.muted) : p.phase === 'scan' && p.t > .3 ? (p.bad ? col.no : col.ok) : col.accent;
      for (let i = 1; i < p.trail.length; i++) {
        ctx.strokeStyle = A(c, (i / p.trail.length) * .5); ctx.lineWidth = p.size * (i / p.trail.length) * 1.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.trail[i - 1][0], p.trail[i - 1][1]); ctx.lineTo(p.trail[i][0], p.trail[i][1]); ctx.stroke();
      }
      const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5); gl.addColorStop(0, A(c, .5)); gl.addColorStop(1, A(c, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, TAU); ctx.fill();
      ctx.fillStyle = A(c, 1); ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
      if (p.phase === 'scan') {                                    // the scanner closes in on it
        const k = Math.min(1, p.t / .42), r = 22 - k * 13;
        ctx.strokeStyle = A(k > .7 ? (p.bad ? col.no : col.ok) : col.accent, .9); ctx.lineWidth = 1.3;
        for (let q = 0; q < 4; q++) { const a0 = q * Math.PI / 2 + k * 2.2; ctx.beginPath(); ctx.arc(p.x, p.y, r, a0 + .25, a0 + Math.PI / 2 - .25); ctx.stroke(); }
      }
    }

    // what is left of a stopped one
    for (const r of rings) { if (r.life < 0) continue; const k = r.life / r.ttl; ctx.strokeStyle = A(col[r.c], (1 - k) * .8); ctx.lineWidth = 2.2 * (1 - k) + .4; ctx.beginPath(); ctx.arc(r.x, r.y, 3 + ease(k) * r.r, 0, TAU); ctx.stroke(); }
    for (const s of sparks) { const k = s.life / s.ttl; ctx.strokeStyle = A(col.no, 1 - k); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * .035, s.y - s.vy * .035); ctx.stroke(); }
    for (const s of shards) {
      const k = s.life / s.ttl; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillStyle = A(col.no, (1 - k) * .95);
      ctx.beginPath(); ctx.moveTo(-s.s, -s.s * .6); ctx.lineTo(s.s, 0); ctx.lineTo(-s.s * .4, s.s * .8); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.textAlign = 'center'; ctx.font = `600 12.5px ${col.font}`;
    for (const l of labels) {
      const k = l.life / l.ttl, a = k < .12 ? k / .12 : 1 - Math.max(0, (k - .55) / .45), y = l.y - 30 - k * 26;
      const w = ctx.measureText(l.text).width + 18, x = clamp(l.x, w / 2 + 6, W - w / 2 - 6);
      ctx.fillStyle = A(col.panel, .92 * a); ctx.beginPath(); rr(ctx, x - w / 2, y - 11, w, 22, 11); ctx.fill();
      ctx.strokeStyle = A(col.no, .55 * a); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = A(col.no, a); ctx.fillText(l.text, x, y + .5);
    }
  }

  readColours();
  new ResizeObserver(layout).observe(canvas);
  layout();
  if (!still) requestAnimationFrame(step);

  return {
    add,
    // the devices to show, the busiest first: [{ ip, name, kind }]
    setDevices(list) { const sig = list.map((d) => d.ip + d.name + d.kind).join('|'); if (sig === wanted.sig) return; wanted = list; wanted.sig = sig; place(); if (still) draw(0); },
    setOn(v) { if (on !== !!v) { on = !!v; if (still) draw(0); } },
    setVisible(v) { visible = !!v; },
    // which device stands at this place of the window: its address, '+' for the rest, or null
    pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect(), x = clientX - r.left, y = clientY - r.top, nr = clamp(across() / (vert ? 16 : 30), 15, 21) + 8;
      for (const n of nodes) { const [nx, ny] = P(n.u, n.v); if (Math.hypot(x - nx, y - ny) <= nr) return n.ip; }
      return null;
    },
    shown() { return seats.slice(); },                       // the addresses on show, in their order
  };
}
