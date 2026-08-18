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

export const api = {
  listSystems: () => request('/api/systems'),
  listEntries: (system) => request(`/api/entries${system ? `?system=${encodeURIComponent(system)}` : ''}`),
  getEntry: (id) => request(`/api/entries/${id}`),
  createEntry: (formData) => request('/api/entries', { method: 'POST', body: formData }),
  updateEntry: (id, formData) => request(`/api/entries/${id}`, { method: 'PUT', body: formData }),
  deleteEntry: (id) => request(`/api/entries/${id}`, { method: 'DELETE' }),
};

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_URL}${imageUrl}`;
}
