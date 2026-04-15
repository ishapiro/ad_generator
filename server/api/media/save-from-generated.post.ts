import { eq } from 'drizzle-orm'
import { adConfigs, generatedAds, uploadedImages } from '~/server/utils/db/schema'
import { useR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ generatedAdId?: number }>(event)
  const generatedAdId = Number(body?.generatedAdId)
  if (!generatedAdId) throw createError({ statusCode: 400, message: 'generatedAdId is required' })

  const db = useDb(event)

  const [ad] = await db
    .select()
    .from(generatedAds)
    .where(eq(generatedAds.id, generatedAdId))
    .limit(1)
  if (!ad) throw createError({ statusCode: 404, message: 'Generated ad not found' })
  if (ad.status !== 'complete' || !ad.r2Key) {
    throw createError({ statusCode: 400, message: 'Generated ad is not complete' })
  }

  // Build a descriptive filename from the profile name and date
  const [config] = await db
    .select({ name: adConfigs.name })
    .from(adConfigs)
    .where(eq(adConfigs.id, ad.adConfigId))
    .limit(1)

  const profileName = (config?.name ?? 'Ad').replace(/[^a-z0-9\s-]/gi, '').trim()
  const dateStr = new Date(ad.createdAt ?? Date.now()).toISOString().slice(0, 10)
  const filename = `${profileName} ${dateStr}.jpg`

  // Copy the R2 object to a new key so the two records are independent
  const r2 = useR2(event)
  const original = await r2.get(ad.r2Key)
  if (!original) throw createError({ statusCode: 404, message: 'R2 object not found for generated ad' })

  const imageBytes = await original.arrayBuffer()
  const newR2Key = `${crypto.randomUUID()}.jpg`
  await r2.put(newR2Key, imageBytes, { httpMetadata: { contentType: 'image/jpeg' } })

  const [record] = await db
    .insert(uploadedImages)
    .values({
      r2Key: newR2Key,
      filename,
      mimeType: 'image/jpeg',
    })
    .returning()

  if (!record) throw createError({ statusCode: 500, message: 'Failed to create library record' })

  return record
})
