import { eq, sql } from 'drizzle-orm'
import { mediaFolders, uploadedImages } from '~/server/utils/db/schema'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb(event)

  const [folder] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, id)).limit(1)
  if (!folder) throw createError({ statusCode: 404, message: 'Folder not found' })

  // Count images in this folder
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(uploadedImages)
    .where(eq(uploadedImages.folderId, id))
  const count = countResult[0]?.count ?? 0

  if (count > 0) {
    throw createError({
      statusCode: 409,
      message: `Folder contains ${count} image${count === 1 ? '' : 's'}. Move or reassign them before deleting.`,
    })
  }

  await db.delete(mediaFolders).where(eq(mediaFolders.id, id))
  return { ok: true }
})
