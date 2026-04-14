import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
  createdAt:             integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt:             integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const generatedAds = sqliteTable('generated_ads', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  adConfigId:   integer('ad_config_id').notNull().references(() => adConfigs.id),
  status:       text('status').notNull().default('pending'), // pending | generating | complete | error
  r2Key:        text('r2_key'),
  errorMessage: text('error_message'),
  createdAt:    integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
