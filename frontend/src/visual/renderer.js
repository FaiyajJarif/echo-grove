import { SEASONS } from '../music/seasons';

const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/**
 * Canvas renderer for the tree. Runs outside React state: React only passes
 * the scene, and the animation loop calls frame() with the audio clock.
 */
export function createRenderer(canvas, { ring = true } = {}) {
  const ctx = canvas.getContext('2d');
  let tree = null;
  let comp = null;
  let S = SEASONS.spring;
  let W = 0; let H = 0; let s = 1; let ox = 0; let oy = 0;
  let colors = []; let glow = [253, 230, 138]; let bloom = [249, 168, 212];
  let reduced = false; let wind = 0.3;
  let pos = new Float32Array(0);
  let bloomed = new Uint8Array(0);
  const petals = [];
  let last = performance.now();

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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
  }

  function setScene(t, c, seasonKey, opts = {}) {
    tree = t; comp = c; S = SEASONS[seasonKey];
    reduced = !!opts.reduced; wind = opts.wind ?? 0.3;
    const a = rgb(S.palette.trunk); const z = rgb(S.palette.tip);
    colors = Array.from({ length: t.maxDepth + 1 }, (_, d) => `rgb(${mix(a, z, d / Math.max(1, t.maxDepth))})`);
    glow = rgb(S.palette.glow); bloom = rgb(S.palette.bloom);
    pos = new Float32Array(t.nodes.length * 4);
    bloomed = new Uint8Array(t.nodes.length);
    petals.length = 0;
    fit();
  }

  const X = (x) => ox + s * x;
  const Y = (y) => oy - s * y;

  function frame(now, { started = false, stack = [], progress = 0 } = {}) {
    const clock = performance.now() / 1000;
    const dt = Math.min(0.1, clock - last / 1000);
    last = performance.now();
    ctx.clearRect(0, 0, W, H);
    if (!tree || !comp) return;
    const nodes = tree.nodes;
    const N = nodes.length;

    // Breathing ring: 10 s cycle = 6 breaths a minute.
    if (ring) {
      const cx = W / 2; const cy = Y(tree.bounds.maxY / 2) - 8;
      const R = Math.min(W, H) * 0.42;
      const phase = (clock % 10) / 10;
      const br = reduced ? 0.5 : 0.5 - 0.5 * Math.cos(Math.PI * (phase < 0.5 ? phase * 2 : 2 - phase * 2));
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(94,234,212,${0.18 + 0.25 * br})`;
      ctx.beginPath(); ctx.arc(cx, cy, R * (0.96 + 0.05 * br), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([2, 10]); ctx.lineDashOffset = reduced ? 0 : -clock * 8;
      ctx.strokeStyle = 'rgba(196,181,253,.35)';
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (started) {
        const a = -Math.PI / 2 + progress * Math.PI * 2;
        ctx.strokeStyle = rgba(glow, 0.85); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, -Math.PI / 2, a); ctx.stroke();
        ctx.fillStyle = rgba(glow, 1);
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 1.06, cy + Math.sin(a) * R * 1.06, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(204,251,241,.8)';
      ctx.font = '500 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(phase < 0.5 ? 'breathe in' : 'breathe out', cx, Math.max(14, cy - R * 1.06 - 12));
    }

    // Positions with wind sway; parents come before children in call order.
    const sw = reduced ? 0 : wind;
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const x1 = i === 0 ? 0 : pos[n.parent * 4 + 2];
      const y1 = i === 0 ? 0 : pos[n.parent * 4 + 3];
      const a = ((n.angle + Math.sin(clock * 0.7 + n.depth * 0.9 + (i % 7) * 0.3) * sw * n.depth * 0.9) * Math.PI) / 180;
      pos[i * 4] = x1; pos[i * 4 + 1] = y1;
      pos[i * 4 + 2] = x1 + Math.cos(a) * n.len; pos[i * 4 + 3] = y1 + Math.sin(a) * n.len;
    }

    // Branches not grown yet: faint dashed preview of the future tree.
    ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(226,232,255,.18)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      if (started && now >= comp.t[i]) continue;
      ctx.moveTo(X(pos[i * 4]), Y(pos[i * 4 + 1])); ctx.lineTo(X(pos[i * 4 + 2]), Y(pos[i * 4 + 3]));
    }
    ctx.stroke(); ctx.setLineDash([]);
    if (!started) return;

    // Grown branches, batched by depth.
    ctx.lineCap = 'round';
    for (let d = 0; d <= tree.maxDepth; d++) {
      ctx.strokeStyle = colors[d];
      ctx.lineWidth = Math.max(0.8, s * 0.06 * Math.pow(0.7, d));
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        if (nodes[i].depth !== d || now < comp.t[i]) continue;
        const p = Math.min(1, (now - comp.t[i]) / comp.g[i]);
        const x1 = pos[i * 4]; const y1 = pos[i * 4 + 1];
        ctx.moveTo(X(x1), Y(y1));
        ctx.lineTo(X(x1 + (pos[i * 4 + 2] - x1) * p), Y(y1 + (pos[i * 4 + 3] - y1) * p));
      }
      ctx.stroke();
    }

    // Glow: the current call stack plus branches whose note just started.
    const hot = new Set(stack);
    for (let i = 0; i < N; i++) if (now >= comp.t[i] && now - comp.t[i] < 0.35) hot.add(i);
    ctx.shadowColor = rgba(glow, 0.9); ctx.shadowBlur = 12; ctx.strokeStyle = rgba(glow, 0.95);
    for (const i of hot) {
      if (now < comp.t[i]) continue;
      const p = Math.min(1, (now - comp.t[i]) / comp.g[i]);
      const x1 = pos[i * 4]; const y1 = pos[i * 4 + 1];
      ctx.lineWidth = Math.max(1.6, s * 0.06 * Math.pow(0.7, nodes[i].depth) + 1.5);
      ctx.beginPath(); ctx.moveTo(X(x1), Y(y1));
      ctx.lineTo(X(x1 + (pos[i * 4 + 2] - x1) * p), Y(y1 + (pos[i * 4 + 3] - y1) * p)); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Blossoms, ripples and petals.
    const scale = Math.max(0.8, s / 220);
    for (let i = 0; i < N; i++) {
      if (!nodes[i].leaf || now < comp.tl[i]) continue;
      const age = now - comp.tl[i];
      const k = Math.min(1, age / 0.6);
      const r = (2 + ((i * 37) % 5) * 0.5) * k * scale;
      const x = X(pos[i * 4 + 2]); const y = Y(pos[i * 4 + 3]);
      ctx.fillStyle = rgba(bloom, 0.22); ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(bloom, 0.95); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      if (age < 1.2) {
        ctx.strokeStyle = rgba(glow, (1 - age / 1.2) * 0.7); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 4 + age * 26, 0, Math.PI * 2); ctx.stroke();
      }
      if (!bloomed[i]) {
        bloomed[i] = 1;
        if (!reduced && (i * 13) % 10 < 3 && petals.length < 140) petals.push({ x, y, vx: (((i * 7) % 5) - 2) * 6, vy: 4, life: 5, seed: i });
      }
    }
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.vy += 6 * dt; p.x += (p.vx + Math.sin(clock + p.seed) * 14 * wind) * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0 || p.y > H) { petals.splice(i, 1); continue; }
      ctx.fillStyle = rgba(bloom, Math.min(0.8, p.life / 2));
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 2.6, 1.6, clock + p.seed, 0, Math.PI * 2); ctx.fill();
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
      petals.push({ x: X(pos[i * 4 + 2]), y: Y(pos[i * 4 + 3]), vx: (Math.random() - 0.5) * 20, vy: -10, life: 4, seed: i });
    }
  }

  return { resize, setScene, frame, hit, burst };
}
