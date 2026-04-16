# ad-generator — Project-Level Claude Instructions

## Tech Stack Summary

- **Frontend**: Nuxt 3, Vue 3 Composition API, TypeScript
- **Styling**: Tailwind CSS (exclusively — no custom CSS)
- **Database**: Cloudflare D1 (SQLite), Drizzle ORM for schema/migrations, native D1 API at runtime
- **Deployment**: Cloudflare Workers

---

## Vue / Nuxt Conventions

### Always use `<script setup lang="ts">`

Never use the Options API. Every page and component uses:

```vue
<script setup lang="ts">
// ...
</script>
```

`definePageMeta` must be the first statement in every page's script block.

### Data loading with `useFetch`

Use `useFetch` for declarative page-level data loading. Always supply an explicit `key:` so the Nuxt SSR cache can be targeted for invalidation.

```ts
const { data, pending } = await useFetch<ResponseType>('/api/some-resource', {
  key: 'descriptive-page-key',
})
```

Key naming convention: `'resource-context'` or `'resource-pagename'`, e.g. `'ad-configs-index'`. For route-dependent data, use a computed key: `key: () => \`ad-config-${idParam.value}\``.

### Nuxt cache invalidation — required before navigation

**After any mutation that changes data another page displays, you must invalidate the cache before navigating away.** Failure to do this causes stale data to appear on the destination page until the user manually refreshes.

- `clearNuxtData('key')` — discard cached data; next fetch will re-request from server
- `refreshNuxtData('key')` — re-fetch immediately; use when staying on the same page

```ts
// Navigating away after a mutation
clearNuxtData('ad-configs-index')
await navigateTo('/ad-configs')

// Staying on the same page after a mutation
await refreshNuxtData(`ad-config-${idParam.value}`)
```

If a mutation affects multiple caches, clear all affected keys.

### Use `$fetch` for mutations

Use `$fetch` (not `useFetch`) for imperative write operations (POST, PUT, PATCH, DELETE). Always supply the method and body explicitly. Prefer typed generics.

```ts
const res = await $fetch<{ id: number }>('/api/ad-configs', {
  method: 'POST',
  body: { name: name.value.trim() },
})
```

### Route params

Access route params via `useRoute()` and wrap in a computed so reactive dependencies update correctly:

```ts
const route = useRoute()
const idParam = computed(() => route.params.id as string)
```

### Navigation

Always `await` calls to `navigateTo`:

```ts
await navigateTo(`/ad-configs/${res.id}`)
```

---

## Styling

### Tailwind CSS only (with one exception — images)

All styling must use Tailwind utility classes. Do not write custom CSS, `<style>` blocks, or inline `style=""` attributes.

**Exception: `<img>` elements displaying external thumbnails must use raw inline `style=""` — see the Image Display section below.**

### Mobile-first responsive design

Use Tailwind's default breakpoints with mobile-first base styles, expanding layout at `sm:` and `md:`:

```html
<div class="grid gap-4 sm:grid-cols-2">
```

### Standard UI patterns

These class patterns are used consistently throughout the application. Use them for new UI rather than inventing alternatives:

**Primary button**
```
rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors
hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
disabled:pointer-events-none disabled:opacity-50
```

**Secondary / outline button**
```
rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700
transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500
```

**Text input**
```
rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm
focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
```

**Card / panel**
```
rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6
```

**Modal overlay**
```
fixed inset-0 z-50 flex items-center justify-center bg-black/50
```

**Error text**
```
text-sm text-red-600
```

**Success text**
```
text-sm text-emerald-600
```

### Color palette

| Purpose | Color |
|---------|-------|
| Primary action | `blue-600` / `blue-700` |
| Neutral / text | `slate-*` |
| Success | `emerald-*` |
| Warning | `amber-*` |
| Danger | `red-*` |

### Touch targets

Interactive elements must meet minimum touch-target sizes. Add `min-h-[44px] min-w-[36px] touch-manipulation` to buttons and links in navigation/footer contexts.

---

## TypeScript

### Define response types inline on pages

Response types for `useFetch` are defined locally in the page that uses them, not extracted to a shared types file:

```ts
const { data } = await useFetch<{
  config: {
    id: number
    name: string
    headline: string
  } | null
}>('/api/ad-configs/1', { key: 'ad-config-detail' })
```

### DB row types come from Drizzle inference

For server-side code, derive types from the schema rather than writing them manually:

```ts
// server/utils/db/schema.ts
export type AdConfig = typeof adConfigs.$inferSelect
```

### Use `interface` for object shapes, `type` for unions

