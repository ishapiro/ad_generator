import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSession(event)

  const query = getQuery(event)
  const idsParam = (query.ids as string | undefined)?.trim()
  if (!idsParam) return []

  const adConfigIds = idsParam.split(',').map(Number).filter(n => Number.isFinite(n) && n > 0)
  if (adConfigIds.length === 0) return []

  const db = useDb(event)

  const [rows, configs] = await Promise.all([
    db
      .select({
        id: generatedAds.id,
        adConfigId: generatedAds.adConfigId,
        r2Key: generatedAds.r2Key,
        createdAt: generatedAds.createdAt,
      })
      .from(generatedAds)
      .where(
        and(
          inArray(generatedAds.adConfigId, adConfigIds),
          eq(generatedAds.status, 'complete'),
          isNotNull(generatedAds.r2Key),
        ),
      )
      .orderBy(desc(generatedAds.createdAt)),
    db
      .select({ id: adConfigs.id, name: adConfigs.name })
      .from(adConfigs)
      .where(inArray(adConfigs.id, adConfigIds)),
  ])

  // Take latest completed generation per adConfigId
  const latestMap = new Map<number, { r2Key: string | null; createdAt: Date | null }>()
  for (const row of rows) {
    if (!latestMap.has(row.adConfigId)) {
      latestMap.set(row.adConfigId, { r2Key: row.r2Key, createdAt: row.createdAt })
    }
  }

  const nameMap = new Map(configs.map(c => [c.id, c.name]))

  return adConfigIds.map(id => ({
    adConfigId: id,
    profileName: nameMap.get(id) ?? 'Unknown',
    r2Key: latestMap.get(id)?.r2Key ?? null,
    createdAt: latestMap.get(id)?.createdAt ?? null,
  }))
})
