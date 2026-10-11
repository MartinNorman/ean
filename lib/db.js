const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SCHEMA_SQL = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

function quoteIdent(name) {
  return '"' + name.replace(/"/g, '""') + '"';
}

class Repo {
  constructor(dbConfig) {
    const { schema, ...conn } = dbConfig;
    this.schema = schema;
    this.pool = new Pool({
      ...conn,
      max: 5,
      ...(schema ? { options: `-c search_path=${schema}` } : {}),
    });
  }

  /** Create the schema (if DB_SCHEMA is set) and tables if they don't exist. */
  async init() {
    if (this.schema) {
      await this.pool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(this.schema)}`);
    }
    await this.pool.query(SCHEMA_SQL);
  }

  async close() {
    await this.pool.end();
  }

  async getProduct(ean) {
    const { rows } = await this.pool.query('SELECT ean, name, source FROM products WHERE ean = $1', [ean]);
    return rows[0] || null;
  }

  async insertProduct(ean, name, source) {
    await this.pool.query(
      'INSERT INTO products (ean, name, source) VALUES ($1, $2, $3) ON CONFLICT (ean) DO NOTHING',
      [ean, name, source]
    );
  }

  /** Returns true if a product row was updated. */
  async setName(ean, name) {
    const { rowCount } = await this.pool.query(
      "UPDATE products SET name = $1, source = 'manual', updated_at = now() WHERE ean = $2",
      [name, ean]
    );
    return rowCount > 0;
  }

  async logScan(ean, source, result) {
    await this.pool.query('INSERT INTO scans (ean, source, result) VALUES ($1, $2, $3)', [ean, source, result]);
  }

  async listMissing() {
    const { rows } = await this.pool.query(`
      SELECT p.ean, p.created_at,
             (SELECT count(*)::int FROM scans s WHERE s.ean = p.ean) AS scan_count
      FROM products p
      WHERE p.name IS NULL
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  async listProducts() {
    const { rows } = await this.pool.query(
      'SELECT ean, name, source, updated_at FROM products WHERE name IS NOT NULL ORDER BY lower(name)'
    );
    return rows;
  }
}

module.exports = Repo;
