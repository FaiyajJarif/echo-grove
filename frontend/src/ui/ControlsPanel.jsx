import Slider from './Slider';
import { Icon } from './Icons';
import { SLIDERS, MAX_CALLS, countCalls, maxDepthFor, SEASON_KEYS } from '../data/params';
import { PRESETS } from '../data/presets';
import { SEASONS } from '../music/seasons';

export default function ControlsPanel({ params, update, season, setSeason, applyPreset, reset, onSave, onClose, className = '' }) {
  const calls = countCalls(params.branches, params.depth);
  const maxDepth = maxDepthFor(params.branches);
  return (
    <section className={`panel glass holo controls ${className}`} aria-labelledby="controls-title">
      <header className="panel-head">
        <div>
          <h2 id="controls-title">Shape your tree</h2>
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

        {SLIDERS.map((s) => (
          <Slider key={s.key} id={`p-${s.key}`} label={s.label} min={s.min} step={s.step} fmt={s.fmt} hint={s.hint} max={s.key === 'depth' ? maxDepth : s.max}
            value={params[s.key]} onChange={(v) => update(s.key, v)} />
        )).reduce((acc, el, i) => (i === 1 ? [...acc, (
          <div className="field" key="branches">
            <div className="field-row">
              <span className="label" id="branches-label">Branches per split</span>
              <div className="segmented small" role="radiogroup" aria-labelledby="branches-label">
                {[2, 3].map((b) => (
                  <button key={b} role="radio" aria-checked={params.branches === b} className={params.branches === b ? 'on' : ''} onClick={() => update('branches', b)}>{b}</button>
                ))}
              </div>
            </div>
            <p className="hint">2 = open and calm · 3 = lush</p>
          </div>
        ), el] : [...acc, el]), [])}

        <div className="field">
          <div className="field-row">
            <label htmlFor="p-seed">Seed</label>
            <div className="seed-row">
              <input id="p-seed" className="input mono" inputMode="numeric" value={params.seed}
                onChange={(e) => update('seed', Math.max(0, Math.min(999999, Number(e.target.value.replace(/\D/g, '')) || 0)))} />
              <button className="icon-btn" aria-label="Random seed" title="Random seed" onClick={() => update('seed', Math.floor(Math.random() * 1e6))}><Icon.dice /></button>
            </div>
          </div>
          <p className="hint">Same seed + same settings = the same song</p>
        </div>

        <div className="field">
          <div className="field-row"><span className="label">Tree size</span><output>{calls} / {MAX_CALLS} calls</output></div>
          <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={MAX_CALLS} aria-valuenow={calls} aria-label="Tree size">
            <span style={{ width: `${(calls / MAX_CALLS) * 100}%` }} />
          </div>
          <p className="hint">Capped so the tree never overloads your device</p>
        </div>

        <div className="field">
          <span className="label">Presets</span>
          <div className="preset-grid">
            {PRESETS.map((p) => (
              <button key={p.id} className="chip preset" title={p.description} onClick={() => applyPreset(p)}>{p.name}</button>
            ))}
          </div>
        </div>

        <div className="panel-actions">
          <button className="btn-ghost" onClick={reset}><Icon.regrow /> Reset</button>
          <button className="btn-outline" onClick={onSave}><Icon.save /> Save to My Grove</button>
        </div>
        <p className="hint keys">Keys: Space play · R regrow · T mode · Z zen · D download</p>
      </div>
    </section>
  );
}
