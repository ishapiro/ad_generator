import { eq } from 'drizzle-orm'
import { savedPrompts } from '~/server/utils/db/schema'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  await db.delete(savedPrompts).where(eq(savedPrompts.id, id))
  return { ok: true }
})
