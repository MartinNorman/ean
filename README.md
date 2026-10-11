# EAN scanner → Home Assistant shopping list

Scan a barcode with your phone (or, later, an ESP32 scanner):

- **Known EAN** → the product name is added to the Home Assistant shopping list.
- **New EAN** → looked up in [Open Food Facts](https://world.openfoodfacts.org). If found, it is saved and added to the list.
  If not, it is saved without a name and shows up on **/missing**, where you name it (and optionally add it to the list).

Runs exactly like the recept app: plain Node.js (Package Center) on the Synology, started by `synology/start.sh`,
with data in the Postgres on the NAS.

## Install on the NAS

1. **Database**: create a database in the NAS Postgres (port 5433), e.g. `CREATE DATABASE ean;`.
   The tables are created automatically on first start. You can also reuse an existing database and set
   `DB_SCHEMA=ean` to keep the tables in their own schema.
2. **Copy the project** to `/volume1/homes/Martin/ean` (it's already there if you work on `Z:\Martin\ean`).
3. **Configure**: copy `.env.example` to `.env` and fill in the DB password and `HA_TOKEN`
   (you can reuse the values from `recept/.env`).
4. **Install dependencies** (SSH to the NAS):
   ```bash
   cd /volume1/homes/Martin/ean
   npm install --omit=dev    # node/npm live in /usr/local/bin on this NAS
   ```
5. **Start**: `bash synology/start.sh`, then open `http://192.168.50.60:3001`.
   Stop with `synology/stop.sh`, check with `synology/status.sh`, logs are in `logs/app.log`.
6. **Autostart**: Control Panel → Task Scheduler → Create → Triggered Task → User-defined script,
   user `root`, event *Boot-up*, command `bash /volume1/homes/Martin/ean/synology/start.sh`.

## HTTPS for the phone camera

Browsers only allow camera access over HTTPS. (Typing the EAN manually works over plain HTTP.)
Use the reverse proxy built into DSM:

1. Control Panel → Login Portal → Advanced → **Reverse Proxy** → Create:
   - Source: protocol `HTTPS`, hostname `*`, port `3443`
   - Destination: protocol `HTTP`, hostname `localhost`, port `3001`
2. Open `https://192.168.50.60:3443` on the phone.
   - With DSM's default self-signed certificate you'll get a warning once; accept it (the camera then works).
   - For no warning: use a Let's Encrypt certificate (Control Panel → Security → Certificate), e.g. via a
     `*.synology.me` DDNS name, and use that hostname instead of the IP.
3. Tap *Start camera* and add the page to the home screen.

## API (for the ESP32 later)

```
POST http://192.168.50.60:3001/api/scan
{"ean": "7310865004703", "source": "esp32"}
→ {"status": "added" | "unknown" | "invalid" | "error", "ean": "...", "name": "...", "message": "..."}
```

With ESPHome, a GM65/GM861 UART scanner can call this using the `http_request.post` action.

## Development

```
npm install
npm test
```

Files: `index.js` (entry point), `app.js` (routes), `lib/` (scan logic, DB, Home Assistant, Open Food Facts),
`public/` (pages), `db/schema.sql`, `synology/` (start/stop/status).
