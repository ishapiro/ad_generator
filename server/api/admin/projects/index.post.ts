import { projects } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ name?: string; description?: string | null }>(event)
  const name = body?.name?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'Name is required' })

  const db = useDb(event)
  const now = new Date()
  const [project] = await db
    .insert(projects)
    .values({ name, description: body?.description ?? null, createdAt: now, updatedAt: now })
    .returning()

  return { project }
})
