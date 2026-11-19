async function request(url, options) {
  const response = await fetch(url, options);
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
