// Entry point. Deliberately not called server.js: the recept app's stop/start scripts
// kill any process matching "node.*server.js".
const config = require('./config');
const Repo = require('./lib/db');
const HomeAssistant = require('./lib/ha');
const { lookupName } = require('./lib/off');
const { createApp } = require('./app');

async function main() {
  const repo = new Repo(config.database);
  await repo.init();
  console.log(`Connected to Postgres ${config.database.host}:${config.database.port}/${config.database.database}`);

  const app = createApp({
    repo,
    ha: new HomeAssistant(config.homeAssistant),
    lookupName: config.openFoodFacts.enabled ? lookupName : async () => null,
  });

  app.listen(config.server.port, '0.0.0.0', () => {
    console.log(`EAN scanner running on http://0.0.0.0:${config.server.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