```ts
interface AdConfig {
  id: number
  name: string
  headline: string
}

type GenerationStatus = 'pending' | 'processing' | 'complete' | 'error'
```

---

## Forms

### State management

Simple forms use individual `ref`s. Complex forms use a single object `ref`:

```ts
// Simple
const name = ref('')

// Complex
const form = ref({
  name: '',
  headline: '',
  ctaText: '',
})
```

### Submit handler pattern

Every form submit follows this structure exactly:

```ts
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  submitting.value = true
  try {
    const res = await $fetch<...>('/api/...', { method: 'POST', body: { ... } })
    clearNuxtData('affected-cache-key')
    await navigateTo('/destination')
  } catch (e: unknown) {
    error.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Fallback error message'
        : 'Fallback error message'
  } finally {
    submitting.value = false
  }
}
```

Disable the submit button while submitting and change its label:

```html
<button type="submit" :disabled="submitting || !name.trim()">
  {{ submitting ? 'Saving…' : 'Save' }}
</button>
```

Display error inline above the button:

```html
<p v-if="error" class="text-sm text-red-600">{{ error }}</p>
```

### Validation

Use HTML5 attributes for basic validation (`required`, `type="email"`, `min`, `max`). Validate additional constraints in the submit handler before calling `$fetch`. The server always re-validates — client validation is for UX only.

---

## Server API Routes

### File naming

Routes use HTTP-method suffixes:

```
server/api/resource/index.get.ts
server/api/resource/index.post.ts
server/api/resource/[id].put.ts
server/api/resource/[id].delete.ts
```

### Input validation

Validate all input immediately after reading the body:

```ts
const body = await readBody<{ name?: string }>(event)
const name = body?.name?.trim()
if (!name) throw createError({ statusCode: 400, message: 'Name is required' })
```

### Errors

Always use `createError` with explicit `statusCode` and `message`:

```ts
throw createError({ statusCode: 404, message: 'Ad config not found' })
throw createError({ statusCode: 400, message: 'Invalid input' })
```

### DB queries with Drizzle

The DB is available via `useDb(event)`. Use `.get()` for single-row queries, `.all()` for lists, `.run()` for mutations that don't need returning data, and `.returning()` for mutations that do.

```ts
const db = useDb(event)

// Single row
const [config] = await db.select().from(adConfigs).where(eq(adConfigs.id, id)).limit(1)
if (!config) throw createError({ statusCode: 404, message: 'Ad config not found' })

// Mutation with return
const [updated] = await db
  .update(adConfigs)
  .set({ name })
  .where(eq(adConfigs.id, id))
  .returning()
```

---

## UI Patterns

### Loading and empty states

Always handle both states:

```html
<div v-if="pending">Loading…</div>
<div v-else-if="items.length === 0">No items found.</div>
<ul v-else>…</ul>
```

### Modals

Modals use `v-if` (not `v-show`), close on self-click, and are not Teleported unless overlapping z-index is a real issue:

```html
<div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showModal = false">
  <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
    <!-- content -->
  </div>
</div>
```

### Backdrop click handler — required on every `fixed inset-0` modal

**Every `fixed inset-0` overlay must have `@click.self` on the backdrop element.** Without it, clicking outside the modal panel does nothing, which traps the user.

```html
<div
  class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-6"
  @click.self="closeModal"
>
  <div class="relative w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
    <!-- panel content -->
  </div>
</div>
```

`@click.self` fires only when the click target is the backdrop element itself, not a child. Clicking inside the panel never closes the modal — only clicking the dimmed area does.

**Reusable modal components** emit a `close` event; pages wire it up:

```html
<!-- Component template -->
<div class="fixed inset-0 ..." @click.self="$emit('close')">

<!-- Page usage -->
<MyModal v-if="showModal" @close="showModal = false" />
```

---

## Image Display

### Tailwind preflight breaks image sizing — use raw inline styles

**Root cause:** Tailwind preflight globally injects `max-width: 100%; height: auto` on every `<img>` element. This loads the moment Tailwind is used anywhere in the project. It cannot be overridden by Tailwind utility classes (`w-full`, `h-auto`, `max-w-none`) or Vue `:style="{...}"` bindings — those approaches proved unreliable in practice.

**The only reliable fix:** use a static `style=""` attribute directly on the `<img>` element with `max-width: none` to defeat the preflight rule. Vue dynamic bindings (`:src`, `:alt`) can still be mixed with a static `style=""` on the same element.

