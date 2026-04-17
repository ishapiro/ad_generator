import { eq } from 'drizzle-orm'
import { projects } from '~/server/utils/db/schema'
import { requireProjectAccess } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid project id' })

  await requireProjectAccess(event, id)

  const body = await readBody<{ templatedApiKey?: string }>(event)
  const key = body?.templatedApiKey?.trim() ?? null

  const db = useDb(event)
  const [project] = await db
    .update(projects)
    .set({ templatedApiKey: key || null, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()

  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  return { project }
})
