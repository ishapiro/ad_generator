import { eq, inArray } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'
import { getUserProjectIds, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb(event)
  const projectIds = await getUserProjectIds(event, session)

  let configIds: number[]
  if (projectIds === null) {
    const configs = await db.select({ id: adConfigs.id }).from(adConfigs)
    configIds = configs.map(c => c.id)
  } else if (projectIds.length === 0) {
    return []
  } else {
    const configs = await db.select({ id: adConfigs.id }).from(adConfigs).where(inArray(adConfigs.projectId, projectIds))
    configIds = configs.map(c => c.id)
  }

  if (configIds.length === 0) return []

  const ads = await db
    .select({
      id: generatedAds.id,
      r2Key: generatedAds.r2Key,
      createdAt: generatedAds.createdAt,
      adConfigId: generatedAds.adConfigId,
    })
    .from(generatedAds)
    .where(inArray(generatedAds.adConfigId, configIds))
    .orderBy(generatedAds.createdAt)

  if (ads.length === 0) return []

  const allConfigs = await db
    .select({ id: adConfigs.id, name: adConfigs.name })
    .from(adConfigs)
    .where(inArray(adConfigs.id, [...new Set(ads.map(a => a.adConfigId))]))

  const configMap = new Map(allConfigs.map(c => [c.id, c.name]))

  return ads
    .filter(ad => ad.r2Key)
    .map(ad => ({
      id: ad.id,
      r2Key: ad.r2Key!,
      createdAt: ad.createdAt,
      adConfigId: ad.adConfigId,
      profileName: configMap.get(ad.adConfigId) ?? 'Unknown Profile',
    }))
})
