CREATE TABLE `saved_briefs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brief` text NOT NULL,
	`created_at` integer
);

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0006_Add_Saved_Briefs', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0006_Add_Saved_Briefs');
