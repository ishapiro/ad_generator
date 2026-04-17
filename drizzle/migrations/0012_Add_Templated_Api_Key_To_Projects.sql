ALTER TABLE projects ADD COLUMN templated_api_key TEXT;

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0012_Add_Templated_Api_Key_To_Projects', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0012_Add_Templated_Api_Key_To_Projects');
