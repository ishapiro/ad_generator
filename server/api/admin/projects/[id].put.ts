import { eq } from 'drizzle-orm'
import { projects } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid project id' })

  const body = await readBody<{ name?: string; description?: string | null; templatedApiKey?: string | null }>(event)
  const name = body?.name?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'Name is required' })

  const db = useDb(event)
  const [project] = await db
    .update(projects)
    .set({ name, description: body?.description ?? null, templatedApiKey: body?.templatedApiKey?.trim() || null, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  return { project }
})
