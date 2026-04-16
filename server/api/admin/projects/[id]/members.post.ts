import { and, eq } from 'drizzle-orm'
import { projectMembers, users } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const projectId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(projectId)) throw createError({ statusCode: 400, message: 'Invalid project id' })

  const body = await readBody<{ userId?: number; role?: string }>(event)
  const userId = Number(body?.userId)
  if (!Number.isFinite(userId)) throw createError({ statusCode: 400, message: 'userId is required' })

  const role = body?.role ?? 'editor'
  if (!['owner', 'editor'].includes(role)) throw createError({ statusCode: 400, message: 'Invalid role' })

  const db = useDb(event)

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  const existing = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1)

  if (existing[0]) {
    const [updated] = await db
      .update(projectMembers)
      .set({ role: role as 'owner' | 'editor' })
      .where(eq(projectMembers.id, existing[0].id))
      .returning()
    return { member: updated }
  }

  const [member] = await db
    .insert(projectMembers)
    .values({ projectId, userId, role: role as 'owner' | 'editor' })
    .returning()

  return { member }
})
