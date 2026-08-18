const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'anatomy_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) setToken(null);
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) usp.set(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  listSystems: (bodyProfile) => request(`/api/systems${buildQuery({ bodyProfile })}`),
  listEntries: (system, bodyProfile) => request(`/api/entries${buildQuery({ system, bodyProfile })}`),
  getEntry: (id) => request(`/api/entries/${id}`),
  createEntry: (formData) => request('/api/entries', { method: 'POST', body: formData }),
  updateEntry: (id, formData) => request(`/api/entries/${id}`, { method: 'PUT', body: formData }),
  deleteEntry: (id) => request(`/api/entries/${id}`, { method: 'DELETE' }),
  getBodyMap: (profile) => request(`/api/bodymaps/${profile}`),
  saveBodyMap: (profile, formData) => request(`/api/bodymaps/${profile}`, { method: 'PUT', body: formData }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/api/auth/me'),
  listUsers: () => request('/api/users'),
  createUser: (email, password, role) =>
    request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
};

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_URL}${imageUrl}`;
}
