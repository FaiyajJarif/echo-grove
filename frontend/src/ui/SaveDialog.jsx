import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { Icon } from './Icons';

/** Name the garden, choose whether to publish it, save, then copy its share link. */
export default function SaveDialog({ garden, onClose, toast }) {
  const [name, setName] = useState('');
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
    const d = ref.current;
    const onCancel = (e) => { e.preventDefault(); onClose(); };
    d?.addEventListener('cancel', onCancel);
    return () => d?.removeEventListener('cancel', onCancel);
  }, [onClose]);

  const link = saved ? `${window.location.origin}${window.location.pathname}#/g/${saved.code}` : '';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const g = await api.saveGarden({ ...garden, name: name.trim(), publish });
      setSaved(g);
      toast(publish ? 'Saved and published to the gallery' : 'Saved to My Grove');
    } catch (err) {
      setError(err.errors ? Object.values(err.errors).join(' ') : err.message);
    } finally { setBusy(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast('Share link copied'); } catch { window.prompt('Copy this link', link); }
  };

  return (
    <dialog ref={ref} className="dialog glass holo" aria-labelledby="save-title">
      <div className="panel-head">
        <h2 id="save-title">{saved ? 'Garden saved' : 'Save this garden'}</h2>
        <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon.close /></button>
      </div>
      {saved ? (
        <div className="dialog-body">
          <p className="sub">Share code</p>
          <p className="code-big mono">{saved.code}</p>
          <p className="hint">Anyone with this link hears exactly the same tree and song.</p>
          <div className="row">
            <button className="btn-primary" onClick={copy}><Icon.share /> Copy share link</button>
            <button className="btn-ghost" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <form className="dialog-body" onSubmit={submit}>
          <label className="input-field">
            <span>Name</span>
            <input className="input" maxLength={60} placeholder="e.g. Rainy evening bonsai" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <label className="check">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            <span>Publish to the public gallery</span>
          </label>
          {error && <p className="notice error" role="alert">{error}</p>}
          <button className="btn-primary wide" disabled={busy}>{busy ? 'Saving…' : 'Save garden'}</button>
        </form>
      )}
    </dialog>
  );
}
