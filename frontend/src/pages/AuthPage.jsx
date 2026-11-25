import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth, OfflineError } from '../api/client';
import { useToast } from '../ui/Toast';
import { Icon } from '../ui/Icons';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME = /^[\p{L}\p{N} .,'!?-]{2,40}$/u;

export default function AuthPage() {
  const [sp, setSp] = useSearchParams();
  const register = sp.get('mode') === 'register';
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const validate = () => {
    const e = {};
    if (!EMAIL.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (register && !NAME.test(form.name.trim())) e.name = '2 to 40 letters, numbers or simple punctuation';
    if (form.password.length < 8 || form.password.length > 72) e.password = 'Use 8 to 72 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setNotice('');
    if (!validate()) return;
    setBusy(true);
    try {
      if (register) {
        await auth.register(form.email.trim(), form.name.trim(), form.password);
        setNotice('Check your inbox: we sent a link to verify your email. It works once and expires in 24 hours.');
      } else {
        await auth.login(form.email.trim(), form.password);
        toast('Welcome back');
        navigate('/my-grove');
      }
    } catch (e) {
      if (e instanceof OfflineError) setNotice('Accounts go live when the backend is connected. Everything musical already works as a guest.');
      else if (e.status === 429) setNotice('Too many attempts. Please wait a minute and try again.');
      else setNotice(register ? e.message : 'Email or password is incorrect.');
    } finally { setBusy(false); }
  };

  return (
    <main className="page narrow">
      <form className="glass holo auth-card" onSubmit={submit} noValidate>
        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={!register} className={!register ? 'on' : ''} onClick={() => setSp({})}>Sign in</button>
          <button type="button" role="tab" aria-selected={register} className={register ? 'on' : ''} onClick={() => setSp({ mode: 'register' })}>Create account</button>
        </div>
        <h1>{register ? 'Plant your first account' : 'Welcome back'}</h1>
        <p className="sub">{register ? 'Save gardens and share them in the gallery.' : 'Sign in to open My Grove.'}</p>

        <label className="input-field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} />
          {errors.email && <em role="alert">{errors.email}</em>}
        </label>
        {register && (
          <label className="input-field">
            <span>Display name</span>
            <input className="input" autoComplete="nickname" maxLength={40} value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
            {errors.name && <em role="alert">{errors.name}</em>}
          </label>
        )}
        <label className="input-field">
          <span>Password</span>
          <div className="pw">
            <input className="input" type={show ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'}
              maxLength={72} value={form.password} onChange={set('password')} aria-invalid={!!errors.password} />
            <button type="button" className="icon-btn" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}><Icon.eye /></button>
          </div>
          {errors.password && <em role="alert">{errors.password}</em>}
        </label>

        {notice && <p className="notice" role="status">{notice}</p>}
        <button className="btn-primary wide" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
        <Link className="btn-ghost wide" to="/">Continue as guest</Link>
      </form>
    </main>
  );
}
