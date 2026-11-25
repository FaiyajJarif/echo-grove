/** Labelled range slider: current value, filled track and a one-line hint. */
export default function Slider({ id, label, value, min, max, step, fmt, hint, onChange }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{fmt(value)}</output>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        style={{ '--fill': `${fill}%` }}
        aria-valuetext={`${label} ${fmt(value)}`}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="hint" id={`${id}-hint`}>{hint}</p>
    </div>
  );
}
