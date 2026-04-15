CREATE TABLE IF NOT EXISTS media_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

ALTER TABLE uploaded_images ADD COLUMN description TEXT;
ALTER TABLE uploaded_images ADD COLUMN keywords TEXT;
ALTER TABLE uploaded_images ADD COLUMN alt_text TEXT;
ALTER TABLE uploaded_images ADD COLUMN source TEXT;
ALTER TABLE uploaded_images ADD COLUMN copyright TEXT;
ALTER TABLE uploaded_images ADD COLUMN folder_id INTEGER REFERENCES media_folders(id);
ALTER TABLE uploaded_images ADD COLUMN locked INTEGER NOT NULL DEFAULT 0;

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0005_Add_Media_Enhancements', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0005_Add_Media_Enhancements');
