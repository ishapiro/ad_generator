CREATE TABLE `saved_prompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`prompt` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO __drizzle_migrations (hash, created_at)
SELECT '0003_add_saved_prompts', (unixepoch() * 1000)
WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0003_add_saved_prompts');
