import { adConfigs } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name: string
    headline: string
    subheadline: string
    bodyText: string
    ctaText: string
    heroImagePrompt: string
    backgroundDescription: string
    bulletSteps: Array<{ icon: string; label: string }>
  }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const db = useDb(event)
  const now = new Date()

  const [inserted] = await db
    .insert(adConfigs)
    .values({
      name: body.name.trim(),
      headline: body.headline ?? '',
      subheadline: body.subheadline ?? '',
      bodyText: body.bodyText ?? '',
      ctaText: body.ctaText ?? '',
      heroImagePrompt: body.heroImagePrompt ?? '',
      backgroundDescription: body.backgroundDescription ?? '',
      bulletSteps: JSON.stringify(body.bulletSteps ?? []),
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  if (!inserted) throw createError({ statusCode: 500, message: 'Failed to create ad config' })
  return inserted
})
