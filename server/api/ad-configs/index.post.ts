import { adConfigs } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const body = await readBody<{
    name: string
    projectId?: number
    headline?: string
    subheadline?: string
    bodyText?: string
    ctaText?: string
    heroImagePrompt?: string
    backgroundDescription?: string
    bulletSteps?: Array<{ icon: string; label: string }>
    templateId?: string
    templateLayers?: Array<{ layer: string; type: string; value?: string; prompt?: string }>
  }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const projectId = body.projectId ? Number(body.projectId) : null
  if (projectId) {
    await requireProjectAccess(event, projectId)
  } else if (session.role !== 'admin') {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const db = useDb(event)
  const now = new Date()

  const [inserted] = await db
    .insert(adConfigs)
    .values({
      projectId,
      name: body.name.trim(),
      headline: body.headline ?? '',
      subheadline: body.subheadline ?? '',
      bodyText: body.bodyText ?? '',
      ctaText: body.ctaText ?? '',
      heroImagePrompt: body.heroImagePrompt ?? '',
      backgroundDescription: body.backgroundDescription ?? '',
      bulletSteps: JSON.stringify(body.bulletSteps ?? []),
      templateId: body.templateId ?? null,
      templateLayers: body.templateLayers ? JSON.stringify(body.templateLayers) : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  if (!inserted) throw createError({ statusCode: 500, message: 'Failed to create ad config' })
  return inserted
})
