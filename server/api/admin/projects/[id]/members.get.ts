import { eq } from 'drizzle-orm'
import { projectMembers, users, userInvites } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const projectId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(projectId)) throw createError({ statusCode: 400, message: 'Invalid project id' })

  const db = useDb(event)

  const active = await db
    .select({
      id: projectMembers.id,
      userId: projectMembers.userId,
      role: projectMembers.role,
      email: users.email,
      name: users.name,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId))

  const allInvites = await db.select().from(userInvites)
  const invited = allInvites
    .filter(inv => (JSON.parse(inv.projectIds) as number[]).includes(projectId))
    .map(inv => ({ inviteId: inv.id, email: inv.email }))

  return { members: active, invited }
})
