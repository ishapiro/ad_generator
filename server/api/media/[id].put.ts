import { eq } from 'drizzle-orm'
import { uploadedImages } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'

interface UpdateBody {
  description?: string | null
  keywords?: string[]
  altText?: string | null
  source?: string | null
  copyright?: string | null
  folderId?: number | null
  locked?: boolean
}

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const body = await readBody<UpdateBody>(event)
  const db = useDb(event)

  const [record] = await db.select().from(uploadedImages).where(eq(uploadedImages.id, id)).limit(1)
  if (!record) throw createError({ statusCode: 404, message: 'Image not found' })

  if (record.projectId && session.role !== 'admin') {
    await requireProjectAccess(event, record.projectId)
  }

  const updates: Partial<typeof uploadedImages.$inferInsert> = {}

  if ('description' in body) updates.description = body.description ?? null
  if ('keywords' in body) updates.keywords = body.keywords ? JSON.stringify(body.keywords) : null
  if ('altText' in body) updates.altText = body.altText ?? null
  if ('source' in body) updates.source = body.source ?? null
  if ('copyright' in body) updates.copyright = body.copyright ?? null
  if ('folderId' in body) updates.folderId = body.folderId ?? null
  if ('locked' in body) updates.locked = body.locked ? 1 : 0

  const [updated] = await db
    .update(uploadedImages)
    .set(updates)
    .where(eq(uploadedImages.id, id))
    .returning()

  return updated
})
