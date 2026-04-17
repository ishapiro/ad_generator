import { eq } from 'drizzle-orm'
import { userInvites } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid invite ID' })

  const db = useDb(event)
  await db.delete(userInvites).where(eq(userInvites.id, id))

  return { ok: true }
})
