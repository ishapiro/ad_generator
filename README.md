# Ad Generator

A media and ad management platform for the Cogitations family of businesses. Cogitations team members use it to create polished ad images by combining AI-generated visuals with structured layouts from [Templated.io](https://templated.io). Built on Nuxt 4 + Cloudflare Workers.

Hosted at: **adgen.cogitations.com**

---

## Features

### Ad Profiles
The core unit of the app is an **Ad Profile** — a saved configuration that pairs a Templated.io layout with content for each of its layers. Profiles are reusable: you can tweak copy or prompts and regenerate as many times as you like. From the home page you can edit a profile, view its completed ads, or trigger a new generation in one click.

### Template gallery
Browse all templates in your Templated.io account with thumbnails, pixel dimensions, and layer counts. Select a template to start a new Ad Profile pre-wired to that layout.

### Layer editor
Each template layer is either **text** or **image**. The editor shows the original template thumbnail alongside the layer fields so you can see how your content maps to the layout.

Image layers offer two modes, switchable per layer:
- **AI Prompt** — write a natural-language description; [Fal.ai](https://fal.ai) (Flux 2 Pro model) generates the image at render time, sized to match the template's aspect ratio.
- **Upload / Library** — upload a PNG, JPEG, GIF, or SVG (e.g. a logo). Uploads are stored permanently in Cloudflare R2 and appear in a shared image library so they can be reused across profiles and layers without re-uploading.

### Saved prompt library
Frequently-used AI prompts can be saved with a name and recalled from a picker on any image layer. Prompts are shared across all profiles.

### Ad generation
Clicking **Generate Ad** runs the full pipeline: AI images are generated in parallel, uploaded images are staged for external access, and everything is composited by Templated.io into a final JPEG stored in R2. The pipeline typically completes in 30–90 seconds depending on the number of image layers.

### Completed ads
Each profile keeps a history of every generation run. Completed ads can be viewed full-size, downloaded, or deleted. After generating, the new ad is highlighted automatically in the completed ads modal.

### Template change detection
If a Templated.io template's layers change after a profile has been configured, the app detects the mismatch and prompts you to remap your content to the updated layout — carrying over any fields whose names still match.

---

## How the generation pipeline works

When you click **Generate Ad**:

1. All AI-prompt image layers are sent to **Fal.ai** in parallel, which returns public CDN URLs.
2. Uploaded image layers need a publicly accessible URL so Templated.io can fetch them:
   - **Production**: the Worker writes a temporary copy to R2 under a `tmp-` key and builds a URL pointing to its own `/api/images/` endpoint.
   - **Local dev**: the Worker POSTs the image bytes to the `/api/temp-images` endpoint on the production Worker (`adgen.cogitations.com`), which stores them in the real R2 bucket and returns a public URL.
3. All layer values (text strings + image URLs) are sent to the **Templated.io** render API, which composites them onto the chosen template and returns a JPEG URL.
4. The final JPEG is downloaded and stored permanently in **Cloudflare R2**.
5. Temporary `tmp-` keys are deleted immediately after the render completes. A bucket lifecycle rule auto-expires any `tmp-` objects that survive longer than 1 day as a safety net.

The result is displayed in-browser via `/api/images/[r2Key]`.

### Why a temp-images relay API?

Templated.io is an external service — it fetches image layers by HTTPS URL. Uploaded images live in Cloudflare R2, which is only reachable from your own Worker via the R2 binding. In production the Worker can serve images publicly via its own domain. In local dev the Worker runs at `localhost:8787`, which Templated.io cannot reach.

Rather than requiring a tunnel (ngrok etc.) for local development, we expose a small internal API on the production Worker (`POST /api/temp-images`, `DELETE /api/temp-images/[key]`). The local Worker POSTs uploaded image bytes there; they land in the real production R2 bucket and get a public URL for the duration of the render. This means local dev generates ads that include uploaded images with no extra setup.

The temp-images API is protected by the `X-Internal-Secret` header (matches `NUXT_ADGEN_PASSWORD`) to prevent external abuse.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Nuxt 4.4.2 + Vue 3.5.32 (Composition API, `<script setup>`) |
| Styling | Tailwind CSS (`@nuxtjs/tailwindcss`) |
| Backend | Nuxt server routes (Nitro), deployed as Cloudflare Workers |
| Database | Cloudflare D1 (SQLite), accessed via Drizzle ORM |
| Image storage | Cloudflare R2 |
| AI image generation | Fal.ai — `fal-ai/flux-2-pro` model |
| Temporary image staging | Internal `/api/temp-images` API (R2-backed, auto-expires after 1 day) |
| Ad composition | Templated.io render API |
| Deployment | Wrangler 4.x |

---

## Project structure

```
ad-generator/
├── pages/
│   ├── index.vue                  # Ad Profile list (home page)
│   ├── about.vue
│   ├── privacy.vue
│   ├── templates/
│   │   ├── index.vue              # Templated.io template gallery
│   │   └── [id].vue               # Configure new Ad Profile from template
│   └── ads/
│       ├── new.vue                # Create ad config (legacy)
│       ├── [id].vue               # Edit profile + generate + view completed ads
│       └── reconfigure/
│           └── [id].vue           # Remap layers when template structure changes
├── components/
│   ├── BulletStepEditor.vue       # Dynamic list editor for bullet steps (legacy)
│   └── ImageLayerInput.vue        # Image layer editor (AI prompt or upload)
├── server/
│   ├── api/
│   │   ├── health.get.ts
│   │   ├── ad-configs/
│   │   │   ├── index.get.ts           # List all Ad Profiles
│   │   │   ├── index.post.ts          # Create Ad Profile
│   │   │   ├── [id].get.ts            # Get profile + its generated ads
│   │   │   ├── [id].put.ts            # Update profile
│   │   │   ├── [id].delete.ts         # Delete profile + generated ads
│   │   │   └── [id]/
│   │   │       └── generate.post.ts   # Run the generation pipeline
│   │   ├── generated-ads/
│   │   │   └── [id].delete.ts         # Delete a single generated ad
│   │   ├── images/
│   │   │   └── [key].get.ts           # Serve image from R2
│   │   ├── temp-images/
│   │   │   ├── index.post.ts          # Stage uploaded image bytes in R2 (local dev relay)
│   │   │   └── [key].delete.ts        # Delete a staged temp image
│   │   ├── templated/
│   │   │   ├── templates.get.ts       # List Templated.io templates
│   │   │   └── templates/[id].get.ts  # Get template metadata + layers
│   │   ├── upload.post.ts             # Upload image to R2
│   │   ├── uploads.get.ts             # List uploaded images
│   │   └── prompts/                   # Saved prompt library CRUD
│   └── utils/
│       ├── db/
│       │   ├── schema.ts              # Drizzle schema
│       │   └── index.ts               # useDb(event) helper
│       └── r2.ts                      # useR2(event) helper
├── drizzle/migrations/                # SQL migration files
├── scripts/
│   ├── db-migrate.mjs                 # Idempotent D1 migration runner
│   └── db-studio.sh                   # Open Drizzle Studio against local D1
├── nuxt.config.ts
├── wrangler.toml                      # Cloudflare Workers config
└── .dev.vars                          # Local secrets (not committed)
```

---

## Database schema

### `ad_configs`
Stores the parameters for a reusable Ad Profile.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer PK | Auto-increment |
| `name` | text | Display name |
| `template_id` | text | Templated.io template ID |
| `template_layers` | text | JSON array of layer selections (`{layer, type, value?, prompt?, r2Key?, imageMode?}`) |
| `headline` | text | Legacy: main headline |
| `subheadline` | text | Legacy: subheadline |
| `body_text` | text | Legacy: body copy |
| `cta_text` | text | Legacy: CTA label |
| `hero_image_prompt` | text | Legacy: Fal.ai prompt for hero image |
| `background_description` | text | Legacy: background color description |
| `bullet_steps` | text | Legacy: JSON array of `{icon, label}` |
| `created_at` | integer | Unix timestamp |
| `updated_at` | integer | Unix timestamp |

### `generated_ads`
Tracks each generation run for a profile.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer PK | Auto-increment |
| `ad_config_id` | integer FK | References `ad_configs.id` |
| `status` | text | `pending` \| `generating` \| `complete` \| `error` |
| `r2_key` | text | Key of the final JPEG in the `adgen-images` R2 bucket |
| `error_message` | text | Error detail if status is `error` |
| `created_at` | integer | Unix timestamp |

### `uploaded_images`
Tracks user-uploaded images stored in R2.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer PK | Auto-increment |
| `filename` | text | Original filename |
| `mime_type` | text | MIME type (e.g. `image/png`) |
| `r2_key` | text | Key in the `adgen-images` R2 bucket |
| `created_at` | integer | Unix timestamp |

### `saved_prompts`
A reusable library of Fal.ai prompts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer PK | Auto-increment |
| `name` | text | Display name |
| `prompt` | text | Full prompt text |
| `created_at` | integer | Unix timestamp |

---

## Environment variables

Stored in `.dev.vars` for local development (never committed). Copy `.dev.vars.example` to get started.

| Variable | Description |
|----------|-------------|
| `NUXT_FAL_KEY` | Fal.ai API key — used for AI image generation only |
| `NUXT_TEMPLATED_API_KEY` | Templated.io API key |
| `NUXT_TEMPLATED_DESIGN_ID` | Default Templated.io template ID (legacy; new profiles store their own `templateId`) |
| `NUXT_ADGEN_PASSWORD` | Password protecting the app; also used as the `X-Internal-Secret` auth token for the temp-images API |
| `NUXT_PUBLIC_BASE_URL` | **Production only** — set to `https://adgen.cogitations.com` as a Wrangler secret. Leave empty in `.dev.vars`; local dev uses `NUXT_TEMP_STORAGE_URL` instead |
| `NUXT_TEMP_STORAGE_URL` | Base URL of the production Worker used as the temp-image relay during local dev. Defaults to `https://adgen.cogitations.com`; only override if self-hosting on a different domain |

For production, set secrets via Wrangler:
```bash
npx wrangler secret put NUXT_FAL_KEY
npx wrangler secret put NUXT_TEMPLATED_API_KEY
npx wrangler secret put NUXT_ADGEN_PASSWORD
npx wrangler secret put NUXT_PUBLIC_BASE_URL   # value: https://adgen.cogitations.com
```

---

## Cloudflare resources

| Resource | Name | Binding |
|----------|------|---------|
| D1 Database | `adgen-db` | `adgen_db` |
| R2 Bucket | `adgen-images` | `adgen_images` |

### R2 lifecycle rules

A lifecycle rule named `expire-tmp-files` is configured on the `adgen-images` bucket:

- **Prefix**: `tmp-`
- **Action**: expire objects after 1 day

This is a safety net. The generation pipeline deletes `tmp-` keys immediately after Templated.io fetches them; the lifecycle rule cleans up any keys that survive due to an unexpected crash.

To view or modify:
```bash
npx wrangler r2 bucket lifecycle list adgen-images
```

---

## Local development

### First-time setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy and fill in secrets:
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your API keys
   ```

3. Start the dev server (migrates DB, builds, launches Wrangler):
   ```bash
   npm run dev
   ```
   Open **http://localhost:8787**

Local D1 state lives in `.wrangler/` and persists across rebuilds.

### No tunnel needed for local development

Uploaded images work locally without ngrok or any tunnel. The local Worker fetches uploaded image bytes from the local R2 binding (`.wrangler/state/`) and POSTs them to the `/api/temp-images` endpoint on the production Worker (`adgen.cogitations.com`). Templated.io fetches the image from the production URL, and the temp key is deleted after the render completes.

This requires:
- `NUXT_ADGEN_PASSWORD` set in `.dev.vars` (must match the production secret)
- `NUXT_PUBLIC_BASE_URL` **not set** (empty) in `.dev.vars` — this is what triggers the local dev path
- The production Worker deployed and accessible at `https://adgen.cogitations.com`

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Migrate DB, build, start local Wrangler dev server |
| `npm run build` | Build for Cloudflare (output in `.output/`) |
| `npm run preview` | Start Wrangler dev without rebuilding |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run db:generate` | Generate a new SQL migration from schema changes |
| `npm run db:migrate` | Apply pending migrations to **local** D1 |
| `npm run db:migrate:remote` | Apply pending migrations to **remote** (production) D1 |
| `npm run db:migrate:both` | Apply to both local and remote |
| `npm run db:studio` | Open Drizzle Studio UI against the local D1 SQLite file |

---

## Deployment

### First deploy

1. Apply schema to production D1:
   ```bash
   npm run db:migrate:remote
   ```

2. Set production secrets:
   ```bash
   npx wrangler secret put NUXT_FAL_KEY
   npx wrangler secret put NUXT_TEMPLATED_API_KEY
   npx wrangler secret put NUXT_ADGEN_PASSWORD
   npx wrangler secret put NUXT_PUBLIC_BASE_URL   # value: https://adgen.cogitations.com
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

### Subsequent deploys

```bash
npm run deploy
```

If the schema changed, run `npm run db:migrate:remote` before or after deploying.

The custom domain `adgen.cogitations.com` is configured in `wrangler.toml`.

---

## Image generation pipeline

```
User clicks "Generate Ad"
        │
        ▼
POST /api/ad-configs/[id]/generate
        │
        ├─ Create generated_ads record (status: generating)
        │
        ├─ For each image layer (in parallel):
        │   ├─ imageMode=generate → Fal.ai (Flux 2 Pro)
        │   │     prompt → public CDN URL (e.g. https://v3.fal.media/...)
        │   │
        │   └─ imageMode=upload  → fetch bytes from R2 binding
        │       ├─ Production (publicBaseUrl set):
        │       │     write tmp-{uuid}.ext to R2 binding
        │       │     → URL: ${publicBaseUrl}/api/images/${tmpKey}
        │       │
        │       └─ Local dev (publicBaseUrl empty):
        │             POST bytes to https://adgen.cogitations.com/api/temp-images
        │             → URL: https://adgen.cogitations.com/api/images/${tmpKey}
        │
        ├─ Templated.io render API
        │   └─ All layer values (text + image URLs) → composited JPEG URL
        │
        ├─ Fetch JPEG from Templated.io URL
        ├─ Upload JPEG to R2 (adgen-images bucket) — permanent storage
        ├─ Delete all tmp- keys (local R2 delete or DELETE /api/temp-images/[key])
        │
        └─ Update generated_ads record (status: complete, r2_key: ...)
                │
                ▼
        Browser fetches /api/images/[r2Key] from R2
```

Fal.ai requests use the queue REST API with polling (3-second intervals, up to 60 attempts). The entire pipeline typically takes 30–90 seconds depending on the number of image layers. Cloudflare Workers on a paid plan support up to 15-minute wall-clock time; the free tier is limited to 30 seconds — use a paid plan for production.

---

## Database migrations

### Why a custom migration runner

Drizzle Kit ships a migration runner (`drizzle-kit migrate`) that works well with PostgreSQL and MySQL via direct connection strings. It does not work with Cloudflare D1 because D1 has no TCP connection — it is only accessible through the Wrangler CLI locally or through the Cloudflare Workers binding at runtime. There is no connection string that points at a local `.wrangler/` SQLite file or a remote D1 database.

The custom script (`scripts/db-migrate.mjs`) bridges this gap by shelling out to `wrangler d1 execute` for every SQL operation. It reuses Drizzle's `__drizzle_migrations` tracking table convention so the schema stays familiar, but drives Wrangler instead of a database driver. Drizzle ORM is still used for schema definition and type inference at runtime; only the migration *execution* is handled by the custom script.

### D1 / SQLite DDL limitations

D1 runs SQLite under the hood. SQLite's `ALTER TABLE` is far more restrictive than PostgreSQL or MySQL:

| Operation | PostgreSQL | SQLite / D1 |
|-----------|-----------|-------------|
| Add column | ✓ | ✓ (nullable, or `NOT NULL` with a default) |
| Drop column | ✓ | ✗ not supported |
| Rename column | ✓ | ✗ not supported in the SQLite version used by D1 |
| Change column type | ✓ | ✗ not supported |
| Add/drop constraint | ✓ | ✗ not supported |

To drop a column or change a type you must create a new table with the desired schema, copy data, drop the old table, and rename the new one. This is why **migrations are hand-written** rather than auto-generated by Drizzle Kit — Drizzle Kit's SQLite diff sometimes emits these multi-step rewrites incorrectly or omits steps when it cannot query the D1 database directly.

### Adding a migration

1. Modify the schema in [server/utils/db/schema.ts](server/utils/db/schema.ts).

2. Create `drizzle/migrations/NNNN_Description_In_Title_Case.sql`. Every file **must** include a tracking INSERT so the runner won't re-execute it:

   ```sql
   -- your DDL here

   INSERT INTO __drizzle_migrations (hash, created_at)
     SELECT 'NNNN_Description_In_Title_Case', (unixepoch() * 1000)
     WHERE NOT EXISTS (
       SELECT 1 FROM __drizzle_migrations WHERE hash = 'NNNN_Description_In_Title_Case'
     );
   ```

3. Apply locally and verify:
   ```bash
   npm run db:migrate
   ```

4. Apply to production before or after deploying:
   ```bash
   npm run db:migrate:remote
   ```
