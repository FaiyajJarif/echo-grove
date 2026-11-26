import { useRef } from 'react';

const A0 = -135;
const A1 = 135;
const R = 26;
const pt = (a) => [32 + R * Math.sin((a * Math.PI) / 180), 32 - R * Math.cos((a * Math.PI) / 180)];
const arc = (a, b) => { const [x0, y0] = pt(a); const [x1, y1] = pt(b); return `M${x0} ${y0}A${R} ${R} 0 ${b - a > 180 ? 1 : 0} 1 ${x1} ${y1}`; };

/** Rotary knob like a synth: drag up/down, arrow keys, Home/End, double-click to reset. */
export default function Knob({ id, label, sym, value, min, max, step, fmt, hint, def, onChange, onHint }) {
  const drag = useRef(null);
  const t = (value - min) / (max - min);
  const ang = A0 + t * (A1 - A0);
  const snap = (v) => Number((Math.round((Math.min(max, Math.max(min, v)) - min) / step) * step + min).toFixed(4));
  const set = (v) => { const n = snap(v); if (n !== value) onChange(n); };

  const onKey = (e) => {
    const big = (max - min) / 10;
    const delta = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: big, PageDown: -big }[e.key];
    if (delta !== undefined) { e.preventDefault(); set(value + delta); }
    else if (e.key === 'Home') { e.preventDefault(); set(min); }
    else if (e.key === 'End') { e.preventDefault(); set(max); }
  };

  return (
    <div className="knob" onPointerEnter={() => onHint?.(hint)} onFocus={() => onHint?.(hint)}>
      <div
        id={id} role="slider" tabIndex={0} className="knob-dial" title={`${hint} (drag up or down, double-click to reset)`}
        aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${label} ${fmt(value)}`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { y: e.clientY, v: value }; }}
        onPointerMove={(e) => { if (drag.current) set(drag.current.v + ((drag.current.y - e.clientY) / 160) * (max - min)); }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onDoubleClick={() => def !== undefined && set(def)}
        onKeyDown={onKey}
      >
        <svg viewBox="0 0 64 64" aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => {
            const a = A0 + (i / 10) * (A1 - A0);
            const [x0, y0] = [32 + 30.5 * Math.sin((a * Math.PI) / 180), 32 - 30.5 * Math.cos((a * Math.PI) / 180)];
            const [x1, y1] = [32 + 28.5 * Math.sin((a * Math.PI) / 180), 32 - 28.5 * Math.cos((a * Math.PI) / 180)];
            return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} className={i / 10 <= t + 1e-6 ? 'k-tick on' : 'k-tick'} />;
          })}
          <path d={arc(A0, A1)} className="k-track" />
          {t > 0.001 && <path d={arc(A0, ang)} className="k-fill" />}
          <g transform={`rotate(${ang} 32 32)`}>
            <circle cx="32" cy="32" r="17" className="k-cap" />
            <line x1="32" y1="17.5" x2="32" y2="24" className="k-pointer" />
          </g>
        </svg>
        <span className="k-sym">{sym}</span>
      </div>
      <span className="k-val">{fmt(value)}</span>
      <span className="k-label">{label}</span>
    </div>
  );
}
