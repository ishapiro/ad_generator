import { eq } from 'drizzle-orm'
import { projectMembers, projects, users } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb(event)

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      suspended: users.suspended,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(users.email)

  const allMemberships = await db
    .select({
      userId: projectMembers.userId,
      projectId: projectMembers.projectId,
      projectName: projects.name,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))

  const membershipsByUser = new Map<number, { projectId: number; projectName: string; role: string }[]>()
  for (const m of allMemberships) {
    const arr = membershipsByUser.get(m.userId) ?? []
    arr.push({ projectId: m.projectId, projectName: m.projectName, role: m.role })
    membershipsByUser.set(m.userId, arr)
  }

  return {
    users: allUsers.map(u => ({
      ...u,
      projects: membershipsByUser.get(u.id) ?? [],
    })),
  }
})
