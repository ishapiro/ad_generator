import { mediaFolders } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string }>(event)
  const name = body?.name?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'Folder name is required' })

  const db = useDb(event)
  const [folder] = await db.insert(mediaFolders).values({ name }).returning()
  if (!folder) throw createError({ statusCode: 500, message: 'Failed to create folder' })

  return { ...folder, imageCount: 0 }
})
