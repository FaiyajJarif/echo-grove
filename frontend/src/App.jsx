import { useEffect } from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { api } from './api/client';
import GardenCodePage from './pages/GardenCodePage';
import TopBar from './ui/TopBar';
import { ToastProvider } from './ui/Toast';
import GrovePage from './pages/GrovePage';
import GalleryPage from './pages/GalleryPage';
import MyGrovePage from './pages/MyGrovePage';
import AuthPage from './pages/AuthPage';
import VerifyPage from './pages/VerifyPage';
import AdminPage from './pages/AdminPage';

function NotFound() {
  return (
    <main className="page narrow">
      <section className="glass holo hero-card"><h1>This branch doesn't exist</h1><p>The page you opened isn't part of the grove.</p>
        <div className="row"><Link className="btn-primary" to="/">Back to the Grove</Link></div></section>
    </main>
  );
}

export default function App() {
  const { pathname } = useLocation();
  // Wake a sleeping free-tier backend early, so it's ready when the user saves.
  useEffect(() => { api.health().catch(() => {}); }, []);
  return (
    <ToastProvider>
      <div className="sky" aria-hidden="true"><div className="stars" /><div className="stars s2" /><div className="grid-floor" /></div>
      <button className="skip" onClick={() => document.getElementById('main')?.focus()}>Skip to content</button>
      <div className={`app ${pathname === '/' ? 'on-grove' : ''}`}>
        <TopBar />
        <div id="main" className="app-main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<GrovePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/my-grove" element={<MyGrovePage />} />
            <Route path="/signin" element={<AuthPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/g/:code" element={<GardenCodePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </ToastProvider>
  );
}
