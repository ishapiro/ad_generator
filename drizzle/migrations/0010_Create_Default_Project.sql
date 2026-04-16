-- Create the Default project for all pre-existing data
INSERT INTO projects (name, description, created_at, updated_at)
  SELECT 'Default', 'Migrated from pre-auth era', (unixepoch() * 1000), (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Default');

-- Assign all existing resources to the Default project
UPDATE ad_configs      SET project_id = (SELECT id FROM projects WHERE name = 'Default') WHERE project_id IS NULL;
UPDATE uploaded_images SET project_id = (SELECT id FROM projects WHERE name = 'Default') WHERE project_id IS NULL;
UPDATE media_folders   SET project_id = (SELECT id FROM projects WHERE name = 'Default') WHERE project_id IS NULL;
UPDATE saved_prompts   SET project_id = (SELECT id FROM projects WHERE name = 'Default') WHERE project_id IS NULL;
UPDATE saved_briefs    SET project_id = (SELECT id FROM projects WHERE name = 'Default') WHERE project_id IS NULL;

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0010_Create_Default_Project', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0010_Create_Default_Project');
