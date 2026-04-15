import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const mediaFolders = sqliteTable('media_folders', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const adConfigs = sqliteTable('ad_configs', {
  id:                    integer('id').primaryKey({ autoIncrement: true }),
  name:                  text('name').notNull(),
  headline:              text('headline').notNull(),
  subheadline:           text('subheadline').notNull(),
  bodyText:              text('body_text').notNull(),
  ctaText:               text('cta_text').notNull(),
  heroImagePrompt:       text('hero_image_prompt').notNull(),
  backgroundDescription: text('background_description').notNull(),
  bulletSteps:           text('bullet_steps').notNull(), // JSON: [{icon: string, label: string}]
  templateId:            text('template_id'),            // Templated.io template/design ID
  templateLayers:        text('template_layers'),         // JSON: [{layer, type, value?, prompt?}]
  createdAt:             integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt:             integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const uploadedImages = sqliteTable('uploaded_images', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  r2Key:       text('r2_key').notNull(),
  filename:    text('filename').notNull(),
  mimeType:    text('mime_type').notNull().default('image/jpeg'),
  description: text('description'),
  keywords:    text('keywords'),    // JSON: string[]
  altText:     text('alt_text'),
  source:      text('source'),
  copyright:   text('copyright'),
  folderId:    integer('folder_id').references(() => mediaFolders.id),
  locked:      integer('locked').notNull().default(0),
  createdAt:   integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const savedPrompts = sqliteTable('saved_prompts', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  prompt:    text('prompt').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const savedBriefs = sqliteTable('saved_briefs', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  brief:     text('brief').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const generatedAds = sqliteTable('generated_ads', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  adConfigId:   integer('ad_config_id').notNull().references(() => adConfigs.id),
  status:       text('status').notNull().default('pending'), // pending | generating | complete | error
  r2Key:        text('r2_key'),
  errorMessage: text('error_message'),
  createdAt:    integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
