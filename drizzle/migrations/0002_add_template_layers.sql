ALTER TABLE `ad_configs` ADD COLUMN `template_layers` text;
--> statement-breakpoint
INSERT INTO __drizzle_migrations (hash, created_at)
SELECT '0002_add_template_layers', (unixepoch() * 1000)
WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0002_add_template_layers');
