import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, OfflineError } from '../api/client';
import { toQuery } from '../data/params';
import { toGarden } from './MyGrovePage';

/** #/g/<code>: loads a saved garden and opens it in the Grove. */
export default function GardenCodePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    api.getGarden(code)
      .then((g) => { const x = toGarden(g); navigate(`/?${toQuery(x.params, x.season, x.mode)}`, { replace: true }); })
      .catch((e) => setError(e instanceof OfflineError ? 'Share codes work once the backend is connected.' : e.status === 404 ? 'No garden has this code.' : e.message));
  }, [code, navigate]);
  return (
    <main className="page narrow">
      <section className="glass holo hero-card" aria-live="polite">
        <h1>{error ? 'Garden not found' : 'Opening garden…'}</h1>
        <p>{error || <span className="mono">{code}</span>}</p>
        {error && <div className="row"><Link className="btn-primary" to="/">Back to the Grove</Link></div>}
      </section>
    </main>
  );
}
