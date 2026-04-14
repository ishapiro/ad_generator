import { eq } from 'drizzle-orm'
import { adConfigs } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
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
  }>(event)

  const db = useDb(event)
  const [existing] = await db.select().from(adConfigs).where(eq(adConfigs.id, id)).limit(1)
  if (!existing) throw createError({ statusCode: 404, message: 'Ad config not found' })

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
      updatedAt: new Date(),
    })
    .where(eq(adConfigs.id, id))
    .returning()

  return updated
})
