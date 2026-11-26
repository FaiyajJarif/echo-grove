import { useEffect, useRef } from 'react';
import { Icon } from './Icons';

/** Accessible pop-up (native <dialog>): Esc, the close button or a click outside closes it. */
export default function Modal({ title, onClose, wide, children }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const d = ref.current;
    if (!d.open) d.showModal();
    const onCancel = (e) => { e.preventDefault(); close.current(); };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, []);
  return (
    <dialog ref={ref} className={`dialog glass holo ${wide ? 'wide' : ''}`} aria-label={title} onClick={(e) => { if (e.target === ref.current) close.current(); }}>
      <div className="panel-head">
        <h2>{title}</h2>
        <button className="icon-btn" aria-label="Close" onClick={() => close.current()}><Icon.close /></button>
      </div>
      {children}
    </dialog>
  );
}
