ALTER TABLE ad_configs       ADD COLUMN project_id INTEGER REFERENCES projects(id);
ALTER TABLE uploaded_images  ADD COLUMN project_id INTEGER REFERENCES projects(id);
ALTER TABLE media_folders    ADD COLUMN project_id INTEGER REFERENCES projects(id);
ALTER TABLE saved_prompts    ADD COLUMN project_id INTEGER REFERENCES projects(id);
ALTER TABLE saved_briefs     ADD COLUMN project_id INTEGER REFERENCES projects(id);

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '0009_Add_Project_Id_To_Resources', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '0009_Add_Project_Id_To_Resources');
