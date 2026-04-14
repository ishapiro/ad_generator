import { eq, desc } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  const [config] = await db.select().from(adConfigs).where(eq(adConfigs.id, id)).limit(1)
  if (!config) throw createError({ statusCode: 404, message: 'Ad config not found' })

  const ads = await db
    .select()
    .from(generatedAds)
    .where(eq(generatedAds.adConfigId, id))
    .orderBy(desc(generatedAds.createdAt))

  return { config, generatedAds: ads }
})
