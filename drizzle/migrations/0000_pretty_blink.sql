CREATE TABLE `ad_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`headline` text NOT NULL,
	`subheadline` text NOT NULL,
	`body_text` text NOT NULL,
	`cta_text` text NOT NULL,
	`hero_image_prompt` text NOT NULL,
	`background_description` text NOT NULL,
	`bullet_steps` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `generated_ads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad_config_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`r2_key` text,
	`error_message` text,
	`created_at` integer,
	FOREIGN KEY (`ad_config_id`) REFERENCES `ad_configs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO __drizzle_migrations (hash, created_at)
SELECT '0000_pretty_blink', (unixepoch() * 1000)
WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0000_pretty_blink');
