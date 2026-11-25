import { mulberry32 } from './rng.js';

/** Scale steps each child moves from its parent, so every split forms a chord. */
const INTERVALS = { 2: [2, 4], 3: [-1, 2, 4] };

/**
 * Runs the recursion once. Returns every branch (in call order) and the
 * call / leaf / return events. Coordinates are in tree units, y pointing up.
 */
export function buildTree(p) {
  const rng = mulberry32(p.seed);
  const nodes = [];
  const events = [];

  function grow(node) {
    node.index = nodes.length;
    nodes.push(node);
    events.push({ type: 'call', node: node.index });

    if (node.depth === p.depth) {
      // Base case: a leaf blossoms and rings a chime.
      node.leaf = true;
      events.push({ type: 'leaf', node: node.index });
    } else {
      for (let i = 0; i < p.branches; i++) {
        // Spread is the angle on each side: 2 branches = ±spread, 3 branches = -spread, 0, +spread.
        const offset = (p.spread * 2 * (i - (p.branches - 1) / 2)) / (p.branches - 1);
        const angle = node.angle + offset + (rng() - 0.5) * p.asymmetry * p.spread;
        const len = node.len * p.ratio * (1 - p.asymmetry * 0.3 * rng());
        const rad = (angle * Math.PI) / 180;
        grow({
          parent: node.index, childIndex: i, depth: node.depth + 1, angle, len, leaf: false,
          degree: node.degree + INTERVALS[p.branches][i],
          top: node.depth === 0 ? i : node.top,
          x1: node.x2, y1: node.y2,
          x2: node.x2 + Math.cos(rad) * len, y2: node.y2 + Math.sin(rad) * len,
        });
      }
    }

    node.end = nodes.length - 1; // last descendant: the subtree is nodes[index..end]
    events.push({ type: 'return', node: node.index });
  }

  grow({ parent: -1, childIndex: 0, depth: 0, angle: 90, len: 1, leaf: false, degree: 0, top: -1, x1: 0, y1: 0, x2: 0, y2: 1 });

  const bounds = { minX: 0, maxX: 0, minY: 0, maxY: 1 };
  for (const n of nodes) {
    bounds.minX = Math.min(bounds.minX, n.x2);
    bounds.maxX = Math.max(bounds.maxX, n.x2);
    bounds.minY = Math.min(bounds.minY, n.y2);
    bounds.maxY = Math.max(bounds.maxY, n.y2);
  }
  return { nodes, events, bounds, maxDepth: p.depth };
}

/** Indices from the trunk to node i: this is the call stack at that moment. */
export function pathTo(nodes, i) {
  const path = [];
  while (i >= 0) {
    path.push(i);
    i = nodes[i].parent;
  }
  return path.reverse();
}
