import { eq } from 'drizzle-orm'
import { adConfigs, generatedAds } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)
  const [existing] = await db.select({ projectId: adConfigs.projectId }).from(adConfigs).where(eq(adConfigs.id, id)).limit(1)
  if (!existing) throw createError({ statusCode: 404, message: 'Ad config not found' })

  if (existing.projectId && session.role !== 'admin') {
    await requireProjectAccess(event, existing.projectId)
  }

  await db.delete(generatedAds).where(eq(generatedAds.adConfigId, id))
  await db.delete(adConfigs).where(eq(adConfigs.id, id))

  return { ok: true }
})
