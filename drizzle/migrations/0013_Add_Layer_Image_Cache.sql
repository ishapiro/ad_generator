ALTER TABLE generated_ads ADD COLUMN layer_image_cache TEXT;

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0013_Add_Layer_Image_Cache', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0013_Add_Layer_Image_Cache');
