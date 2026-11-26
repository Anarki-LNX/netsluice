// Hero drawing: a dotted globe turning slowly, lookups arriving in blue, the gold
// sluice gate in front of it. Green ones travel on and come down on the globe,
// red ones burst at the gate. Purely decorative (the canvas is aria-hidden) and
// not real data. Paused while off screen or in a background tab; one still frame
// under prefers-reduced-motion.

type RGB = readonly [number, number, number];
const BLUE: RGB = [78, 168, 255];
const GREEN: RGB = [92, 227, 154];
const RED: RGB = [255, 90, 90];
const GOLD: RGB = [245, 196, 81];
const WATER: RGB = [103, 216, 232];
const TAU = Math.PI * 2;

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// a deterministic random, so the still frame is the same every time
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// points spread evenly over a sphere
const SPHERE: [number, number, number][] = (() => {
  const n = 820;
  const g = Math.PI * (3 - Math.sqrt(5));
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = g * i;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return pts;
})();

interface Lookup {
  a: number; // position along the flow, px
  c: number; // position across, px
  v: number; // speed, px/s
  r: number;
  bad: boolean;
  phase: 'in' | 'caught' | 'pass';
  t: number;
  // pass: flight to the globe
  from?: [number, number];
  ctrl?: [number, number];
  lat?: number;
  lon?: number;
  dur?: number;
}
interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  s: number;
  rot: number;
  vr: number;
}
interface Mark {
  lat: number;
  lon: number;
  life: number;
  ttl: number;
}
interface Ring {
  x: number;
  y: number;
  life: number;
  ttl: number;
  c: RGB;
  r: number;
}

