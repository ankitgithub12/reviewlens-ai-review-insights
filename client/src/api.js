// Empty by default: the API is on the same origin (Vite proxy in dev, nginx or Express in production).
// Set VITE_API_URL at build time when the frontend is hosted separately from the backend.
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

export const getHealth = () => request('/api/health');

export function analyzeCsv(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/api/analyze', { method: 'POST', body: form });
}

export function suggestReply(review) {
  return request('/api/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: review.product, review_text: review.text }),
  });
}
