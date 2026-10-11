CREATE TABLE IF NOT EXISTS products (
    ean        text PRIMARY KEY,
    name       text,
    source     text NOT NULL,           -- 'off' (Open Food Facts), 'manual', 'scan'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
    id         bigserial PRIMARY KEY,
    ean        text NOT NULL,
    source     text NOT NULL,           -- 'phone', 'esp32', 'manual', 'missing-page'
    result     text NOT NULL,           -- 'added', 'unknown', 'error'
    scanned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scans_ean_idx ON scans (ean);
CREATE INDEX IF NOT EXISTS products_missing_idx ON products (created_at) WHERE name IS NULL;
