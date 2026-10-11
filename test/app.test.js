// HTTP-level tests of the Express app with fake repo / HA.
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../app');
const { FakeRepo, FakeHA } = require('./fakes');

async function withServer(deps, fn) {
  const server = createApp(deps).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body) => {
    const resp = await fetch(base + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const type = resp.headers.get('content-type') || '';
    return { status: resp.status, body: type.includes('json') ? await resp.json() : await resp.text() };
  };
  try {
    await fn(call);
  } finally {
    server.close();
  }
}

test('scan, name on missing page, and pages are served', async () => {
  const repo = new FakeRepo({ '7310865004703': 'Mjölk' });
  const ha = new FakeHA();
  await withServer({ repo, ha, lookupName: async () => null }, async (call) => {
    let r = await call('POST', '/api/scan', { ean: '7310865004703', source: 'phone' });
    assert.strictEqual(r.body.status, 'added');

    r = await call('POST', '/api/scan', { ean: '96385074', source: 'esp32' });
    assert.strictEqual(r.body.status, 'unknown');

    r = await call('POST', '/api/scan', { ean: 'abc' });
    assert.strictEqual(r.status, 400);

    r = await call('GET', '/api/missing');
    assert.deepStrictEqual(r.body.map((p) => p.ean), ['96385074']);

    r = await call('PUT', '/api/products/96385074', { name: ' Havregryn ', addToList: true });
    assert.deepStrictEqual(r.body, { ean: '96385074', name: 'Havregryn', added: true });

    r = await call('PUT', '/api/products/96385074', { name: '' });
    assert.strictEqual(r.status, 400);

    r = await call('PUT', '/api/products/00000000', { name: 'x' });
    assert.strictEqual(r.status, 404);

    assert.deepStrictEqual(ha.items, ['Mjölk', 'Havregryn']);

    for (const page of ['/', '/missing', '/products', '/scan.js', '/style.css']) {
      r = await call('GET', page);
      assert.strictEqual(r.status, 200, page);
    }
  });
});
