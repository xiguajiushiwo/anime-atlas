PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL, unlocked_at INTEGER);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL, access_code_hash TEXT REFERENCES activation_codes(code_hash));
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS activation_codes (code_hash TEXT PRIMARY KEY, batch TEXT NOT NULL, claimed_by TEXT REFERENCES users(id), claimed_at INTEGER, disabled INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS fulfillment_orders (order_key TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE REFERENCES activation_codes(code_hash), code_cipher TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), mode TEXT NOT NULL, preferences TEXT NOT NULL, selection TEXT NOT NULL, created_at INTEGER NOT NULL, report TEXT);
CREATE INDEX IF NOT EXISTS runs_user_created ON runs(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
