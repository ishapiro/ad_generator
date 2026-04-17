import { asc } from 'drizzle-orm'
import { userInvites, projects } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useDb(event)

  const invites = await db.select().from(userInvites).orderBy(asc(userInvites.email))
  const allProjects = await db.select({ id: projects.id, name: projects.name }).from(projects)
  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]))

  return {
    invites: invites.map(inv => {
      const ids: number[] = JSON.parse(inv.projectIds ?? '[]')
      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        projectIds: ids,
        projectNames: ids.map(id => projectMap[id] ?? `#${id}`),
        createdAt: inv.createdAt,
      }
    }),
  }
})
