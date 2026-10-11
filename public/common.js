// Shared helpers for the pages.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function api(method, url, body) {
  const resp = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok && !data.status) throw new Error(data.error || `HTTP ${resp.status}`);
  return data;
}
