import { eq } from 'drizzle-orm'
import { users } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid user id' })

  const body = await readBody<{ role?: string; suspended?: boolean }>(event)

  const updates: Record<string, unknown> = {}
  if (body?.role !== undefined) {
    if (!['admin', 'member'].includes(body.role)) {
      throw createError({ statusCode: 400, message: 'Invalid role' })
    }
    updates.role = body.role
  }
  if (body?.suspended !== undefined) {
    if (id === session.sub) {
      throw createError({ statusCode: 400, message: 'You cannot suspend your own account' })
    }
    updates.suspended = body.suspended
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Nothing to update' })
  }

  const db = useDb(event)
  const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, message: 'User not found' })

  return { user: updated }
})
