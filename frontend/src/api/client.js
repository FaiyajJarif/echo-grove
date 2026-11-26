/**
 * Backend client. With no VITE_API_URL the app runs fully as a guest and every
 * call throws OfflineError, which pages show as a friendly "not connected" state.
 */
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'echogrove.token';
const USER_KEY = 'echogrove.user';

export class OfflineError extends Error {
  constructor() { super('The backend is not connected yet.'); this.name = 'OfflineError'; }
}

const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

export const getUser = () => { try { return JSON.parse(store.get(USER_KEY) || 'null'); } catch { return null; } };
export const isOnline = () => !!BASE;

async function request(path, { method = 'GET', body } = {}) {
  if (!BASE) throw new OfflineError();
  const token = store.get(TOKEN_KEY);
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new OfflineError();
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401 && token) { store.set(TOKEN_KEY, null); store.set(USER_KEY, null); }
  if (!res.ok) {
    const err = new Error(data?.detail || data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.errors = data?.errors;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  presets: () => request('/api/presets'),
  recent: (limit = 12) => request(`/api/gardens?limit=${limit}`),
  getGarden: (code) => request(`/api/gardens/${encodeURIComponent(code)}`),
  saveGarden: (garden) => request('/api/gardens', { method: 'POST', body: garden }),
  myGardens: () => request('/api/me/gardens'),
  deleteGarden: (code) => request(`/api/gardens/${encodeURIComponent(code)}`, { method: 'DELETE' }),
};

export const admin = {
  stats: () => request('/api/admin/stats'),
  gardens: () => request('/api/admin/gardens?limit=50'),
  setHidden: (code, hidden) => request(`/api/admin/gardens/${encodeURIComponent(code)}`, { method: 'PATCH', body: { hidden } }),
  users: () => request('/api/admin/users?limit=50'),
  setEnabled: (id, enabled) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: { enabled } }),
  unlock: (id) => request(`/api/admin/users/${id}/unlock`, { method: 'POST' }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  deleteGarden: (code) => request(`/api/gardens/${encodeURIComponent(code)}`, { method: 'DELETE' }),
};

export const auth = {
  async login(email, password) {
    const data = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    store.set(TOKEN_KEY, data.token);
    store.set(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },
  register: (email, displayName, password) => request('/api/auth/register', { method: 'POST', body: { email, displayName, password } }),
  verifyEmail: (token) => request('/api/auth/verify-email', { method: 'POST', body: { token } }),
  resend: (email) => request('/api/auth/resend-verification', { method: 'POST', body: { email } }),
  /** Reloads the signed-in user (e.g. after verifying the email). Signs out if the token expired. */
  async refresh() {
    try {
      const user = await request('/api/me');
      store.set(USER_KEY, JSON.stringify(user));
      return user;
    } catch (e) {
      if (e.status === 401) auth.logout();
      throw e;
    }
  },
  logout() { store.set(TOKEN_KEY, null); store.set(USER_KEY, null); },
};
