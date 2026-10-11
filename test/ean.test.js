const test = require('node:test');
const assert = require('node:assert');
const { normalize } = require('../lib/ean');

test('valid EAN-13', () => assert.strictEqual(normalize('7310865004703'), '7310865004703'));
test('valid EAN-8', () => assert.strictEqual(normalize('96385074'), '96385074'));
test('UPC-A becomes EAN-13', () => assert.strictEqual(normalize('036000291452'), '0036000291452'));
test('strips whitespace', () => assert.strictEqual(normalize(' 7310865004703\n'), '7310865004703'));
test('bad checksum', () => assert.strictEqual(normalize('7310865004704'), null));
test('wrong length or characters', () => {
  assert.strictEqual(normalize('12345'), null);
  assert.strictEqual(normalize('73108650047ab'), null);
  assert.strictEqual(normalize(''), null);
  assert.strictEqual(normalize(undefined), null);
});