export function mountHero(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let still = reduce.matches;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let vert = false;
  let running = false;
  let onScreen = true;
  let raf = 0;
  let last = 0;
  let spin = 0.6;
  let spawnIn = 0;
  let gateFlash = 0;
  let rand = Math.random;

  const lookups: Lookup[] = [];
  const shards: Shard[] = [];
  const marks: Mark[] = [];
  const rings: Ring[] = [];

  // geometry
  let cx = 0;
  let cy = 0;
  let R = 0;
  let gate = 0; // gate position along the flow
  let gateHalf = 0; // half its length across
  let mid = 0; // centre across
  let start = 0; // where lookups appear along the flow
  const TILT = 0.36;

  const P = (a: number, c: number): [number, number] => (vert ? [c, a] : [a, c]);

  function layout() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    vert = W / H < 1.1;
    const startFrac = parseFloat(getComputedStyle(canvas).getPropertyValue('--hero-start')) || 0.04;
    if (!vert) {
      R = Math.min(H * 0.41, W * 0.27);
      cx = W - R - Math.max(W * 0.05, 24);
      cy = H * 0.53;
      gate = cx - R - Math.max(60, W * 0.06);
      gateHalf = R * 0.78;
      mid = cy;
      start = Math.min(W * startFrac, gate - 140);
    } else {
      R = Math.min(W * 0.4, H * 0.3);
      cx = W * 0.5;
      cy = H - R - H * 0.06;
      gate = cy - R - Math.max(36, H * 0.07);
      gateHalf = Math.min(R * 0.95, W * 0.4);
      mid = cx;
      start = H * 0.02;
    }
    if (still) drawStill();
  }

  // ----- the globe
  function project(lat: number, lon: number): [number, number, number] {
    // lat/lon in radians on the unit sphere, turned by spin, tilted
    const x0 = Math.cos(lat) * Math.cos(lon + spin);
    const y0 = Math.sin(lat);
    const z0 = Math.cos(lat) * Math.sin(lon + spin);
    const y = y0 * Math.cos(TILT) - z0 * Math.sin(TILT);
    const z = y0 * Math.sin(TILT) + z0 * Math.cos(TILT);
    return [cx + x0 * R, cy - y * R, z];
  }

  function drawGlobe() {
    const c = ctx!;
    // atmosphere
    const halo = c.createRadialGradient(cx, cy, R * 0.35, cx, cy, R * 1.65);
    halo.addColorStop(0, 'rgba(40,90,190,0.22)');
    halo.addColorStop(0.55, 'rgba(30,70,160,0.10)');
    halo.addColorStop(1, 'rgba(10,30,60,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(cx, cy, R * 1.65, 0, TAU);
    c.fill();
    // body
    const body = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, 'rgba(60,120,220,0.20)');
    body.addColorStop(1, 'rgba(8,24,48,0.55)');
    c.fillStyle = body;
    c.beginPath();
    c.arc(cx, cy, R, 0, TAU);
    c.fill();
    // rim light
    c.strokeStyle = rgba(WATER, 0.22);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(cx, cy, R, 0, TAU);
    c.stroke();

    // a few meridians and parallels, very faint (the wireframe of reference 3)
    c.lineWidth = 0.8;
    for (let m = 0; m < 6; m++) {
      const lon = (m / 6) * Math.PI;
      c.beginPath();
      let drawing = false;
      for (let k = 0; k <= 48; k++) {
        const lat = -Math.PI / 2 + (k / 48) * Math.PI;
        const [x, y, z] = project(lat, lon);
        if (z < 0) {
          drawing = false;
          continue;
        }
        if (!drawing) c.moveTo(x, y);
        else c.lineTo(x, y);
        drawing = true;
      }
      c.strokeStyle = rgba(BLUE, 0.1);
      c.stroke();
      c.beginPath();
      drawing = false;
      for (let k = 0; k <= 48; k++) {
        const lat = -Math.PI / 2 + (k / 48) * Math.PI;
        const [x, y, z] = project(lat, lon + Math.PI);
        if (z < 0) {
          drawing = false;
          continue;
        }
        if (!drawing) c.moveTo(x, y);
        else c.lineTo(x, y);
        drawing = true;
      }
      c.stroke();
    }
    for (const latDeg of [-60, -30, 0, 30, 60]) {
      const lat = (latDeg * Math.PI) / 180;
      c.beginPath();
      let drawing = false;
      for (let k = 0; k <= 64; k++) {
        const [x, y, z] = project(lat, (k / 64) * TAU);
        if (z < 0) {
          drawing = false;
          continue;
        }
        if (!drawing) c.moveTo(x, y);
        else c.lineTo(x, y);
        drawing = true;
      }
      c.strokeStyle = rgba(BLUE, latDeg === 0 ? 0.16 : 0.09);
      c.stroke();
    }

    // the dots
    const cosS = Math.cos(spin);
    const sinS = Math.sin(spin);
    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);
    for (const [px, py, pz] of SPHERE) {
      const x0 = px * cosS - pz * sinS;
      const z0 = px * sinS + pz * cosS;
      const y = py * cosT - z0 * sinT;
      const z = py * sinT + z0 * cosT;
      if (z < -0.15) continue;
      const depth = (z + 0.15) / 1.15;
      const a = 0.16 + depth * 0.72;
      const size = 0.7 + depth * 1.3;
      c.fillStyle = rgba(mix(BLUE, WATER, depth * 0.6), a);
      c.fillRect(cx + x0 * R - size / 2, cy - y * R - size / 2, size, size);
    }

    // where lookups came down
    for (const m of marks) {
      const [x, y, z] = project(m.lat, m.lon);
      if (z < 0) continue;
      const k = m.life / m.ttl;
      const a = (1 - k) * (0.4 + z * 0.6);
      glow(x, y, 1.8, GREEN, a);
    }
  }

  // ----- the gate
  function drawGate(now: number) {
    const c = ctx!;
    const pulse = 0.5 + 0.5 * Math.sin(now / 900);
    const flash = gateFlash;
    const [x0, y0] = P(gate, mid - gateHalf);
    const [x1, y1] = P(gate, mid + gateHalf);
    // curtain
    const w = 26;
    const g = vert
      ? c.createLinearGradient(0, gate - w, 0, gate + w)
      : c.createLinearGradient(gate - w, 0, gate + w, 0);
    g.addColorStop(0, rgba(GOLD, 0));
    g.addColorStop(0.5, rgba(GOLD, 0.08 + 0.06 * pulse + 0.18 * flash));
    g.addColorStop(1, rgba(GOLD, 0));
    c.fillStyle = g;
    if (vert) c.fillRect(x0, gate - w, x1 - x0, w * 2);
    else c.fillRect(gate - w, y0, w * 2, y1 - y0);
    // the line
    const lg = vert ? c.createLinearGradient(x0, 0, x1, 0) : c.createLinearGradient(0, y0, 0, y1);
    lg.addColorStop(0, rgba(GOLD, 0.15));
    lg.addColorStop(0.5, rgba(GOLD, 0.55 + 0.2 * pulse + 0.25 * flash));
    lg.addColorStop(1, rgba(GOLD, 0.15));
    c.strokeStyle = lg;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    // posts
    c.fillStyle = rgba(GOLD, 0.95);
    const post = (x: number, y: number) => {
      if (vert) c.fillRect(x - 7, y - 2.5, 14, 5);
      else c.fillRect(x - 2.5, y - 7, 5, 14);
    };
    post(x0, y0);
    post(x1, y1);
  }

  function glow(x: number, y: number, r: number, col: RGB, a: number) {
    const c = ctx!;
    const g = c.createRadialGradient(x, y, 0, x, y, r * 4.5);
    g.addColorStop(0, rgba(col, 0.5 * a));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r * 4.5, 0, TAU);
    c.fill();
    c.fillStyle = rgba(col, a);
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }

  // ----- lookups
  function spawn() {
    if (lookups.length > 60) return;
    const across = mid + (rand() * 2 - 1) * gateHalf * 0.78;
    lookups.push({
      a: start - 10,
      c: across,
      v: 70 + rand() * 50,
      r: 2 + rand() * 1,
      bad: rand() < 0.2,
      phase: 'in',
      t: 0,
    });
  }

  function decide(l: Lookup) {
    if (l.bad) {
      l.phase = 'caught';
      l.t = 0;
      return;
    }
    l.phase = 'pass';
    l.t = 0;
    // pick a spot on the front of the globe, roughly facing the gate
    const [lat, lon] = landing();
    l.lat = lat;
    l.lon = lon;
    l.from = P(l.a, l.c);
    const [tx, ty] = project(lat, lon);
    const [fx, fy] = l.from;
    const lift = vert ? [((fx + tx) / 2 - cx) * 0.3, 0] : [0, ((fy + ty) / 2 - cy) * 0.3];
    l.ctrl = [(fx + tx) / 2 + (lift[0] ?? 0), (fy + ty) / 2 + (lift[1] ?? 0)];
    l.dur = 0.9 + rand() * 0.5;
  }

  // a spot on the side of the globe that faces the gate (and the viewer)
  function landing(): [number, number] {
    if (vert) return [0.25 + rand() * 0.8, -spin + Math.PI / 2 + (rand() * 2 - 1) * 0.9];
    return [(rand() * 2 - 1) * 0.75, -spin + 2.25 + (rand() * 2 - 1) * 0.55];
  }

  function burst(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const ang = rand() * TAU;
      const sp = 40 + rand() * 140;
      shards.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0,
        ttl: 0.45 + rand() * 0.4,
        s: 1.5 + rand() * 2.5,
        rot: rand() * TAU,
        vr: (rand() - 0.5) * 12,
      });
    }
    rings.push({ x, y, life: 0, ttl: 0.6, c: RED, r: 26 });
    gateFlash = 1;
  }

  function step(dt: number) {
    spin += dt * 0.06;
    gateFlash = Math.max(0, gateFlash - dt * 2.2);
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawn();
      spawnIn = 0.22 + rand() * 0.35;
    }
    for (let i = lookups.length - 1; i >= 0; i--) {
      const l = lookups[i]!;
      l.t += dt;
      if (l.phase === 'in') {
        l.a += l.v * dt;
        l.c += Math.sin(l.t * 2 + l.r) * 4 * dt;
        if (l.a >= gate) decide(l);
      } else if (l.phase === 'caught') {
        if (l.t > 0.38) {
          const [x, y] = P(l.a, l.c);
          burst(x, y);
          lookups.splice(i, 1);
        }
      } else if (l.t >= (l.dur ?? 1)) {
        marks.push({ lat: l.lat ?? 0, lon: l.lon ?? 0, life: 0, ttl: 3.2 });
        const [x, y] = project(l.lat ?? 0, l.lon ?? 0);
        rings.push({ x, y, life: 0, ttl: 0.7, c: GREEN, r: 14 });
        lookups.splice(i, 1);
      }
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i]!;
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.94;
      s.vy = s.vy * 0.94 + 60 * dt;
      s.rot += s.vr * dt;
      if (s.life >= s.ttl) shards.splice(i, 1);
    }
    for (let i = marks.length - 1; i >= 0; i--) {
      marks[i]!.life += dt;
      if (marks[i]!.life >= marks[i]!.ttl) marks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i]!.life += dt;
      if (rings[i]!.life >= rings[i]!.ttl) rings.splice(i, 1);
    }
  }

  function drawLookups() {
    const c = ctx!;
    const fadeLen = Math.max(60, (gate - start) * 0.45);
    for (const l of lookups) {
      if (l.phase === 'pass' && l.from && l.ctrl && l.lat !== undefined && l.lon !== undefined) {
        const k = clamp(l.t / (l.dur ?? 1), 0, 1);
        const e = 1 - Math.pow(1 - k, 2);
        const [tx, ty] = project(l.lat, l.lon);
        const m = 1 - e;
        const x = m * m * l.from[0] + 2 * m * e * l.ctrl[0] + e * e * tx;
        const y = m * m * l.from[1] + 2 * m * e * l.ctrl[1] + e * e * ty;
        const col = mix(BLUE, GREEN, clamp(l.t / 0.3, 0, 1));
        glow(x, y, l.r, col, 0.95 - k * 0.2);
        continue;
      }
      const [x, y] = P(l.a, l.c);
      let col: RGB = BLUE;
      let r = l.r;
      let ox = 0;
      let oy = 0;
      if (l.phase === 'caught') {
        const k = clamp(l.t / 0.38, 0, 1);
        col = mix(BLUE, RED, clamp(k * 2.4, 0, 1));
        r = l.r * (1 + k * 1.2);
        ox = Math.sin(l.t * 70) * 1.8 * k;
        oy = Math.cos(l.t * 83) * 1.8 * k;
      }
      const alpha = clamp((l.a - start) / fadeLen, 0, 1);
      // tail
      c.strokeStyle = rgba(col, 0.22 * alpha);
      c.lineWidth = r;
      c.lineCap = 'round';
      c.beginPath();
      const [tx, ty] = P(l.a - (l.phase === 'caught' ? 0 : 18), l.c);
      c.moveTo(tx, ty);
      c.lineTo(x + ox, y + oy);
      c.stroke();
      glow(x + ox, y + oy, r, col, alpha);
    }
    for (const s of shards) {
      const k = s.life / s.ttl;
      c.save();
      c.translate(s.x, s.y);
      c.rotate(s.rot);
      c.fillStyle = rgba(mix(RED, GOLD, k * 0.6), 1 - k);
      c.beginPath();
      c.moveTo(-s.s, s.s * 0.7);
      c.lineTo(s.s, 0);
      c.lineTo(-s.s, -s.s * 0.7);
      c.closePath();
      c.fill();
      c.restore();
    }
    for (const r of rings) {
      const k = r.life / r.ttl;
      c.strokeStyle = rgba(r.c, (1 - k) * 0.7);
      c.lineWidth = 1.5 * (1 - k) + 0.4;
      c.beginPath();
      c.arc(r.x, r.y, 3 + k * r.r, 0, TAU);
      c.stroke();
    }
  }

  function draw(now: number) {
    ctx!.clearRect(0, 0, W, H);
    drawGlobe();
    drawGate(now);
    drawLookups();
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (W) {
      step(dt);
      draw(now);
    }
    raf = requestAnimationFrame(frame);
  }

  // a fixed, composed frame for reduced motion
  function drawStill() {
    if (!W) return;
    rand = rng(7);
    lookups.length = 0;
    shards.length = 0;
    marks.length = 0;
    rings.length = 0;
    spin = 0.6;
    for (let i = 0; i < 9; i++) {
      const l: Lookup = {
        a: start + (gate - start) * (0.25 + i * 0.085),
        c: mid + (rand() * 2 - 1) * gateHalf * 0.7,
        v: 0,
        r: 2.4,
        bad: false,
        phase: 'in',
        t: 1,
      };
      lookups.push(l);
    }
    for (let i = 0; i < 4; i++) {
      const l: Lookup = {
        a: gate,
        c: mid + (rand() * 2 - 1) * gateHalf * 0.6,
        v: 0,
        r: 2.4,
        bad: false,
        phase: 'in',
        t: 0,
      };
      decide(l);
      l.t = (l.dur ?? 1) * (0.25 + i * 0.18);
      lookups.push(l);
    }
    for (let i = 0; i < 7; i++) {
      const [lat, lon] = landing();
      marks.push({ lat, lon, life: 0.4 + i * 0.3, ttl: 3.2 });
    }
    const [bx, by] = P(gate, mid - gateHalf * 0.3);
    rings.push({ x: bx, y: by, life: 0.15, ttl: 0.6, c: RED, r: 26 });
    rand = Math.random;
    draw(0);
  }

  function play() {
    if (still || running || !onScreen || document.hidden) return;
    running = true;
    rand = Math.random;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }

  new ResizeObserver(() => {
    layout();
    if (!still && !running) draw(performance.now());
  }).observe(canvas);
  new IntersectionObserver(([e]) => {
    onScreen = !!e?.isIntersecting;
    if (onScreen) play();
    else pause();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  reduce.addEventListener('change', () => {
    still = reduce.matches;
    if (still) {
      pause();
      drawStill();
    } else {
      lookups.length = 0;
      marks.length = 0;
      rings.length = 0;
      play();
    }
  });

  layout();
  if (still) drawStill();
  else {
    // start with a little traffic already on its way
    for (let i = 0; i < 8; i++) {
      spawn();
      const l = lookups[lookups.length - 1];
      if (l) l.a = start + (gate - start) * (i / 8);
    }
    play();
  }
  canvas.classList.add('is-ready');
}

for (const c of document.querySelectorAll<HTMLCanvasElement>('canvas[data-hero-canvas]')) mountHero(c);
