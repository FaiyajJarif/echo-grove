import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

/** Short confirmations for every action ("Link copied", "WAV downloaded"). */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const show = useCallback((text) => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list.slice(-2), { id, text }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className="toast glass">{t.text}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
