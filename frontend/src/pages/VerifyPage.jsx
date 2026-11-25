import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { auth, OfflineError } from '../api/client';

const TEXT = {
  checking: ['Verifying your email…', 'One moment.'],
  ok: ['Email verified', 'You can now save and publish gardens.'],
  bad: ['This link has expired or was already used', 'Sign in and ask for a new verification email.'],
  offline: ['Not connected yet', 'Email verification goes live when the backend is connected.'],
  missing: ['No verification link', 'Open the link from your email to verify your account.'],
};

export default function VerifyPage() {
  const [sp] = useSearchParams();
  const token = sp.get('token');
  const [state, setState] = useState(token ? 'checking' : 'missing');
  useEffect(() => {
    if (!token) return;
    auth.verifyEmail(token).then(() => { setState('ok'); auth.refresh().catch(() => {}); }).catch((e) => setState(e instanceof OfflineError ? 'offline' : 'bad'));
  }, [token]);
  const [title, body] = TEXT[state];
  return (
    <main className="page narrow">
      <section className="glass holo hero-card" aria-live="polite">
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="row">
          <Link className="btn-primary" to={state === 'ok' ? '/my-grove' : '/signin'}>{state === 'ok' ? 'Open My Grove' : 'Go to sign in'}</Link>
          <Link className="btn-ghost" to="/">Back to the Grove</Link>
        </div>
      </section>
    </main>
  );
}
