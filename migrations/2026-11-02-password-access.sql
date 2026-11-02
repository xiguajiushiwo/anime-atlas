-- For existing databases created before password-only access. Apply once.
-- New databases should use schema.sql instead.
ALTER TABLE sessions ADD COLUMN access_code_hash TEXT REFERENCES activation_codes(code_hash);
CREATE TABLE IF NOT EXISTS fulfillment_orders (
  order_key TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE REFERENCES activation_codes(code_hash),
  code_cipher TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
