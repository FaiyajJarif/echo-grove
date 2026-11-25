import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, OfflineError } from '../api/client';
import { PRESETS } from '../data/presets';
import { toQuery } from '../data/params';
import { SEASONS } from '../music/seasons';
import TreeThumb from '../ui/TreeThumb';
import { toGarden } from './MyGrovePage';

export default function GalleryPage() {
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null); // null = loading, [] = none
  const [offline, setOffline] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    api.recent(12)
      .then((list) => setCommunity(list.map((g) => ({ ...toGarden(g), id: g.code }))))
      .catch((e) => { setOffline(e instanceof OfflineError); setCommunity([]); });
  }, []);

  const open = (g) => navigate(`/?${toQuery(g.params, g.season, g.mode)}`);
  const card = (g, sub) => (
    <article key={g.id} className="card glass holo">
      <TreeThumb params={g.params} season={g.season} label={`${g.name} tree`} />
      <div className="card-body">
        <h3>{g.name}</h3>
        <p className="sub">{SEASONS[g.season]?.name} · depth {g.params.depth} · {g.params.branches} branches</p>
        {sub && <p className="hint">{sub}</p>}
        <button className="btn-primary small" onClick={() => open(g)}>Open in the Grove</button>
      </div>
    </article>
  );

  return (
    <main className="page">
      <header className="page-head">
        <h1>Gallery</h1>
        <p>Open any garden to hear it. Every one is rebuilt from its settings and seed, so it sounds exactly the same for everyone.</p>
      </header>

      <form className="code-form glass" onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate(`/g/${code.trim().toLowerCase()}`); }}>
        <label htmlFor="code">Have a share code?</label>
        <input id="code" className="input mono" maxLength={8} placeholder="k7m2qx9p" value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, ''))} />
        <button className="btn-primary small">Open</button>
      </form>

      <h2 className="section-title">Featured presets</h2>
      <div className="grid">{PRESETS.map((p) => card(p, p.description))}</div>

      <h2 className="section-title">Community gardens</h2>
      {community === null && <p className="empty glass">Loading gardens…</p>}
      {community?.length === 0 && (
        <p className="empty glass">
          {offline ? 'The community gallery goes live when the backend is connected. You can still play every preset above.' : 'No gardens yet. Plant one and save it to be the first.'}
        </p>
      )}
      {community?.length > 0 && <div className="grid">{community.map((g) => card(g, g.ownerName ? `by ${g.ownerName}` : ''))}</div>}
    </main>
  );
}
