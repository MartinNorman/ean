const path = require('path');
const express = require('express');
const { handleScan } = require('./lib/scan');

/**
 * Build the Express app. Dependencies are injected so tests can use fakes.
 * @param {object} deps { repo, ha, lookupName(ean) }
 */
function createApp({ repo, ha, lookupName }) {
  const app = express();
  app.use(express.json());

  app.use(
    express.static(path.join(__dirname, 'public'), {
      extensions: ['html'],
      setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
    })
  );

  const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Single entry point for every scanner (phone page, ESP32, manual entry).
  app.post(
    '/api/scan',
    wrap(async (req, res) => {
      const { ean, source = 'unknown' } = req.body || {};
      const result = await handleScan(ean, String(source), {
        repo,
        lookupName,
        addToList: (name) => ha.addItem(name),
      });
      console.log(`${new Date().toISOString()} scan ${result.ean} from ${source} -> ${result.status}`);
      res.status(result.status === 'invalid' ? 400 : 200).json(result);
    })
  );

  app.get('/api/missing', wrap(async (req, res) => res.json(await repo.listMissing())));

  app.get('/api/products', wrap(async (req, res) => res.json(await repo.listProducts())));

  // Set the name of a product. Body: { name, addToList }
  app.put(
    '/api/products/:ean',
    wrap(async (req, res) => {
      const name = String((req.body && req.body.name) || '').trim();
      if (!name) return res.status(400).json({ error: 'Name cannot be empty' });
      if (!(await repo.setName(req.params.ean, name))) {
        return res.status(404).json({ error: 'Unknown EAN' });
      }

      const result = { ean: req.params.ean, name, added: false };
      if (req.body.addToList) {
        try {
          await ha.addItem(name);
          await repo.logScan(req.params.ean, 'missing-page', 'added');
          result.added = true;
        } catch (err) {
          console.error(`[HA] Failed to add "${name}": ${err.message}`);
          result.haError = err.message;
        }
      }
      res.json(result);
    })
  );

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  });

  return app;
}

module.exports = { createApp };
