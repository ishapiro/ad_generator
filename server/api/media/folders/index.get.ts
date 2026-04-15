import { eq, sql } from 'drizzle-orm'
import { mediaFolders, uploadedImages } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb(event)

  const folders = await db.select().from(mediaFolders).orderBy(mediaFolders.name)

  // Count images per folder
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
