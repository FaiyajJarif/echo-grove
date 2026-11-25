export const MAX_CALLS = 700;
export const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter', 'night'];
export const DEFAULTS = { seed: 48213, depth: 6, branches: 2, spread: 25, ratio: 0.7, asymmetry: 0.2, tempo: 60, wind: 0.3 };

/** Slider definitions: range, label, how the value is shown, and a one-line hint. */
export const SLIDERS = [
  { key: 'depth', min: 1, max: 8, step: 1, label: 'Depth', fmt: (v) => `${v} levels`, hint: 'More levels = a longer, richer song' },
  { key: 'spread', min: 10, max: 60, step: 1, label: 'Spread', fmt: (v) => `${v}°`, hint: 'Wider tree, wider stereo' },
  { key: 'ratio', min: 0.55, max: 0.8, step: 0.01, label: 'Length ratio', fmt: (v) => v.toFixed(2), hint: 'How fast branches and notes shrink' },
  { key: 'asymmetry', min: 0, max: 1, step: 0.05, label: 'Asymmetry', fmt: (v) => v.toFixed(2), hint: 'Natural randomness in shape and rhythm' },
  { key: 'tempo', min: 48, max: 80, step: 1, label: 'Growth speed', fmt: (v) => `${v} BPM`, hint: 'Pace of the whole piece' },
  { key: 'wind', min: 0, max: 1, step: 0.05, label: 'Wind', fmt: (v) => v.toFixed(2), hint: 'Breeze sound, sway and chimes' },
];

/** Calls made by grow(): 1 + b + b^2 + ... + b^depth. */
export function countCalls(branches, depth) {
  let total = 0;
  let level = 1;
  for (let d = 0; d <= depth; d++) {
    total += level;
    level *= branches;
  }
  return total;
}

export function maxDepthFor(branches) {
  let d = 8;
  while (d > 1 && countCalls(branches, d) > MAX_CALLS) d--;
  return d;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function clampParams(p = {}) {
  const q = { ...DEFAULTS };
  const num = (k) => Number.isFinite(Number(p[k])) ? Number(p[k]) : undefined;
  q.branches = num('branches') === 3 ? 3 : 2;
  if (num('seed') !== undefined) q.seed = clamp(Math.floor(num('seed')), 0, 999999);
  for (const s of SLIDERS) {
    const v = num(s.key);
    if (v !== undefined) q[s.key] = clamp(v, s.min, s.max);
  }
  q.depth = Math.min(Math.round(q.depth), maxDepthFor(q.branches));
  return q;
}

export function toQuery(params, season, mode) {
  return new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), season, mode }).toString();
}

export function fromQuery(sp) {
  const raw = Object.fromEntries(sp.entries());
  return {
    params: clampParams(raw),
    season: SEASON_KEYS.includes(raw.season) ? raw.season : 'spring',
    mode: raw.mode === 'trace' ? 'trace' : 'bloom',
  };
}
