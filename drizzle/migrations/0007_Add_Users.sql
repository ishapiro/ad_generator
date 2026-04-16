CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  name          TEXT,
  google_sub    TEXT    NOT NULL UNIQUE,
  role          TEXT    NOT NULL DEFAULT 'member',
  suspended     INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER,
  last_login_at INTEGER
);

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0007_Add_Users', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0007_Add_Users');
