import { Icon } from './Icons';

const CODE = [
  'grow(node, depth):',
  '  playNote(node)',
  '  if depth == max: chime(); return',
  '  for child in split(node):',
  '    grow(child, depth + 1)',
  '  resolve(node)   # return',
];

export default function RecursionPanel({ tree, comp, live, mode, setMode, onClose, className = '' }) {
  const stack = live ? [...live.stack].reverse().slice(0, 6) : [];
  return (
    <section className={`panel glass holo recursion ${className}`} aria-labelledby="rec-title">
      <header className="panel-head">
        <div>
          <h2 id="rec-title">Recursion, live</h2>
          <p className="sub">See exactly what the algorithm is doing</p>
        </div>
        <button className="icon-btn sheet-close" aria-label="Close" onClick={onClose}><Icon.close /></button>
      </header>
      <div className="panel-body">
        <div className="segmented" role="radiogroup" aria-label="Listening mode">
          {[['bloom', 'Bloom'], ['trace', 'Trace']].map(([k, l]) => (
            <button key={k} role="radio" aria-checked={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>
          ))}
        </div>
        <p className="hint">{mode === 'bloom' ? 'Bloom: grows level by level, the most relaxing.' : 'Trace: true call order, you hear the stack dive and return.'}</p>

        <p className="label">Call stack · top = the call playing now</p>
        <ol className="stack" aria-label="Call stack">
          {stack.length === 0 && <li className="frame empty">Press Plant to start the recursion</li>}
          {stack.map((i, k) => {
            const n = tree.nodes[i];
            const ang = Math.round(n.angle - 90);
            return (
              <li key={`${i}-${k}`} className={`frame ${k === 0 ? 'now' : ''}`} style={{ opacity: 1 - k * 0.12 }}>
                <code>grow(depth {n.depth}, {ang >= 0 ? '+' : '−'}{Math.abs(ang)}°)</code>
                {k === 0 && <span className="tag">now</span>}
              </li>
            );
          })}
        </ol>

        <div className="stats">
          <div><strong>{live?.calls ?? 0}/{comp.totalCalls}</strong><span>calls</span></div>
          <div><strong>{live?.leaves ?? 0}/{comp.totalLeaves}</strong><span>leaves</span></div>
          <div><strong>{live ? live.depth : 0}/{tree.maxDepth}</strong><span>depth</span></div>
        </div>

        <pre className="code" aria-label="Pseudocode">
          {CODE.map((l, i) => <span key={i} className={live?.line === i ? 'hl' : ''}>{l}{'\n'}</span>)}
        </pre>
      </div>
    </section>
  );
}
