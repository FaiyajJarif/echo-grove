import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, auth, getUser, OfflineError } from '../api/client';
import { clampParams, toQuery } from '../data/params';
import { SEASONS } from '../music/seasons';
import { Icon } from '../ui/Icons';
import { useToast } from '../ui/Toast';
import TreeThumb from '../ui/TreeThumb';

export const toGarden = (g) => ({ ...g, season: g.season.toLowerCase(), mode: g.mode.toLowerCase(), params: clampParams(g) });

export default function MyGrovePage() {
  const [user, setUser] = useState(getUser());
  const [gardens, setGardens] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    auth.refresh().then(setUser).catch((e) => { if (e.status === 401) setUser(null); });
    api.myGardens().then((list) => setGardens(list.map(toGarden)))
      .catch((e) => { setGardens([]); setError(e instanceof OfflineError ? 'The backend is not connected.' : e.message); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <main className="page narrow">
        <section className="glass holo hero-card">
          <span className="hero-icon"><Icon.lock /></span>
          <h1>Your own grove</h1>
          <p>Sign in to keep the trees you love, name them and share them in the gallery. Playing, downloading and share links all work without an account.</p>
          <ul className="ticks">
            <li>Save gardens with a name</li>
            <li>Publish to the gallery after verifying your email</li>
            <li>Every garden gets a short share code</li>
          </ul>
          <div className="row">
            <Link className="btn-primary" to="/signin">Sign in</Link>
            <Link className="btn-outline" to="/signin?mode=register">Create account</Link>
            <Link className="btn-ghost" to="/">Keep playing as a guest</Link>
          </div>
        </section>
      </main>
    );
  }

  const resend = async () => {
    try { await auth.resend(user.email); toast('Verification email sent. Check your inbox.'); } catch (e) { toast(e.message); }
  };
  const recheck = async () => {
    try { const u = await auth.refresh(); setUser(u); toast(u.emailVerified ? 'Email verified' : 'Not verified yet'); } catch (e) { toast(e.message); }
  };
  const signOut = () => { auth.logout(); toast('Signed out'); navigate('/'); };
  const remove = async (g) => {
    if (!window.confirm(`Delete "${g.name}"? This can't be undone.`)) return;
    try { await api.deleteGarden(g.code); setGardens((list) => list.filter((x) => x.code !== g.code)); toast('Garden deleted'); } catch (e) { toast(e.message); }
  };
  const copy = async (g) => {
    const link = `${window.location.origin}${window.location.pathname}#/g/${g.code}`;
    try { await navigator.clipboard.writeText(link); toast('Share link copied'); } catch { window.prompt('Copy this link', link); }
  };

  return (
    <main className="page">
      <header className="page-head split">
        <div>
          <h1>My Grove</h1>
          <p>Signed in as {user.displayName} ({user.email}){user.role === 'ADMIN' ? ' · admin' : ''}</p>
        </div>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
      </header>

      {!user.emailVerified && (
        <section className="notice banner" role="status">
          <span>Verify your email to save and publish gardens. We sent you a link when you signed up.</span>
          <span className="row"><button className="btn-outline small" onClick={resend}>Resend email</button><button className="btn-ghost small" onClick={recheck}>I've verified</button></span>
        </section>
      )}

      {error && <p className="empty glass">{error}</p>}
      {gardens === null && <p className="empty glass">Loading your gardens…</p>}
      {gardens?.length === 0 && !error && (
        <p className="empty glass">No gardens yet. Grow a tree you like, then press <strong>Save to My Grove</strong> in the Shape panel.</p>
      )}
      {gardens?.length > 0 && (
        <div className="grid">
          {gardens.map((g) => (
            <article key={g.code} className="card glass holo">
              <TreeThumb params={g.params} season={g.season} label={`${g.name} tree`} />
              <div className="card-body">
                <h3>{g.name}</h3>
                <p className="sub">{SEASONS[g.season]?.name} · {g.published ? 'In the gallery' : 'Private'}{g.hidden ? ' · hidden by admin' : ''} · <span className="mono">{g.code}</span></p>
                <div className="row">
                  <button className="btn-primary small" onClick={() => navigate(`/?${toQuery(g.params, g.season, g.mode)}`)}>Open</button>
                  <button className="btn-outline small" onClick={() => copy(g)}><Icon.share /> Share</button>
                  <button className="btn-ghost small" onClick={() => remove(g)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
