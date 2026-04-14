import { eq } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  await db.delete(generatedAds).where(eq(generatedAds.adConfigId, id))
  await db.delete(adConfigs).where(eq(adConfigs.id, id))

  return { ok: true }
})
