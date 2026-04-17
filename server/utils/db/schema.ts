import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ── Auth / users ──────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  email:       text('email').notNull().unique(),
  name:        text('name'),
  googleSub:   text('google_sub').notNull().unique(),
  role:        text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  suspended:   integer('suspended', { mode: 'boolean' }).notNull().default(false),
  createdAt:   integer('created_at',   { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
})

export type User = typeof users.$inferSelect

// ── Projects ──────────────────────────────────────────────────────────────────

export const projects = sqliteTable('projects', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  name:             text('name').notNull(),
  description:      text('description'),
  templatedApiKey:  text('templated_api_key'),
  createdAt:        integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt:        integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type Project = typeof projects.$inferSelect

export const projectMembers = sqliteTable('project_members', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  userId:    integer('user_id').notNull().references(() => users.id),
  role:      text('role', { enum: ['owner', 'editor'] }).notNull().default('editor'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type ProjectMember = typeof projectMembers.$inferSelect

// ── User invites ──────────────────────────────────────────────────────────────

export const userInvites = sqliteTable('user_invites', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  email:      text('email').notNull().unique(),
  role:       text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  projectIds: text('project_ids').notNull().default('[]'), // JSON: number[]
  createdAt:  integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export type UserInvite = typeof userInvites.$inferSelect

// ── Media ─────────────────────────────────────────────────────────────────────

export const mediaFolders = sqliteTable('media_folders', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  projectId: integer('project_id').references(() => projects.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ── Ad configs ────────────────────────────────────────────────────────────────

export const adConfigs = sqliteTable('ad_configs', {
  id:                    integer('id').primaryKey({ autoIncrement: true }),
  projectId:             integer('project_id').references(() => projects.id),
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

export type AdConfig = typeof adConfigs.$inferSelect

// ── Media library ─────────────────────────────────────────────────────────────

export const uploadedImages = sqliteTable('uploaded_images', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  projectId:   integer('project_id').references(() => projects.id),
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

export type UploadedImage = typeof uploadedImages.$inferSelect

// ── Prompts & briefs ──────────────────────────────────────────────────────────

export const savedPrompts = sqliteTable('saved_prompts', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').references(() => projects.id),
  name:      text('name').notNull(),
  prompt:    text('prompt').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const savedBriefs = sqliteTable('saved_briefs', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').references(() => projects.id),
  name:      text('name').notNull(),
  brief:     text('brief').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// ── Generated ads ─────────────────────────────────────────────────────────────

export const generatedAds = sqliteTable('generated_ads', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  adConfigId:   integer('ad_config_id').notNull().references(() => adConfigs.id),
  status:       text('status').notNull().default('pending'), // pending | generating | complete | error
  r2Key:        text('r2_key'),
  errorMessage: text('error_message'),
  createdAt:    integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