**Do NOT:**
- Use Tailwind classes on the `<img>` element (`w-full`, `h-auto`, `max-w-none`, etc.)
- Use Vue `:style="{...}"` binding for image sizing
- Set HTML `width` and `height` attributes to API-reported canvas dimensions when the actual image file has different dimensions — the browser uses those attributes for `aspect-ratio: auto` which conflicts with the loaded image ratio

**Working pattern for thumbnail images in a grid or detail view:**

```html
<!-- Container: static style="" for border/radius/overflow, NOT Tailwind classes -->
<div style="overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
  <img
    :src="item.thumbnail"
    :alt="item.name"
    style="display: block; width: 100%; height: auto; max-width: none;"
  />
</div>
```

To constrain the size of the thumbnail (e.g. on a detail page), add `max-width` to the container:

```html
<div style="max-width: 320px; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
  <img
    :src="item.thumbnail"
    :alt="item.name"
    style="display: block; width: 100%; height: auto; max-width: none;"
  />
</div>
```

This mirrors the pattern from plain HTML and is the only approach that was confirmed working after extensive debugging. Do not revisit Tailwind-class-based image sizing without first reading the debugging history for this project.

---

## Known Build Quirks

### "Duplicated imports useAppConfig" warning

**Symptom:** Build prints this warning 4–5 times but succeeds:
```
WARN  Duplicated imports "useAppConfig", the one from "nitropack/runtime/internal/config"
      has been ignored and "@nuxt/nitro-server/dist/runtime/utils/app-config" is used
```

**Root cause:** A bug in `unimport`'s `dedupeImports`. `@nuxt/nitro-server` registers `useAppConfig` with `priority: -1` intending it to silently lose to nitropack's entry, but the `Math.max` fallback clamps the denominator to `1`, making `priorityDiff = 0` → warning fires instead. Triggered by npm hoisting `std-env@4.x` to the top level (varies by lock-file state).

**Fix already applied** in `nuxt.config.ts` — `nitro.imports.warn` filters the message. Do not remove it. Note: `warn: false` does not work (falsy falls back to `console.warn`); must be a function.

---

## Database Migrations (Cloudflare D1 / Drizzle)

### Why we wrote a custom migration runner

Drizzle Kit ships a migration runner (`drizzle-kit migrate`) that works well with PostgreSQL and MySQL via direct connection strings. It does not work with Cloudflare D1 because D1 has no TCP connection — it is only accessible through the Wrangler CLI locally or through the Cloudflare Workers binding at runtime. There is no way to give Drizzle Kit a connection string that points at a local `.wrangler/` SQLite file or a remote D1 database.

The custom script (`scripts/db-migrate.mjs`) bridges this gap by shelling out to `wrangler d1 execute` for every SQL operation. It reuses Drizzle's `__drizzle_migrations` tracking table convention so the schema stays familiar, but drives Wrangler instead of a database driver. Drizzle ORM is still used for schema definition and type inference at runtime; only the migration *execution* is handled by the custom script.

### D1 / SQLite DDL limitations

D1 runs SQLite under the hood. SQLite's `ALTER TABLE` is far more restrictive than PostgreSQL or MySQL:

| Operation | PostgreSQL | SQLite / D1 |
|-----------|-----------|-------------|
| Add column | ✓ | ✓ (only `NOT NULL` columns with a default, or nullable columns) |
| Drop column | ✓ | ✗ — not supported |
| Rename column | ✓ | ✗ — not supported in older SQLite versions used by D1 |
| Change column type | ✓ | ✗ — not supported |
| Add/drop constraint | ✓ | ✗ — not supported |

To drop a column or change a type in SQLite you must: create a new table with the desired schema, copy data, drop the old table, and rename the new one. This is why **migrations are hand-written** — Drizzle Kit's auto-generated SQLite migrations sometimes emit these multi-step rewrites incorrectly, or omit steps entirely when it cannot diff accurately against a D1 database it cannot directly query. Writing migrations by hand ensures the exact SQL that runs is what was reviewed and tested.

Additionally, Wrangler's `d1 execute` response envelope varies between releases (sometimes `{ results }`, sometimes `[{ results }]`). The custom script normalises both shapes so migrations don't silently fail.

### Every migration file MUST include a tracking INSERT

The custom migration runner (`npm run db:migrate`) checks `__drizzle_migrations` before executing each file. If the hash is not recorded after the DDL runs, the file will be re-executed on every subsequent migrate call, causing "duplicate column" or "table already exists" errors.

**Required pattern for every `.sql` file in `drizzle/migrations/`:**

```sql
-- your DDL here (ALTER TABLE, CREATE TABLE, etc.)

INSERT INTO __drizzle_migrations (hash, created_at)
  SELECT '<NNNN_Migration_Name>', (unixepoch() * 1000)
  WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = '<NNNN_Migration_Name>');
```

