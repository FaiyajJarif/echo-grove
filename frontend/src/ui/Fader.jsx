import { useRef } from 'react';

/** Vertical mixer fader: drag, click or arrow keys. Value 0..1. */
export default function Fader({ label, value, onChange }) {
  const ref = useRef(null);
  const drag = useRef(false);
  const clamp = (v) => Math.round(Math.min(1, Math.max(0, v)) * 20) / 20;
  const fromY = (y) => { const r = ref.current.getBoundingClientRect(); onChange(clamp((r.bottom - y) / r.height)); };
  return (
    <div className="fader">
      <div
        ref={ref} role="slider" tabIndex={0} className="fader-track" style={{ '--v': value }}
        aria-label={`${label} volume`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-valuetext={`${label} ${Math.round(value * 100)}%`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = true; fromY(e.clientY); }}
        onPointerMove={(e) => drag.current && fromY(e.clientY)}
        onPointerUp={() => { drag.current = false; }}
        onKeyDown={(e) => {
          const d = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 }[e.key];
          if (d !== undefined) { e.preventDefault(); onChange(clamp(value + d)); }
        }}
      >
        <span className="fader-fill" /><span className="fader-cap" />
      </div>
      <span className="fader-label">{label}</span>
    </div>
  );
}
