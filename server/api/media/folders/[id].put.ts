import { eq } from 'drizzle-orm'
import { mediaFolders } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid id' })

  const body = await readBody<{ name?: string }>(event)
  const name = body?.name?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'Folder name is required' })

  const db = useDb(event)
  const [updated] = await db
    .update(mediaFolders)
    .set({ name })
    .where(eq(mediaFolders.id, id))
    .returning()

  if (!updated) throw createError({ statusCode: 404, message: 'Folder not found' })
  return updated
})
