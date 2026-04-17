CREATE TABLE IF NOT EXISTS user_invites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member',
  project_ids TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0011_Add_User_Invites', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0011_Add_User_Invites');
