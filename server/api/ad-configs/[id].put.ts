import { eq, inArray } from 'drizzle-orm'
import { adConfigs, uploadedImages } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const body = await readBody<{
    name?: string
    headline?: string
    subheadline?: string
    bodyText?: string
    ctaText?: string
    heroImagePrompt?: string
    backgroundDescription?: string
    bulletSteps?: Array<{ icon: string; label: string }>
    templateId?: string | null
    templateLayers?: Array<{ layer: string; type: string; value?: string; prompt?: string }> | null
  }>(event)

  const db = useDb(event)
  const [existing] = await db.select().from(adConfigs).where(eq(adConfigs.id, id)).limit(1)
  if (!existing) throw createError({ statusCode: 404, message: 'Ad config not found' })

  if (existing.projectId && session.role !== 'admin') {
    await requireProjectAccess(event, existing.projectId)
  }

  // Validate that any uploaded image r2Keys still exist in the library
  if (body.templateLayers) {
    const uploadR2Keys = body.templateLayers
      .filter((l): l is typeof l & { r2Key: string } =>
        l.type === 'image' && (l as { imageMode?: string }).imageMode === 'upload' && !!(l as { r2Key?: string }).r2Key)
      .map(l => (l as { r2Key: string }).r2Key)

    if (uploadR2Keys.length > 0) {
      const found = await db.select({ r2Key: uploadedImages.r2Key })
        .from(uploadedImages)
        .where(inArray(uploadedImages.r2Key, uploadR2Keys))
      const foundKeys = new Set(found.map(r => r.r2Key))
      const missing = uploadR2Keys.filter(k => !foundKeys.has(k))
      if (missing.length > 0) {
        throw createError({
          statusCode: 400,
          message: 'One or more selected images no longer exist in the library. Please re-select them before saving.',
        })
      }
    }
  }

  const [updated] = await db
    .update(adConfigs)
    .set({
      name: body.name?.trim() ?? existing.name,
      headline: body.headline ?? existing.headline,
      subheadline: body.subheadline ?? existing.subheadline,
      bodyText: body.bodyText ?? existing.bodyText,
      ctaText: body.ctaText ?? existing.ctaText,
      heroImagePrompt: body.heroImagePrompt ?? existing.heroImagePrompt,
      backgroundDescription: body.backgroundDescription ?? existing.backgroundDescription,
      bulletSteps: body.bulletSteps !== undefined ? JSON.stringify(body.bulletSteps) : existing.bulletSteps,
      templateId: body.templateId !== undefined ? body.templateId : existing.templateId,
      templateLayers: body.templateLayers !== undefined
        ? (body.templateLayers ? JSON.stringify(body.templateLayers) : null)
        : existing.templateLayers,
      updatedAt: new Date(),
    })
    .where(eq(adConfigs.id, id))
    .returning()

  return updated
})
