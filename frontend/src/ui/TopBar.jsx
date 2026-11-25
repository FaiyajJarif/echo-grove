import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Icon } from './Icons';
import { getUser } from '../api/client';

const LINKS = [['/', 'Grove'], ['/gallery', 'Gallery'], ['/my-grove', 'My Grove']];

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const user = getUser();
  return (
    <header className="topbar glass holo">
      <Link to="/" className="brand" aria-label="Echo Grove home">
        <span className="brand-mark" aria-hidden="true"><Icon.seed /></span>
        <span><strong>Echo Grove</strong><small>recursive soundscapes</small></span>
      </Link>
      <button className="icon-btn menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? <Icon.close /> : <Icon.menu />}
      </button>
      <nav className={`nav ${open ? 'open' : ''}`} aria-label="Main">
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={to} end onClick={() => setOpen(false)}>{label}</NavLink>
        ))}
        {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={() => setOpen(false)}>Admin</NavLink>}
        <NavLink to="/signin" className="btn-outline" onClick={() => setOpen(false)}>{user ? user.displayName : 'Sign in'}</NavLink>
      </nav>
    </header>
  );
}
