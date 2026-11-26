import { mulberry32 } from '../recursion/rng.js';
import { pathTo } from '../recursion/tree.js';
import { SEASONS } from './seasons.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Wind gusts: every 21 s from 9 s; rises for 2 s, fades over 5 s. Shared by the sound and the picture. */
export const GUST_START = 9;
export const GUST_EVERY = 21;
const ease = (x) => x * x * (3 - 2 * x);
export function gustAt(t) {
  if (t < GUST_START) return 0;
  const x = (t - GUST_START) % GUST_EVERY;
  return x < 2 ? ease(x / 2) : x < 7 ? ease(1 - (x - 2) / 5) : 0;
}

// One arpeggio pattern per generation (indices into the chord tones), so the pulse evolves as the tree grows.
const PATTERNS = [[0, 1, 2, 1], [0, 2, 1, 3], [0, 1, 2, 3], [3, 2, 1, 0], [0, 2, 3, 1], [1, 0, 2, 3], [0, 3, 1, 2]];

/** Depth picks the octave, the scale degree picks the note: every pitch is in the season's scale. */
export function midiFor(node, S) {
  const n = S.scale.length;
  const k = ((node.degree % n) + n) % n;
  // Trunk starts at C3 (not C2): low notes on soft synths turn into a buzz.
  let m = 12 * (4 + Math.floor(node.depth * 0.5)) + S.rootOffset + S.scale[k];
  while (m > 84) m -= 12; // keep the top soft: nothing above C6
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
        notes.push({ t: tl[i], midi: Math.min(91, midi + 12), dur: 1.4, vel: 0.45 * (0.85 + rng() * 0.3), pan, inst: 'bell', node: i });
      }
    }
  });
  for (let tb = 2, k = 0; tb < duration - 6; tb += 16 * spb, k++) {
    notes.push({ t: tb, midi: 60 + S.rootOffset + (k % 3 === 2 ? 7 : 0), dur: 6, vel: 0.5, pan: k % 2 ? 0.4 : -0.4, inst: 'bowl', node: -1 });
  }
  // Tonic pulse: a soft felt-piano arpeggio of the current chord, one note per beat.
  // From generation 3 a gentle off-beat note appears, from generation 5 it moves up an octave; the coda keeps only the downbeat.
  for (let b = 0; b * spb < duration - 4; b++) {
    const tb = b * spb;
    const chord = [...chords].reverse().find((c) => c.t <= tb) || chords[0];
    const tones = [...chord.notes].sort((x, y) => x - y).map((m) => m + 12);
    tones.push(tones[0] + 12);
    const gen = mode === 'bloom' ? Math.min(D, Math.floor(tb / win)) : Math.floor(b / 8);
    const coda = tb > duration - 16 * spb - 2;
    const beat = b % 4;
    if (coda && beat !== 0) continue;
    const pat = PATTERNS[gen % PATTERNS.length];
    notes.push({ t: tb + (beat ? (rng() - 0.5) * 0.02 : 0), midi: tones[pat[beat]], dur: 1.6, vel: (beat === 0 ? 0.42 : 0.28) * (0.9 + rng() * 0.2) * (coda ? 0.7 : 1), pan: [-0.3, 0.1, 0.3, -0.1][beat], inst: 'arp', node: -1 });
    if (gen >= 3 && beat === 1 && !coda && rng() > 0.4) {
      notes.push({ t: tb + spb / 2, midi: tones[(pat[beat] + 1) % 4] + (gen >= 5 ? 12 : 0), dur: 1, vel: 0.18, pan: 0.2, inst: 'arp', node: -1 });
    }
  }
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
