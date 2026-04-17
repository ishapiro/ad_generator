import { eq } from 'drizzle-orm'
import { projects, users, projectMembers, userInvites } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const projectId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(projectId)) throw createError({ statusCode: 400, message: 'Invalid project id' })

  const body = await readBody<{ email?: string }>(event)
  const email = body?.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) throw createError({ statusCode: 400, message: 'Valid email is required' })

  const db = useDb(event)

  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (existing) {
    await db
      .insert(projectMembers)
      .values({ projectId, userId: existing.id, role: 'editor' })
      .onConflictDoNothing()
    return { status: 'added' }
  }

  // User doesn't exist yet — merge projectId into the invite
  const [existingInvite] = await db.select().from(userInvites).where(eq(userInvites.email, email)).limit(1)

  if (existingInvite) {
    const ids: number[] = JSON.parse(existingInvite.projectIds)
    if (!ids.includes(projectId)) {
      ids.push(projectId)
      await db.update(userInvites).set({ projectIds: JSON.stringify(ids) }).where(eq(userInvites.id, existingInvite.id))
    }
  } else {
    await db.insert(userInvites).values({ email, role: 'member', projectIds: JSON.stringify([projectId]) })
  }

  return { status: 'invited' }
})
