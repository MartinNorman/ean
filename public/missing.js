const list = document.getElementById('list');
const intro = document.getElementById('intro');

function row(p) {
  const li = document.createElement('li');
  const when = new Date(p.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
  li.innerHTML = `
    <div class="ean">${escapeHtml(p.ean)}</div>
    <div class="meta">
      First scanned ${escapeHtml(when)} · ${p.scan_count} scan(s) ·
      <a href="https://world.openfoodfacts.org/product/${encodeURIComponent(p.ean)}" target="_blank" rel="noopener">OFF</a> ·
      <a href="https://www.google.com/search?q=${encodeURIComponent(p.ean)}" target="_blank" rel="noopener">Google</a>
    </div>
    <form>
      <input name="name" placeholder="Product name" required autocomplete="off">
      <label class="check"><input type="checkbox" name="add" checked> Add to shopping list</label>
      <button type="submit" class="primary">Save</button>
    </form>
    <div class="result"></div>`;

  const form = li.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const r = await api('PUT', `/api/products/${encodeURIComponent(p.ean)}`, {
        name: form.name.value,
        addToList: form.add.checked,
      });
      let note = '';
      if (r.added) note = ' and added to the shopping list';
      else if (r.haError) note = `, but Home Assistant failed: ${r.haError}`;
      li.classList.add('saved');
      form.remove();
      li.querySelector('.result').innerHTML = `<span class="ok">Saved as “${escapeHtml(r.name)}”${escapeHtml(note)}</span>`;
    } catch (err) {
      button.disabled = false;
      li.querySelector('.result').innerHTML = `<span class="err">${escapeHtml(err.message)}</span>`;
    }
  });
  return li;
}

(async () => {
  try {
    const rows = await api('GET', '/api/missing');
    intro.textContent = rows.length
      ? 'These barcodes were scanned but have no name yet.'
      : 'No unnamed barcodes. 🎉';
    rows.forEach((p) => list.appendChild(row(p)));
  } catch (err) {
    intro.innerHTML = `<span class="err">${escapeHtml(err.message)}</span>`;
  }
})();
