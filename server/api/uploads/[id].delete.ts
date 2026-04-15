import { eq, isNotNull } from 'drizzle-orm'
import { adConfigs, uploadedImages } from '~/server/utils/db/schema'
import { useR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  const [record] = await db.select().from(uploadedImages).where(eq(uploadedImages.id, id)).limit(1)
  if (!record) throw createError({ statusCode: 404, message: 'Image not found' })

  const query = getQuery(event)
  const excludeProfileId = query.excludeProfileId ? Number(query.excludeProfileId) : null

  // Check every ad profile (except the current one being edited) for a reference to this image's r2Key
  const configs = await db
    .select({ id: adConfigs.id, name: adConfigs.name, templateLayers: adConfigs.templateLayers })
    .from(adConfigs)
    .where(isNotNull(adConfigs.templateLayers))

  const inUseBy: string[] = []
  for (const config of configs) {
    if (excludeProfileId && config.id === excludeProfileId) continue
    try {
      const layers: Array<{ r2Key?: string }> = JSON.parse(config.templateLayers ?? '[]')
      if (layers.some(l => l.r2Key === record.r2Key)) inUseBy.push(config.name)
    } catch { /* malformed JSON — skip */ }
  }

  if (inUseBy.length > 0) {
    throw createError({
      statusCode: 409,
      message: `Image is in use by: ${inUseBy.join(', ')}. Remove it from those profiles before deleting.`,
    })
  }

  const r2 = useR2(event)
  await r2.delete(record.r2Key)
  await db.delete(uploadedImages).where(eq(uploadedImages.id, id))

  return { ok: true }
})
