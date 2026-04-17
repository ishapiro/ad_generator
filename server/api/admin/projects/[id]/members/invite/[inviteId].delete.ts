import { eq } from 'drizzle-orm'
import { userInvites } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const projectId = Number(getRouterParam(event, 'id'))
  const inviteId = Number(getRouterParam(event, 'inviteId'))
  if (!Number.isFinite(projectId) || !Number.isFinite(inviteId)) {
    throw createError({ statusCode: 400, message: 'Invalid id' })
  }

  const db = useDb(event)
  const [invite] = await db.select().from(userInvites).where(eq(userInvites.id, inviteId)).limit(1)
  if (!invite) throw createError({ statusCode: 404, message: 'Invite not found' })

  const ids = (JSON.parse(invite.projectIds) as number[]).filter(id => id !== projectId)

  if (ids.length === 0) {
    await db.delete(userInvites).where(eq(userInvites.id, inviteId))
  } else {
    await db.update(userInvites).set({ projectIds: JSON.stringify(ids) }).where(eq(userInvites.id, inviteId))
  }

  return { ok: true }
})
