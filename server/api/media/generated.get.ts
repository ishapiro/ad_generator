import { eq } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb(event)

  const ads = await db
    .select({
      id: generatedAds.id,
      r2Key: generatedAds.r2Key,
      createdAt: generatedAds.createdAt,
      adConfigId: generatedAds.adConfigId,
    })
    .from(generatedAds)
    .where(eq(generatedAds.status, 'complete'))
    .orderBy(generatedAds.createdAt)

  if (ads.length === 0) return []

  // Load profile names for all referenced configs
  const configIds = [...new Set(ads.map(a => a.adConfigId))]
  const configs = await db
    .select({ id: adConfigs.id, name: adConfigs.name })
    .from(adConfigs)

  const configMap = new Map(configs.map(c => [c.id, c.name]))

  return ads.map(ad => ({
    id: ad.id,
    r2Key: ad.r2Key!,
    createdAt: ad.createdAt,
    adConfigId: ad.adConfigId,
    profileName: configMap.get(ad.adConfigId) ?? 'Unknown Profile',
  }))
})
