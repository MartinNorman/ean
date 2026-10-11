// In-memory stand-ins for Postgres and Home Assistant.

class FakeRepo {
  constructor(products = {}) {
    this.products = { ...products }; // ean -> name (null = unnamed)
    this.scans = [];
  }
  async getProduct(ean) {
    return ean in this.products ? { ean, name: this.products[ean], source: 'manual' } : null;
  }
  async insertProduct(ean, name) {
    if (!(ean in this.products)) this.products[ean] = name;
  }
  async setName(ean, name) {
    if (!(ean in this.products)) return false;
    this.products[ean] = name;
    return true;
  }
  async logScan(ean, source, result) {
    this.scans.push([ean, source, result]);
  }
  async listMissing() {
    return Object.entries(this.products)
      .filter(([, name]) => name === null)
      .map(([ean]) => ({ ean, created_at: new Date().toISOString(), scan_count: 1 }));
  }
  async listProducts() {
    return Object.entries(this.products)
      .filter(([, name]) => name)
      .map(([ean, name]) => ({ ean, name, source: 'manual' }));
  }
}

class FakeHA {
  constructor({ fail = false } = {}) {
    this.items = [];
    this.fail = fail;
  }
  async addItem(name) {
    if (this.fail) throw new Error('boom');
    this.items.push(name);
  }
}

module.exports = { FakeRepo, FakeHA };
