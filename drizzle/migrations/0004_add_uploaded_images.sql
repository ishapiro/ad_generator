CREATE TABLE `uploaded_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`r2_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL DEFAULT 'image/jpeg',
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO __drizzle_migrations (hash, created_at)
SELECT '0004_add_uploaded_images', (unixepoch() * 1000)
WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0004_add_uploaded_images');
