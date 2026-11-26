import { useState } from 'react';
import Knob from './Knob';
import { Icon } from './Icons';
import { SLIDERS, MAX_CALLS, DEFAULTS, countCalls, maxDepthFor, SEASON_KEYS } from '../data/params';
import { PRESETS } from '../data/presets';
import { SEASONS } from '../music/seasons';

export default function ControlsPanel({ params, update, season, setSeason, applyPreset, reset, onSave, onClose, className = '' }) {
  const [hint, setHint] = useState('Drag a knob up or down. Double-click resets it.');
  const { depth: d, branches: b, ratio: r, spread } = params;
  const calls = countCalls(b, d);
  return (
    <section className={`panel glass holo controls ${className}`} aria-labelledby="controls-title">
      <header className="panel-head">
        <div>
          <h2 id="controls-title" title="Keys: Space play · R regrow · T mode · I infinite · P picture · Z zen · D download">Shape your tree</h2>
          <p className="sub">Every change regrows the tree gently</p>
        </div>
        <button className="icon-btn sheet-close" aria-label="Close" onClick={onClose}><Icon.close /></button>
      </header>

      <div className="panel-body">
        <div className="field season-field">
          <span className="label">Season</span>
          <div className="chips" role="radiogroup" aria-label="Season">
            {SEASON_KEYS.map((k) => (
              <button key={k} role="radio" aria-checked={season === k} className={`chip ${season === k ? 'on' : ''}`} onClick={() => setSeason(k)}>{SEASONS[k].name}</button>
            ))}
          </div>
        </div>

        <div className="knob-grid">
          {SLIDERS.map((s) => (
            <Knob key={s.key} id={`p-${s.key}`} label={s.label} sym={s.sym} min={s.min} step={s.step} fmt={s.fmt} hint={s.hint} def={DEFAULTS[s.key]}
              max={s.key === 'depth' ? maxDepthFor(b) : s.max} value={params[s.key]} onChange={(v) => update(s.key, v)} onHint={setHint} />
          ))}
        </div>
        <p className="hint knob-hint" aria-live="polite">{hint}</p>

        <button type="button" role="switch" aria-checked={b === 3} className={`lever ${b === 3 ? 'on' : ''}`} onClick={() => update('branches', b === 3 ? 2 : 3)}>
          <span className="lever-track" aria-hidden="true"><span className="lever-handle" /></span>
          <span><strong>{b} branches</strong> per split<small>2 = open and calm · 3 = lush</small></span>
        </button>

        <details className="math-box">
          <summary>Σ The maths behind this tree</summary>
        <div className="math mono" aria-label="Live formulas">
          <span>calls = Σ<sub>k=0…{d}</sub> {b}<sup>k</sup> = <b>{calls}</b></span>
          <span>tip length = r<sup>d</sup> = {r.toFixed(2)}<sup>{d}</sup> = <b>{Math.pow(r, d).toFixed(3)}</b></span>
          <span>child angle = parent ± θ = ±{spread}°</span>
          <span>pan = cos(angle) · pitch = scale[degree mod n]</span>
        </div>
        </details>

        <div className="field">
          <div className="field-row"><span className="label">Tree size</span><output>{calls} / {MAX_CALLS} calls</output></div>
          <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={MAX_CALLS} aria-valuenow={calls} aria-label="Tree size">
            <span style={{ width: `${(calls / MAX_CALLS) * 100}%` }} />
          </div>
        </div>

        <div className="field">
          <div className="field-row">
            <label htmlFor="p-seed">Seed</label>
            <div className="seed-row">
              <input id="p-seed" className="input mono" inputMode="numeric" value={params.seed}
                onChange={(e) => update('seed', Math.max(0, Math.min(999999, Number(e.target.value.replace(/\D/g, '')) || 0)))} />
              <button className="icon-btn" aria-label="Random seed" title="Random seed" onClick={() => update('seed', Math.floor(Math.random() * 1e6))}><Icon.dice /></button>
            </div>
          </div>
        </div>

        <div className="field">
          <span className="label">Presets</span>
          <div className="preset-grid">
            {PRESETS.map((p) => <button key={p.id} className="chip preset" title={p.description} onClick={() => applyPreset(p)}>{p.name}</button>)}
          </div>
        </div>

        <div className="panel-actions">
          <button className="btn-ghost" onClick={reset}><Icon.regrow /> Reset</button>
          <button className="btn-outline" onClick={onSave}><Icon.save /> Save to My Grove</button>
        </div>
      </div>
    </section>
  );
}
