require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Same variable names as the recept app, so its .env values can be reused.
function env(name, defaultValue) {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.replace(/\r/g, '').trim();
}

module.exports = {
  database: {
    host: env('DB_HOST', '192.168.50.60'),
    port: parseInt(env('DB_PORT', '5432'), 10),
    database: env('DB_NAME', 'ean'),
    user: env('DB_USER', 'postgres'),
    password: env('DB_PASSWORD', ''),
    schema: env('DB_SCHEMA', ''),
  },
  server: {
    port: parseInt(env('PORT', '3001'), 10),
  },
  homeAssistant: {
    baseUrl: env('HA_BASE_URL', '').replace(/\/+$/, ''),
    token: env('HA_TOKEN', ''),
  },
  openFoodFacts: {
    enabled: env('OFF_ENABLED', 'true').toLowerCase() === 'true',
  },
};
