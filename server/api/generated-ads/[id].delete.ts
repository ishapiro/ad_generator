import { eq } from 'drizzle-orm'
import { generatedAds } from '~/server/utils/db/schema'
import { useR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  const [record] = await db.select().from(generatedAds).where(eq(generatedAds.id, id)).limit(1)
  if (!record) throw createError({ statusCode: 404, message: 'Generated ad not found' })

  // Delete from R2 if a key exists
  if (record.r2Key) {
    try {
      const r2 = useR2(event)
      await r2.delete(record.r2Key)
    } catch {
      // Non-fatal — still delete the DB record
    }
  }

  await db.delete(generatedAds).where(eq(generatedAds.id, id))
  return { ok: true }
})
