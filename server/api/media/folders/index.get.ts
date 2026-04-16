import { inArray, sql } from 'drizzle-orm'
import { mediaFolders, uploadedImages } from '~/server/utils/db/schema'
import { getUserProjectIds, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb(event)
  const projectIds = await getUserProjectIds(event, session)

  let folders: typeof mediaFolders.$inferSelect[]
  if (projectIds === null) {
    folders = await db.select().from(mediaFolders).orderBy(mediaFolders.name)
  } else if (projectIds.length === 0) {
    return []
  } else {
    folders = await db.select().from(mediaFolders).where(inArray(mediaFolders.projectId, projectIds)).orderBy(mediaFolders.name)
  }

  const counts = await db
    .select({ folderId: uploadedImages.folderId, count: sql<number>`count(*)` })
    .from(uploadedImages)
    .groupBy(uploadedImages.folderId)

  const countMap = new Map(counts.map(r => [r.folderId, r.count]))

  return folders.map(f => ({
    ...f,
    imageCount: countMap.get(f.id) ?? 0,
  }))
})
