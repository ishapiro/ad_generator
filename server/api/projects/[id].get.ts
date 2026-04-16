import { eq } from 'drizzle-orm'
import { projects } from '~/server/utils/db/schema'
import { requireProjectAccess } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid project id' })

  await requireProjectAccess(event, id)

  const db = useDb(event)
  const [project] = await db
    .select({ id: projects.id, name: projects.name, description: projects.description })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)

  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  return { project }
})
