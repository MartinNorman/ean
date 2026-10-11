// Scan handling, independent of Express/Postgres/HA so it can be unit tested.

const { normalize } = require('./ean');

/**
 * @param {string} rawCode   scanned code
 * @param {string} source    'phone', 'esp32', 'manual', ...
 * @param {object} deps      { repo, lookupName(ean), addToList(name) }
 * @returns {Promise<{status: 'added'|'unknown'|'invalid'|'error', ean: string, name?: string, message?: string}>}
 */
async function handleScan(rawCode, source, { repo, lookupName, addToList }) {
  const ean = normalize(rawCode);
  if (!ean) {
    return { status: 'invalid', ean: String(rawCode == null ? '' : rawCode), message: 'Not a valid EAN code' };
  }

  let name;
  const product = await repo.getProduct(ean);
  if (!product) {
    name = await lookupName(ean);
    await repo.insertProduct(ean, name, name ? 'off' : 'scan');
  } else {
    name = product.name;
  }

  let result;
  if (!name) {
    result = { status: 'unknown', ean, message: 'Unknown product, give it a name on the Missing page' };
  } else {
    try {
      await addToList(name);
      result = { status: 'added', ean, name };
    } catch (err) {
      console.error(`[HA] Failed to add "${name}": ${err.message}`);
      result = { status: 'error', ean, name, message: `Home Assistant error: ${err.message}` };
    }
  }

  await repo.logScan(ean, source, result.status);
  return result;
}

module.exports = { handleScan };
