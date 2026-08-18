const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
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
};

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_URL}${imageUrl}`;
}
