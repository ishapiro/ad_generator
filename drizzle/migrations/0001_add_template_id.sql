ALTER TABLE `ad_configs` ADD COLUMN `template_id` text;
--> statement-breakpoint
INSERT INTO __drizzle_migrations (hash, created_at)
SELECT '0001_add_template_id', (unixepoch() * 1000)
WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0001_add_template_id');
