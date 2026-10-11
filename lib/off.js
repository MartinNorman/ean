// Open Food Facts product lookup.
const { request } = require('./http');

const URL_TEMPLATE = 'https://world.openfoodfacts.org/api/v2/product/{ean}.json';
const FIELDS = 'product_name,product_name_sv,product_name_en,brands';
// OFF asks API clients to identify themselves.
const USER_AGENT = 'ean-shopping-scanner/1.0 (home use)';

function nameFromProduct(product) {
  const keys = ['product_name_sv', 'product_name', 'product_name_en'];
  const key = keys.find((k) => (product[k] || '').trim());
  if (!key) return null;
  let name = product[key].trim();
  const brand = (product.brands || '').split(',')[0].trim();
  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
    name = `${name} (${brand})`;
  }
  return name;
}

/** Return a product name from Open Food Facts, or null if not found / unavailable. */
async function lookupName(ean) {
  const url = `${URL_TEMPLATE.replace('{ean}', ean)}?fields=${FIELDS}`;
  try {
    const resp = await request(url, { headers: { 'User-Agent': USER_AGENT } });
    if (resp.status === 404) return null;
    if (resp.status !== 200) throw new Error(`HTTP ${resp.status}`);
    const data = JSON.parse(resp.text);
    if (data.status !== 1 || !data.product) return null;
    return nameFromProduct(data.product);
  } catch (err) {
    console.warn(`[OFF] Lookup failed for ${ean}: ${err.message}`);
    return null;
  }
}

module.exports = { lookupName, nameFromProduct };
