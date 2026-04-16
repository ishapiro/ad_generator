import { eq } from 'drizzle-orm'
import { projectMembers, projects, users } from '~/server/utils/db/schema'
import { getSessionCookie, verifySession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as { sessionSecret: string; sessionCookieName: string }
  const { sessionSecret, sessionCookieName } = config
  if (!sessionSecret) return { user: null }

  const token = getSessionCookie(event, sessionCookieName)
  if (!token) return { user: null }

  const payload = await verifySession(token, sessionSecret)
  if (!payload) return { user: null }

  const db = useDb(event)

  const [userRow, userProjects] = await Promise.all([
    db.select({ suspended: users.suspended }).from(users).where(eq(users.id, payload.sub)).limit(1),
    db
      .select({
        projectId: projectMembers.projectId,
        projectName: projects.name,
        role: projectMembers.role,
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, payload.sub)),
  ])

  if (!userRow[0] || userRow[0].suspended) return { user: null }

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      projects: userProjects,
    },
  }
})
