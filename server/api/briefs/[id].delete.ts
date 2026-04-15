import { eq } from 'drizzle-orm'
import { savedBriefs } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  await db.delete(savedBriefs).where(eq(savedBriefs.id, id))
  return { ok: true }
})
