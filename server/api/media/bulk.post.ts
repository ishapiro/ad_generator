import { eq, inArray, isNotNull } from 'drizzle-orm'
import { adConfigs, uploadedImages } from '~/server/utils/db/schema'
import { getUserProjectIds, requireSession } from '~/server/utils/auth'
import { useR2 } from '~/server/utils/r2'

interface BulkBody {
  action: 'move' | 'delete'
  ids: number[]
  folderId?: number | null  // only for 'move'
}

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody<BulkBody>(event)
  const { action, ids } = body

  if (!action || !Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: 'action and ids are required' })
  }

  const db = useDb(event)
  const projectIds = await getUserProjectIds(event, session)

  // Verify all requested images are accessible to this user
  const records = await db
    .select()
    .from(uploadedImages)
    .where(inArray(uploadedImages.id, ids))

  if (projectIds !== null) {
    const accessibleSet = new Set(projectIds)
    for (const r of records) {
      if (r.projectId && !accessibleSet.has(r.projectId)) {
        throw createError({ statusCode: 403, message: 'Access denied to one or more images' })
      }
    }
  }

  if (action === 'move') {
    const folderId = body.folderId ?? null
    await db
      .update(uploadedImages)
      .set({ folderId })
      .where(inArray(uploadedImages.id, ids))
    return { ok: true, moved: ids.length }
  }

  if (action === 'delete') {
    const configsQuery = projectIds === null
      ? db.select({ id: adConfigs.id, name: adConfigs.name, templateLayers: adConfigs.templateLayers }).from(adConfigs).where(isNotNull(adConfigs.templateLayers))
      : db.select({ id: adConfigs.id, name: adConfigs.name, templateLayers: adConfigs.templateLayers }).from(adConfigs).where(inArray(adConfigs.projectId, projectIds))

    const configs = await configsQuery

    const usageMap = new Map<string, string[]>()
    for (const config of configs) {
      try {
        const layers: Array<{ r2Key?: string }> = JSON.parse(config.templateLayers ?? '[]')
        for (const layer of layers) {
          if (layer.r2Key) {
            const list = usageMap.get(layer.r2Key) ?? []
            list.push(config.name)
            usageMap.set(layer.r2Key, list)
          }
        }
      } catch { /* skip */ }
    }

    const toDelete: typeof records = []
    const skipped: Array<{ filename: string; reason: string }> = []

    for (const record of records) {
      const inUseBy = usageMap.get(record.r2Key) ?? []
      if (record.locked === 1) {
        skipped.push({ filename: record.filename, reason: 'Locked by user' })
      } else if (inUseBy.length > 0) {
        skipped.push({ filename: record.filename, reason: `In use by: ${inUseBy.join(', ')}` })
      } else {
        toDelete.push(record)
      }
    }

    if (toDelete.length > 0) {
      const r2 = useR2(event)
      await Promise.all(toDelete.map(r => r2.delete(r.r2Key).catch(() => {})))
      await db
        .delete(uploadedImages)
        .where(inArray(uploadedImages.id, toDelete.map(r => r.id)))
    }

    return { ok: true, deleted: toDelete.length, skipped }
  }

  throw createError({ statusCode: 400, message: `Unknown action: ${action}` })
})
