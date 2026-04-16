import { inArray } from 'drizzle-orm'
import { adConfigs, mediaFolders, uploadedImages } from '~/server/utils/db/schema'
import { getUserProjectIds, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb(event)

  const projectIds = await getUserProjectIds(event, session)

  let images: typeof uploadedImages.$inferSelect[]
  let folders: typeof mediaFolders.$inferSelect[]
  let configs: { id: number; name: string; templateLayers: string | null }[]

  if (projectIds === null) {
    // admin: see all
    ;[images, folders, configs] = await Promise.all([
      db.select().from(uploadedImages).orderBy(uploadedImages.createdAt),
      db.select().from(mediaFolders),
      db.select({ id: adConfigs.id, name: adConfigs.name, templateLayers: adConfigs.templateLayers }).from(adConfigs),
    ])
  } else if (projectIds.length === 0) {
    return []
  } else {
    ;[images, folders, configs] = await Promise.all([
      db.select().from(uploadedImages).where(inArray(uploadedImages.projectId, projectIds)).orderBy(uploadedImages.createdAt),
      db.select().from(mediaFolders).where(inArray(mediaFolders.projectId, projectIds)),
      db.select({ id: adConfigs.id, name: adConfigs.name, templateLayers: adConfigs.templateLayers })
        .from(adConfigs)
        .where(inArray(adConfigs.projectId, projectIds)),
    ])
  }

  const folderMap = new Map(folders.map(f => [f.id, f.name]))

  const usageMap = new Map<string, Array<{ id: number; name: string }>>()
  for (const config of configs) {
    if (!config.templateLayers) continue
    try {
      const layers: Array<{ r2Key?: string }> = JSON.parse(config.templateLayers)
      for (const layer of layers) {
        if (layer.r2Key) {
          const list = usageMap.get(layer.r2Key) ?? []
          list.push({ id: config.id, name: config.name })
          usageMap.set(layer.r2Key, list)
        }
      }
    } catch { /* malformed JSON — skip */ }
  }

  return images.map(img => ({
    id: img.id,
    r2Key: img.r2Key,
    filename: img.filename,
    mimeType: img.mimeType,
    description: img.description ?? null,
    keywords: img.keywords ? (JSON.parse(img.keywords) as string[]) : [],
    altText: img.altText ?? null,
    source: img.source ?? null,
    copyright: img.copyright ?? null,
    folderId: img.folderId ?? null,
    folderName: img.folderId ? (folderMap.get(img.folderId) ?? null) : null,
    locked: img.locked === 1,
    usedInProfiles: usageMap.get(img.r2Key) ?? [],
    createdAt: img.createdAt,
  }))
})