The hash value must exactly match the filename without the `.sql` extension (e.g., file `0001_Add_Some_Column.sql` → hash `0001_Add_Some_Column`).

### Naming convention

Files must be zero-padded sequential numbers followed by a descriptive name:

```
NNNN_Description_In_Title_Case.sql
```

Examples: `0001_Add_Status_Column.sql`, `0002_Add_R2_Key.sql`

Skip no numbers. The next migration number is one higher than the highest existing file.

### Running migrations

```bash
# Local D1 (in .wrangler/)
npm run db:migrate

# Remote production D1
npm run db:migrate -- --remote
```

Always run local first, verify, then run remote.

### If a migration ran without the tracking INSERT

The column/table was created but the hash was never recorded. Fix by manually inserting the hash:

```bash
npx wrangler d1 execute adgen-db --local --command \
  "INSERT INTO __drizzle_migrations (hash, created_at) SELECT 'NNNN_Name', (unixepoch() * 1000) WHERE NOT EXISTS (SELECT 1 FROM __drizzle_migrations WHERE hash = 'NNNN_Name');" \
  --yes
```

Replace `--local` with `--remote` for production.

### Schema definition

Columns are defined in `server/utils/db/schema.ts` using Drizzle ORM. After adding a column to the schema, create a matching migration file. Migrations are hand-written — do not rely on Drizzle Kit auto-generation.

### Deployment checklist

1. Add column/table to `server/utils/db/schema.ts`
2. Create `drizzle/migrations/NNNN_Description.sql` with DDL + tracking INSERT
3. Run `npm run db:migrate` locally and verify no errors
4. Build and test locally (`npm run dev`)
5. Deploy code: `npm run deploy`
6. Apply migration to production: `npm run db:migrate -- --remote`

---

## Google OAuth Auth Pattern

**This project is the reference implementation** for Google OAuth + users + projects + role-based access on Nuxt 3 + Cloudflare Workers. When copying auth to a new project, use this project (and Backtick for simpler auth) as the source.

### The one rule that matters

Use a **non-global** `middleware/auth.ts`. Never `middleware/auth.global.ts`.

**Why global middleware breaks locally:** Cloudflare Workers with `custom_domain = true` in `wrangler.toml` causes SSR sub-requests (from `useFetch`) to resolve to the custom domain even when running on `localhost:8787`. A global middleware runs on every SSR render — its `useFetch('/api/auth/session')` sub-request hits the *production* Worker, which may not have the new auth code, returning a 500.

### Correct middleware pattern

**`middleware/auth.ts`** — non-global, pages opt in via `definePageMeta`:
```ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { data } = await useFetch<{ user: { id: number; email: string; name: string | null; role: string } | null }>(
    '/api/auth/session',
    { key: 'auth-session' },
  )
  useState('auth-user', () => data.value?.user ?? null)
  if (!data.value?.user) {
    return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath))
  }
})
```

**`middleware/admin.ts`** — reads `useState` set by auth middleware:
```ts
export default defineNuxtRouteMiddleware(() => {
  const user = useState<{ role: string } | null>('auth-user')
  if (!user.value) return navigateTo('/login')
  if (user.value.role !== 'admin') return navigateTo('/')
})
```

**Page opt-in:**
```ts
definePageMeta({ middleware: ['auth'] })           // regular pages
definePageMeta({ middleware: ['auth', 'admin'] })  // admin pages — auth must run first
```

**All `useFetch` on protected pages** must use `server: false`:
```ts
const { data } = await useFetch('/api/resource', { key: '...', server: false })
```

### Environment variables (`.dev.vars` + Wrangler secrets)

```
NUXT_GOOGLE_CLIENT_ID=
NUXT_GOOGLE_CLIENT_SECRET=
NUXT_SESSION_SECRET=          # random string for JWT signing
# NUXT_OAUTH_REDIRECT_ORIGIN  # leave blank in production; http://localhost:8787 only if needed locally
```

### Key server files

| File | Purpose |
|------|---------|
| `server/utils/session.ts` | JWT create/verify, cookie helpers |
| `server/utils/auth.ts` | `requireSession()`, `requireAdmin()`, `requireProjectAccess()` |
| `server/api/auth/google.get.ts` | Redirects to Google OAuth |
| `server/api/auth/callback.get.ts` | Handles callback, upserts user, sets JWT cookie |
| `server/api/auth/session.get.ts` | Returns current user from JWT |
| `server/api/auth/logout.get.ts` | Clears cookie |
