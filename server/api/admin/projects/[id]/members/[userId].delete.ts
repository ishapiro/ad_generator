import { and, eq } from 'drizzle-orm'
import { projectMembers } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const projectId = Number(getRouterParam(event, 'id'))
  const userId = Number(getRouterParam(event, 'userId'))
  if (!Number.isFinite(projectId) || !Number.isFinite(userId)) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }

  const db = useDb(event)
  const [deleted] = await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .returning()

  if (!deleted) throw createError({ statusCode: 404, message: 'Membership not found' })
  return { ok: true }
})
