const list = document.getElementById('list');

function row(p) {
  const li = document.createElement('li');
  li.dataset.search = `${p.name} ${p.ean}`.toLowerCase();
  li.innerHTML = `
    <div class="ean">${escapeHtml(p.ean)} <span class="muted">· ${escapeHtml(p.source)}</span></div>
    <form>
      <input name="name" required autocomplete="off">
      <button type="submit">Rename</button>
    </form>
    <div class="result"></div>`;

  const form = li.querySelector('form');
  form.name.value = p.name;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const result = li.querySelector('.result');
    try {
      const r = await api('PUT', `/api/products/${encodeURIComponent(p.ean)}`, { name: form.name.value });
      li.dataset.search = `${r.name} ${p.ean}`.toLowerCase();
      result.innerHTML = '<span class="ok">Saved ✓</span>';
    } catch (err) {
      result.innerHTML = `<span class="err">${escapeHtml(err.message)}</span>`;
    }
  });
  return li;
}

document.getElementById('filter').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  list.querySelectorAll('li[data-search]').forEach((li) => {
    li.hidden = !li.dataset.search.includes(q);
  });
});

(async () => {
  try {
    const rows = await api('GET', '/api/products');
    list.innerHTML = rows.length ? '' : '<li class="muted">No named products yet.</li>';
    rows.forEach((p) => list.appendChild(row(p)));
  } catch (err) {
    list.innerHTML = `<li class="err">${escapeHtml(err.message)}</li>`;
  }
})();
