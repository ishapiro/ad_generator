import { mediaFolders } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody<{ name?: string; projectId?: number }>(event)
  const name = body?.name?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'Folder name is required' })

  const projectId = body?.projectId ? Number(body.projectId) : null
  if (projectId) {
    await requireProjectAccess(event, projectId)
  } else if (session.role !== 'admin') {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const db = useDb(event)
  const [folder] = await db.insert(mediaFolders).values({ name, projectId }).returning()
  if (!folder) throw createError({ statusCode: 500, message: 'Failed to create folder' })

  return { ...folder, imageCount: 0 }
})
