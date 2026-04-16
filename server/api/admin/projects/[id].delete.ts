import { eq } from 'drizzle-orm'
import { projectMembers, projects } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid project id' })

  const db = useDb(event)
  await db.delete(projectMembers).where(eq(projectMembers.projectId, id))
  const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning()
  if (!deleted) throw createError({ statusCode: 404, message: 'Project not found' })

  return { ok: true }
})
