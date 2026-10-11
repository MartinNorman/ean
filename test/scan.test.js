const test = require('node:test');
const assert = require('node:assert');
const { handleScan } = require('../lib/scan');
const { FakeRepo, FakeHA } = require('./fakes');

const KNOWN = '7310865004703';
const NEW = '96385074';

async function run(code, repo, { offName = null, haFails = false } = {}) {
  const ha = new FakeHA({ fail: haFails });
  const lookedUp = [];
  const result = await handleScan(code, 'test', {
    repo,
    lookupName: async (ean) => {
      lookedUp.push(ean);
      return offName;
    },
    addToList: (name) => ha.addItem(name),
  });
  return { result, added: ha.items, lookedUp };
}

test('known product is added to the list without lookup', async () => {
  const repo = new FakeRepo({ [KNOWN]: 'Mjölk' });
  const { result, added, lookedUp } = await run(KNOWN, repo);
  assert.strictEqual(result.status, 'added');
  assert.deepStrictEqual(added, ['Mjölk']);
  assert.deepStrictEqual(lookedUp, []);
  assert.deepStrictEqual(repo.scans, [[KNOWN, 'test', 'added']]);
});

test('new product found in Open Food Facts is saved and added', async () => {
  const repo = new FakeRepo();
  const { result, added } = await run(NEW, repo, { offName: 'Havregryn' });
  assert.strictEqual(result.status, 'added');
  assert.strictEqual(repo.products[NEW], 'Havregryn');
  assert.deepStrictEqual(added, ['Havregryn']);
});

test('new product not in Open Food Facts is stored unnamed', async () => {
  const repo = new FakeRepo();
  const { result, added } = await run(NEW, repo);
  assert.strictEqual(result.status, 'unknown');
  assert.strictEqual(repo.products[NEW], null);
  assert.deepStrictEqual(added, []);
});

test('unnamed existing product stays unknown without a new lookup', async () => {
  const repo = new FakeRepo({ [NEW]: null });
  const { result, added, lookedUp } = await run(NEW, repo);
  assert.strictEqual(result.status, 'unknown');
  assert.deepStrictEqual(lookedUp, []);
  assert.deepStrictEqual(added, []);
});

test('invalid code is rejected and not stored', async () => {
  const repo = new FakeRepo();
  const { result } = await run('123', repo);
  assert.strictEqual(result.status, 'invalid');
  assert.deepStrictEqual(repo.products, {});
  assert.deepStrictEqual(repo.scans, []);
});

test('Home Assistant failure is reported as error', async () => {
  const repo = new FakeRepo({ [KNOWN]: 'Mjölk' });
  const { result } = await run(KNOWN, repo, { haFails: true });
  assert.strictEqual(result.status, 'error');
  assert.deepStrictEqual(repo.scans, [[KNOWN, 'test', 'error']]);
});
