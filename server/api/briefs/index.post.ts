import { savedBriefs } from '~/server/utils/db/schema'
import { requireProjectAccess, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body = await readBody<{ name?: string; brief?: string; projectId?: number }>(event)
  const name = body?.name?.trim()
  const brief = body?.brief?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'name is required' })
  if (!brief) throw createError({ statusCode: 400, message: 'brief is required' })

  const projectId = body?.projectId ? Number(body.projectId) : null
  if (projectId) {
    await requireProjectAccess(event, projectId)
  } else if (session.role !== 'admin') {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const db = useDb(event)
  const [inserted] = await db
    .insert(savedBriefs)
    .values({ projectId, name, brief, createdAt: new Date() })
    .returning()

  if (!inserted) throw createError({ statusCode: 500, message: 'Failed to save brief' })
  return inserted
})
