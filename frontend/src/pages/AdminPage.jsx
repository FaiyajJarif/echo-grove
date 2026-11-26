import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admin, getUser } from '../api/client';
import { clampParams, toQuery } from '../data/params';
import { useToast } from '../ui/Toast';

const TABS = [['overview', 'Overview'], ['users', 'Users'], ['gardens', 'Gardens']];
const when = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Minimal admin console: overview numbers, user management, garden moderation. */
export default function AdminPage() {
  const user = getUser();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [gardens, setGardens] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const load = () => Promise.all([admin.stats(), admin.users(), admin.gardens()])
    .then(([s, u, g]) => { setStats(s); setUsers(u); setGardens(g); setError(''); })
    .catch((e) => setError(e.message));
  useEffect(() => { if (user?.role === 'ADMIN') load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shownUsers = useMemo(() => users.filter((u) => `${u.displayName} ${u.email}`.toLowerCase().includes(q.toLowerCase())), [users, q]);
  const shownGardens = useMemo(() => gardens.filter((g) => (filter === 'all' || (filter === 'hidden' ? g.hidden : filter === 'published' ? g.published && !g.hidden : !g.published))
    && `${g.name} ${g.code} ${g.ownerName ?? ''}`.toLowerCase().includes(q.toLowerCase())), [gardens, q, filter]);

  if (user?.role !== 'ADMIN') {
    return (
      <main className="page narrow">
        <section className="glass holo hero-card">
          <h1>Admins only</h1>
          <p>This area manages accounts and moderates the public gallery. Sign in with the admin account to continue.</p>
          <div className="row"><Link className="btn-primary" to="/signin">Sign in</Link><Link className="btn-ghost" to="/">Back to the Grove</Link></div>
        </section>
      </main>
    );
  }

  const act = async (fn, done) => { try { await fn(); toast(done); load(); } catch (e) { toast(e.message); } };
  const confirmDo = (msg, fn, done) => { if (window.confirm(msg)) act(fn, done); };

  return (
    <main className="page admin">
      <header className="page-head split">
        <div><h1>Admin</h1><p>Manage accounts and keep the gallery calm and friendly.</p></div>
        <button className="btn-ghost small" onClick={load}>Refresh</button>
      </header>

      <div className="segmented admin-tabs" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setQ(''); }}>{l}</button>)}
      </div>
      {error && <p className="notice error">{error}</p>}

      {tab === 'overview' && stats && (
        <>
          <div className="stats wide">
            {[['users', 'Accounts'], ['gardens', 'Gardens'], ['publishedGardens', 'In gallery'], ['hiddenGardens', 'Hidden']].map(([k, l]) => (
              <div key={k} className="glass"><strong>{stats[k]}</strong><span>{l}</span></div>
            ))}
            <div className="glass"><strong>{users.filter((u) => u.locked).length}</strong><span>Locked out</span></div>
            <div className="glass"><strong>{users.filter((u) => !u.enabled).length}</strong><span>Disabled</span></div>
          </div>
          <h2 className="section-title">Newest accounts</h2>
          <ul className="mini-list glass">
            {users.slice(0, 5).map((u) => <li key={u.id}><strong>{u.displayName}</strong><span>{u.email}</span><span>{when(u.createdAt)}</span></li>)}
          </ul>
        </>
      )}

      {tab !== 'overview' && (
        <div className="admin-tools">
          <input className="input" placeholder={tab === 'users' ? 'Search name or email' : 'Search name, code or owner'} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          {tab === 'gardens' && (
            <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter gardens">
              <option value="all">All</option><option value="published">In gallery</option><option value="private">Private</option><option value="hidden">Hidden</option>
            </select>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="table-wrap glass">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {shownUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.displayName}</td><td>{u.email}</td><td>{u.role}</td>
                  <td><span className={`pill ${!u.enabled ? 'bad' : u.locked ? 'warn' : 'ok'}`}>{!u.enabled ? 'Disabled' : u.locked ? 'Locked out' : 'Active'}</span></td>
                  <td>{when(u.createdAt)}</td>
                  <td className="actions">
                    {u.role !== 'ADMIN' ? (
                      <>
                        {u.locked && <button className="btn-outline small" onClick={() => act(() => admin.unlock(u.id), 'Account unlocked')}>Unlock</button>}
                        <button className="btn-outline small" onClick={() => act(() => admin.setEnabled(u.id, !u.enabled), u.enabled ? 'Account disabled' : 'Account enabled')}>{u.enabled ? 'Disable' : 'Enable'}</button>
                        <button className="btn-ghost small danger" onClick={() => confirmDo(`Delete ${u.displayName} and all their gardens? This can't be undone.`, () => admin.deleteUser(u.id), 'Account deleted')}>Delete</button>
                      </>
                    ) : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shownUsers.length === 0 && <p className="empty">No accounts match.</p>}
        </div>
      )}

      {tab === 'gardens' && (
        <div className="table-wrap glass">
          <table className="table">
            <thead><tr><th>Name</th><th>Code</th><th>Owner</th><th>Status</th><th>Saved</th><th>Actions</th></tr></thead>
            <tbody>
              {shownGardens.map((g) => (
                <tr key={g.code}>
                  <td>{g.name}</td><td className="mono">{g.code}</td><td>{g.ownerName ?? '—'}</td>
                  <td><span className={`pill ${g.hidden ? 'bad' : g.published ? 'ok' : ''}`}>{g.hidden ? 'Hidden' : g.published ? 'In gallery' : 'Private'}</span></td>
                  <td>{when(g.createdAt)}</td>
                  <td className="actions">
                    <button className="btn-outline small" onClick={() => navigate(`/?${toQuery(clampParams(g), g.season.toLowerCase(), g.mode.toLowerCase())}`)}>Open</button>
                    <button className="btn-outline small" onClick={() => act(() => admin.setHidden(g.code, !g.hidden), g.hidden ? 'Visible again' : 'Hidden from the gallery')}>{g.hidden ? 'Unhide' : 'Hide'}</button>
                    <button className="btn-ghost small danger" onClick={() => confirmDo(`Delete "${g.name}"? This can't be undone.`, () => admin.deleteGarden(g.code), 'Garden deleted')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shownGardens.length === 0 && <p className="empty">No gardens match.</p>}
        </div>
      )}
    </main>
  );
}
