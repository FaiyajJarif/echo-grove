import { useEffect, useRef } from 'react';

/** Glowing cursor ring that trails the mouse, grows over controls, and ripples on click. Off for touch and reduced motion. */
export default function CursorFx() {
  const dot = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let x = -100; let y = -100; let rx = x; let ry = y; let raf;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      dot.current.style.transform = `translate(${x}px, ${y}px)`;
      ring.current.classList.toggle('hot', !!e.target.closest?.('button, a, [role="slider"], input, canvas'));
    };
    const down = (e) => {
      const s = document.createElement('span');
      s.className = 'click-ripple';
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 650);
    };
    const loop = () => {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', down);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
