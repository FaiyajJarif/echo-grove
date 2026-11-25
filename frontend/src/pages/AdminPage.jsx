import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin, getUser } from '../api/client';
import { useToast } from '../ui/Toast';

export default function AdminPage() {
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    Promise.all([admin.stats(), admin.gardens(), admin.users()])
      .then(([s, g, u]) => { setStats(s); setGardens(g); setUsers(u); })
      .catch((e) => setError(e.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user?.role !== 'ADMIN') {
    return (
      <main className="page narrow">
        <section className="glass holo hero-card">
          <h1>Admins only</h1>
          <p>This area moderates the public gallery. Sign in with an admin account to continue.</p>
          <div className="row"><Link className="btn-primary" to="/signin">Sign in</Link><Link className="btn-ghost" to="/">Back to the Grove</Link></div>
        </section>
      </main>
    );
  }

  const hide = async (g) => {
    try { const n = await admin.setHidden(g.code, !g.hidden); setGardens((l) => l.map((x) => (x.code === g.code ? n : x))); toast(n.hidden ? 'Hidden from the gallery' : 'Visible again'); } catch (e) { toast(e.message); }
  };
  const enable = async (u) => {
    try { const n = await admin.setEnabled(u.id, !u.enabled); setUsers((l) => l.map((x) => (x.id === u.id ? n : x))); toast(n.enabled ? 'Account enabled' : 'Account disabled'); } catch (e) { toast(e.message); }
  };

  return (
    <main className="page">
      <header className="page-head"><h1>Admin</h1><p>Hide gardens from the gallery and manage accounts.</p></header>
      {error && <p className="empty glass">{error}</p>}
      {stats && (
        <div className="stats wide">
          {[['users', 'Users'], ['verifiedUsers', 'Verified'], ['gardens', 'Gardens'], ['publishedGardens', 'Published'], ['hiddenGardens', 'Hidden']].map(([k, l]) => (
            <div key={k} className="glass"><strong>{stats[k]}</strong><span>{l}</span></div>
          ))}
        </div>
      )}
      <h2 className="section-title">Recent gardens</h2>
      <div className="table-wrap glass">
        <table className="table">
          <thead><tr><th>Name</th><th>Code</th><th>Owner</th><th>Status</th><th /></tr></thead>
          <tbody>
            {gardens.map((g) => (
              <tr key={g.code}>
                <td>{g.name}</td><td className="mono">{g.code}</td><td>{g.ownerName ?? '—'}</td>
                <td>{g.hidden ? 'Hidden' : g.published ? 'Published' : 'Private'}</td>
                <td><button className="btn-outline small" onClick={() => hide(g)}>{g.hidden ? 'Unhide' : 'Hide'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="section-title">Accounts</h2>
      <div className="table-wrap glass">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName}</td><td>{u.email}</td><td>{u.role}</td><td>{u.emailVerified ? 'Yes' : 'No'}</td>
                <td>{u.role !== 'ADMIN' && <button className="btn-outline small" onClick={() => enable(u)}>{u.enabled ? 'Disable' : 'Enable'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
