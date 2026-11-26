import { useId, useState } from 'react';
import { Icon } from './Icons';

/** Small ⓘ button that explains a rule. Opens on hover, focus or tap; Esc closes it. */
export default function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="infotip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="info-btn" aria-label={label} aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
        <Icon.info />
      </button>
      {open && <span role="tooltip" id={id} className="tip-bubble glass">{children}</span>}
    </span>
  );
}
