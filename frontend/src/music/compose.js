import { mulberry32 } from '../recursion/rng.js';
import { pathTo } from '../recursion/tree.js';
import { SEASONS } from './seasons.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Depth picks the octave, the scale degree picks the note: every pitch is in the season's scale. */
export function midiFor(node, S) {
  const n = S.scale.length;
  const k = ((node.degree % n) + n) % n;
  let m = 12 * (3 + Math.floor(node.depth * 0.6)) + S.rootOffset + S.scale[k];
  while (m > 96) m -= 12;
  while (m < 36) m += 12;
  return m;
}

/**
 * Turns the recursion into a timed score.
 * bloom: generation by generation (2 bars per depth level), most relaxing.
 * trace: true call order, so you hear the recursion dive and return.
 */
export function compose(tree, p, seasonKey, mode) {
  const S = SEASONS[seasonKey];
  const spb = 60 / p.tempo;
  const rng = mulberry32((p.seed * 7919) ^ 0x5bd1e995);
  const { nodes } = tree;
  const N = nodes.length;
  const D = tree.maxDepth;
  const t = new Float64Array(N); // when the branch starts growing (its note)
  const g = new Float64Array(N); // how long it takes to grow
  const tl = new Float64Array(N); // when a leaf blossoms
  const chords = [];
  const win = 6 * spb; // one generation = 1.5 bars
  let step = 0;
  let duration;

  if (mode === 'trace') {
    step = Math.min(spb / 2, 80 / N);
    nodes.forEach((n, i) => {
      t[i] = i * step;
      g[i] = i === 0 ? Math.max(1.5, step * 3) : step * 3;
      tl[i] = t[i] + step * 0.5;
    });
    chords.push({ t: 0, notes: S.chords[0] });
    nodes.forEach((n, i) => { if (n.depth === 1) chords.push({ t: t[i], notes: S.chords[(n.childIndex + 1) % S.chords.length] }); });
    duration = N * step + 12 * spb;
  } else {
    const byDepth = [];
    nodes.forEach((n) => (byDepth[n.depth] ||= []).push(n));
    byDepth.forEach((arr, d) => {
      arr.sort((a, b) => a.x2 - b.x2); // left to right
      arr.forEach((n, i) => {
        t[n.index] = d * win + (arr.length > 1 ? (i / arr.length) * win * 0.85 : 0) + rng() * 0.03;
        g[n.index] = d === 0 ? win * 0.9 : Math.min(win * 0.6, 2.2);
        tl[n.index] = t[n.index] + g[n.index] * 0.9;
      });
      chords.push({ t: d * win, notes: S.chords[d % S.chords.length] });
    });
    duration = (D + 1) * win + 16 * spb;
  }
  chords.forEach((c, i) => { c.dur = (i + 1 < chords.length ? chords[i + 1].t : duration - 2) - c.t + 1.5; });

  // Notes: branches, then a chime for every leaf (max 5 chimes per eighth note).
  const notes = [];
  const clusters = new Map();
  nodes.forEach((n, i) => {
    const midi = midiFor(n, S);
    const pan = clamp(Math.cos((n.angle * Math.PI) / 180) * 1.2, -0.8, 0.8);
    const vel = Math.max(0.12, 0.8 * Math.pow(0.82, n.depth)) * (0.9 + rng() * 0.2);
    const thin = mode === 'bloom' && n.depth >= 4 && rng() > 0.6;
    if (!thin) notes.push({ t: t[i], midi, dur: n.depth <= 1 ? Math.max(2.5, g[i]) : 0.7, vel, pan, inst: n.depth <= 1 ? 'pad' : 'pluck', node: i });
    if (n.leaf) {
      const key = Math.round(tl[i] / (spb / 2));
      const c = clusters.get(key) || 0;
      if (c < 5) {
        clusters.set(key, c + 1);
        notes.push({ t: tl[i], midi: Math.min(100, midi + 12), dur: 1.4, vel: 0.45 * (0.85 + rng() * 0.3), pan, inst: 'bell', node: i });
      }
    }
  });
  notes.sort((a, b) => a.t - b.t);

  // When each call returns: after its whole subtree has finished.
  const te = new Float64Array(N);
  for (let i = N - 1; i >= 0; i--) {
    const n = nodes[i];
    te[i] = Math.max(te[i], n.leaf ? tl[i] : t[i] + g[i]);
    if (n.parent >= 0) te[n.parent] = Math.max(te[n.parent], te[i]);
  }

  // Timeline of call / leaf / return events with running counters, for the live panel.
  const timeline = tree.events
    .map((e, order) => ({ ...e, order, t: e.type === 'call' ? t[e.node] : e.type === 'leaf' ? tl[e.node] : te[e.node] }))
    .sort((a, b) => a.t - b.t || a.order - b.order);
  let calls = 0;
  let leaves = 0;
  for (const e of timeline) {
    if (e.type === 'call') calls++;
    if (e.type === 'leaf') leaves++;
    e.calls = calls;
    e.leaves = leaves;
  }

  return { mode, notes, chords, duration, t, g, tl, timeline, spb, win, step, depth: D, totalCalls: N, totalLeaves: leaves };
}

/** What the recursion is doing at a given moment: current call, stack, counters, pseudocode line. */
export function snapshot(comp, tree, now) {
  const tl = comp.timeline;
  let lo = 0;
  let hi = tl.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (tl[mid].t <= now) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  if (idx < 0) return { calls: 0, leaves: 0, node: 0, stack: [0], line: 0, generation: 1, depth: 0 };
  const ev = tl[idx];
  let j = idx;
  while (j > 0 && tl[j].type === 'return') j--;
  const node = tl[j].node;
  const n = tree.nodes[node];
  const line = ev.type === 'return' ? 5 : ev.type === 'leaf' ? 2 : n.leaf ? 2 : 1;
  const generation = comp.mode === 'bloom' ? Math.min(comp.depth, Math.floor(now / comp.win)) + 1 : n.depth + 1;
  return { calls: ev.calls, leaves: ev.leaves, node, stack: pathTo(tree.nodes, node), line, generation, depth: n.depth };
}

export function lastNoteAt(comp, now) {
  const ns = comp.notes;
  let lo = 0;
  let hi = ns.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ns[mid].t <= now) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return idx >= 0 ? ns[idx] : null;
}
