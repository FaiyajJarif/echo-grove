import { useState } from 'react';
import { Icon } from './Icons';
import Modal from './Modal';

const CODE = [
  ['grow(node, depth):', 'A new call starts for this branch.'],
  ['  playNote(node)', 'The branch plays its note: depth sets the octave, the angle sets left/right.'],
  ['  if depth == max: chime(); return', 'Base case: a leaf blossoms, rings a chime, and the call ends.'],
  ['  for child in split(node):', 'The branch splits into smaller children.'],
  ['    grow(child, depth + 1)', 'Recursion: every child is a smaller copy of the whole tree.'],
  ['  resolve(node)   # return', 'The call returns and is popped off the stack.'],
];

export default function RecursionPanel({ tree, comp, live, mode, setMode, onClose, className = '' }) {
  const [view, setView] = useState(null);
  const stack = live ? [...live.stack].reverse() : [];
  const frame = (i, k) => {
    const n = tree.nodes[i];
    const ang = Math.round(n.angle - 90);
    return (
      <li key={`${i}-${k}`} className={`frame ${k === 0 ? 'now' : ''}`}>
        <code>grow(depth {n.depth}, {ang >= 0 ? '+' : '−'}{Math.abs(ang)}°)</code>
        {k === 0 && <span className="tag">now</span>}
      </li>
    );
  };
  const stats = (
    <div className="stats">
      <div><strong>{live?.calls ?? 0}/{comp.totalCalls}</strong><span>calls</span></div>
      <div><strong>{live?.leaves ?? 0}/{comp.totalLeaves}</strong><span>leaves</span></div>
      <div><strong>{live ? live.depth : 0}/{tree.maxDepth}</strong><span>depth</span></div>
    </div>
  );

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
        <ol className="stack" aria-label="Current call">
          {stack.length ? frame(stack[0], 0) : <li className="frame empty">Press Plant to start the recursion</li>}
        </ol>
        {stats}
        <div className="pop-buttons">
          <button className="btn-outline small" onClick={() => setView('stack')}><Icon.stack /> Call stack ({stack.length})</button>
          <button className="btn-outline small" onClick={() => setView('code')}><span aria-hidden="true">{'</>'}</span> Code view</button>
        </div>
      </div>

      {view === 'stack' && (
        <Modal title="Call stack, live" onClose={() => setView(null)}>
          <p className="sub">Each row is a call waiting for its children to finish. The top one is playing now; it pops when it returns.</p>
          <ol className="stack big">{stack.length ? stack.map(frame) : <li className="frame empty">Press Plant to start</li>}</ol>
          {stats}
        </Modal>
      )}
      {view === 'code' && (
        <Modal title="The recursion, line by line" onClose={() => setView(null)} wide>
          <pre className="code big" aria-label="Pseudocode">
            {CODE.map(([l], i) => <span key={i} className={live?.line === i ? 'hl' : ''}>{l}{'\n'}</span>)}
          </pre>
          <p className="explain"><Icon.info /> {CODE[live?.line ?? 0][1]}</p>
          {stats}
        </Modal>
      )}
    </section>
  );
}
