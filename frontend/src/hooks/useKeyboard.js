import { useEffect, useRef } from 'react';

const TYPING = new Set(['text', 'email', 'password', 'search', 'number', 'tel', 'url']);

/** Global shortcuts, ignored while the user is typing in a field. */
export default function useKeyboard(map) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && TYPING.has(el.type)) || el.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const fn = ref.current[key];
      if (!fn) return;
      if (key === ' ' && el.tagName === 'BUTTON') return; // let Space press the focused button
      e.preventDefault();
      fn();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
