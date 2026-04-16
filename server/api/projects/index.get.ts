import { eq, inArray } from 'drizzle-orm'
import { projectMembers, projects } from '~/server/utils/db/schema'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb(event)

  if (session.role === 'admin') {
    const all = await db
      .select({ id: projects.id, name: projects.name, description: projects.description })
      .from(projects)
      .orderBy(projects.name)
    return { projects: all }
  }

  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, session.sub))

  if (memberships.length === 0) return { projects: [] }

  const ids = memberships.map(m => m.projectId)
  const userProjects = await db
    .select({ id: projects.id, name: projects.name, description: projects.description })
    .from(projects)
    .where(inArray(projects.id, ids))
    .orderBy(projects.name)

  return { projects: userProjects }
})
