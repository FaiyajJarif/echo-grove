import { SEASONS } from '../music/seasons';
import { gustAt } from '../music/compose';

const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const BARK_DARK = [86, 58, 50];
const BARK_LIGHT = [150, 120, 112];

/**
 * Canvas renderer for the tree. Runs outside React state: React passes the scene,
 * and the animation loop calls frame() with the audio clock, so picture and sound stay in sync.
 */
export function createRenderer(canvas, { ring = true } = {}) {
  const ctx = canvas.getContext('2d');
  let tree = null; let comp = null; let S = SEASONS.spring;
  let W = 0; let H = 0; let s = 1; let ox = 0; let oy = 0;
  let bark = []; let glow = [253, 230, 138]; let bloom = [249, 168, 212]; let leafC = [94, 234, 212];
  let reduced = false; let wind = 0.3;
  let pos = new Float32Array(0);
  let bloomed = new Uint8Array(0);
  const petals = [];
  let last = performance.now();
  let spawnAcc = 0;
  let canopySprite = null;
  let flowerSprite = null;

  /** Pre-rendered images, drawn once per season instead of every frame. */
  function makeSprites() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, rgba(leafC, 0.24)); rg.addColorStop(1, rgba(leafC, 0));
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    canopySprite = c;
    const f = document.createElement('canvas'); f.width = f.height = 32;
    const h = f.getContext('2d');
    h.fillStyle = rgba(bloom, 0.95);
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5 - Math.PI / 2;
      h.beginPath(); h.arc(16 + Math.cos(a) * 7, 16 + Math.sin(a) * 7, 6, 0, Math.PI * 2); h.fill();
    }
    h.fillStyle = rgba(glow, 1); h.beginPath(); h.arc(16, 16, 4, 0, Math.PI * 2); h.fill();
    flowerSprite = f;
  }

  function fit() {
    if (!tree || !W) return;
    const b = tree.bounds;
    const pad = Math.min(W, H) * 0.12;
    s = Math.min((W - 2 * pad) / Math.max(0.01, b.maxX - b.minX), (H - 2 * pad) / Math.max(0.01, b.maxY - b.minY));
    ox = W / 2 - (s * (b.minX + b.maxX)) / 2;
    oy = H - pad * 0.85 + s * b.minY;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
  }

  function setScene(t, c, seasonKey, opts = {}) {
    tree = t; comp = c; S = SEASONS[seasonKey];
    reduced = !!opts.reduced; wind = opts.wind ?? 0.3;
    const tint = rgb(S.palette.trunk);
    bark = Array.from({ length: t.maxDepth + 1 }, (_, d) => {
      const base = mix(BARK_DARK, BARK_LIGHT, d / Math.max(1, t.maxDepth));
      return `rgb(${mix(base, tint, 0.25)})`;
    });
    glow = rgb(S.palette.glow); bloom = rgb(S.palette.bloom); leafC = rgb(S.palette.tip);
    makeSprites();
    pos = new Float32Array(t.nodes.length * 4);
    bloomed = new Uint8Array(t.nodes.length);
    petals.length = 0;
    fit();
  }

  const X = (x) => ox + s * x;
  const Y = (y) => oy - s * y;

  /** Curved branch i, grown to fraction p (quadratic Bézier split with de Casteljau). */
  function branchPath(i, p) {
    const x0 = X(pos[i * 4]); const y0 = Y(pos[i * 4 + 1]);
    const x2 = X(pos[i * 4 + 2]); const y2 = Y(pos[i * 4 + 3]);
    const dx = x2 - x0; const dy = y2 - y0;
    const bend = (((i * 7919) % 7) - 3) / 3 * 0.12;
    const x1 = (x0 + x2) / 2 - dy * bend; const y1 = (y0 + y2) / 2 + dx * bend;
    const qx = x0 + (x1 - x0) * p; const qy = y0 + (y1 - y0) * p;
    const rx = qx + (x1 + (x2 - x1) * p - qx) * p; const ry = qy + (y1 + (y2 - y1) * p - qy) * p;
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(qx, qy, rx, ry);
  }

  function flower(x, y, r) {
    const size = r * 4.6;
    ctx.drawImage(flowerSprite, x - size / 2, y - size / 2, size, size);
  }

  function frame(now, { started = false, stack = [], progress = 0 } = {}) {
    const clock = performance.now() / 1000;
    const dt = Math.min(0.1, clock - last / 1000);
    last = performance.now();
    ctx.clearRect(0, 0, W, H);
    if (!tree || !comp) return;
    const nodes = tree.nodes;
    const N = nodes.length;
    const D = tree.maxDepth;
    const gust = reduced || !started ? 0 : gustAt(now);
    const scale = Math.max(0.8, s / 220);

    // Breathing ring: 10 s cycle = 6 breaths a minute.
    if (ring) {
      const cx = W / 2; const cy = Y(tree.bounds.maxY / 2) - 8;
      const R = Math.min(W, H) * 0.42;
      const phase = (clock % 10) / 10;
      const br = reduced ? 0.5 : 0.5 - 0.5 * Math.cos(Math.PI * (phase < 0.5 ? phase * 2 : 2 - phase * 2));
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(94,234,212,${0.14 + 0.2 * br})`;
      ctx.beginPath(); ctx.arc(cx, cy, R * (0.96 + 0.05 * br), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([2, 10]); ctx.lineDashOffset = reduced ? 0 : -clock * 8;
      ctx.strokeStyle = 'rgba(196,181,253,.3)';
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (started) {
        const a = -Math.PI / 2 + progress * Math.PI * 2;
        ctx.strokeStyle = rgba(glow, 0.8); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, -Math.PI / 2, a); ctx.stroke();
        ctx.fillStyle = rgba(glow, 1);
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 1.06, cy + Math.sin(a) * R * 1.06, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(204,251,241,.8)';
      ctx.font = '500 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(gust > 0.3 ? 'a breeze passes…' : phase < 0.5 ? 'breathe in' : 'breathe out', cx, Math.max(14, cy - R * 1.06 - 12));
    }

    // Grassy mound the tree grows from.
    const gx = X(0); const mound = Math.min(W * 0.3, s * 1.1);
    const mg = ctx.createRadialGradient(gx, oy + 6, 2, gx, oy + 6, mound);
    mg.addColorStop(0, rgba(leafC, 0.35)); mg.addColorStop(0.5, rgba(leafC, 0.12)); mg.addColorStop(1, rgba(leafC, 0));
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.ellipse(gx, oy + 6, mound, mound * 0.12, 0, 0, Math.PI * 2); ctx.fill();

    // Positions: gentle sway, plus a lean when a gust passes. Parents come before children.
    const sw = reduced ? 0 : wind;
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const x1 = i === 0 ? 0 : pos[n.parent * 4 + 2];
      const y1 = i === 0 ? 0 : pos[n.parent * 4 + 3];
      const swayDeg = Math.sin(clock * 0.7 + n.depth * 0.9 + (i % 7) * 0.3) * sw * n.depth * 0.9 * (1 + 2 * gust) - gust * (1.2 + n.depth * 1.1) * (0.4 + sw);
      const a = ((n.angle + swayDeg) * Math.PI) / 180;
      pos[i * 4] = x1; pos[i * 4 + 1] = y1;
      pos[i * 4 + 2] = x1 + Math.cos(a) * n.len; pos[i * 4 + 3] = y1 + Math.sin(a) * n.len;
    }

    // Branches not grown yet: faint dashed outline of the future tree.
    ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(226,232,255,.13)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < N; i++) if (!started || now < comp.t[i]) branchPath(i, 1);
    ctx.stroke(); ctx.setLineDash([]);
    if (!started) return;

    // Soft canopy glow behind the outer branches.
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      if (n.depth < D - 1 || now < comp.t[i] + comp.g[i] * 0.5) continue;
      const x = X(pos[i * 4 + 2]); const y = Y(pos[i * 4 + 3]);
      const r = (n.leaf ? 16 : 11) * scale;
      ctx.drawImage(canopySprite, x - r, y - r, r * 2, r * 2);
    }

    // Bark: curved, tapering branches, batched by depth.
    ctx.lineCap = 'round';
    for (let d = 0; d <= D; d++) {
      ctx.strokeStyle = bark[d];
      ctx.lineWidth = Math.max(0.9, s * 0.075 * Math.pow(0.66, d));
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        if (nodes[i].depth !== d || now < comp.t[i]) continue;
        branchPath(i, Math.min(1, (now - comp.t[i]) / comp.g[i]));
      }
      ctx.stroke();
    }

    // Glow along the current call stack and on branches whose note just started.
    const hot = new Set(stack);
    for (let i = 0; i < N; i++) if (now >= comp.t[i] && now - comp.t[i] < 0.35) hot.add(i);
    // Soft halo (wide, faint) then the bright core: looks like a glow without the cost of shadowBlur.
    for (const [alpha, widen] of [[0.18, 3.2], [0.9, 1]]) {
      ctx.strokeStyle = rgba(glow, alpha);
      for (const i of hot) {
        if (now < comp.t[i]) continue;
        ctx.lineWidth = Math.max(1.4, s * 0.075 * Math.pow(0.66, nodes[i].depth) * 0.55) * widen;
        ctx.beginPath(); branchPath(i, Math.min(1, (now - comp.t[i]) / comp.g[i])); ctx.stroke();
      }
    }

    // Blossoms: three five-petal flowers per leaf, opening when the leaf's chime rings.
    const open = [];
    for (let i = 0; i < N; i++) {
      if (!nodes[i].leaf || now < comp.tl[i]) continue;
      open.push(i);
      const age = now - comp.tl[i];
      const k = Math.min(1, age / 0.8);
      const x = X(pos[i * 4 + 2]); const y = Y(pos[i * 4 + 3]);
      for (let f = 0; f < 3; f++) {
        const a = i * 2.1 + f * 2.2;
        flower(x + Math.cos(a) * 5 * scale * (f ? 1 : 0), y + Math.sin(a) * 5 * scale * (f ? 1 : 0), (1.4 + ((i + f) % 3) * 0.35) * scale * k);
      }
      if (age < 1.2) {
        ctx.strokeStyle = rgba(glow, (1 - age / 1.2) * 0.6); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 4 + age * 24, 0, Math.PI * 2); ctx.stroke();
      }
      bloomed[i] = 1;
    }

    // Falling petals: a few at a time, many more when a gust passes; they settle on the ground and fade.
    if (!reduced && open.length) {
      spawnAcc += dt * (0.8 + gust * 9);
      while (spawnAcc >= 1 && petals.length < 160) {
        spawnAcc -= 1;
        const i = open[Math.floor(Math.random() * open.length)];
        petals.push({ x: X(pos[i * 4 + 2]), y: Y(pos[i * 4 + 3]), vx: 0, vy: 10 + Math.random() * 10, life: 9, rot: Math.random() * 6, seed: Math.random() * 10 });
      }
    }
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      const grounded = p.y >= oy + 4;
      if (!grounded) {
        p.vx += ((20 + gust * 120) * (0.3 + wind) - p.vx) * dt * 0.8;
        p.x += (p.vx + Math.sin(clock * 1.7 + p.seed) * 10) * dt;
        p.y += p.vy * dt;
        p.rot += dt * (1 + gust * 4);
      }
      p.life -= dt * (grounded ? 1.5 : 1);
      if (p.life <= 0 || p.x > W + 20) { petals.splice(i, 1); continue; }
      ctx.fillStyle = rgba(bloom, Math.min(0.85, p.life / 3));
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 3.2 * scale, 1.7 * scale, p.rot, 0, Math.PI * 2); ctx.fill();
    }
  }

  /** Branch tip closest to a click, within 18 px; -1 if none. */
  function hit(x, y) {
    if (!tree) return -1;
    let best = -1; let bd = 18 * 18;
    for (let i = 0; i < tree.nodes.length; i++) {
      const dx = X(pos[i * 4 + 2]) - x; const dy = Y(pos[i * 4 + 3]) - y;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /** A few petals fall from random leaves (play-along feedback). */
  function burst(n = 5) {
    if (!tree || reduced) return;
    const leaves = tree.nodes.filter((x) => x.leaf);
    for (let k = 0; k < n && petals.length < 160; k++) {
      const i = leaves[Math.floor(Math.random() * leaves.length)].index;
      petals.push({ x: X(pos[i * 4 + 2]), y: Y(pos[i * 4 + 3]), vx: (Math.random() - 0.5) * 20, vy: 12, life: 6, rot: Math.random() * 6, seed: Math.random() * 10 });
    }
  }

  return { resize, setScene, frame, hit, burst };
}
