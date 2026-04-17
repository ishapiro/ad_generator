import { eq, inArray } from 'drizzle-orm'
import { users, projects, projectMembers, userInvites } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ email?: string; role?: string; projectIds?: unknown }>(event)

  const email = body?.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, message: 'Valid email is required' })
  }

  const role = body?.role ?? 'member'
  if (role !== 'admin' && role !== 'member') {
    throw createError({ statusCode: 400, message: 'Role must be admin or member' })
  }

  const projectIds: number[] = Array.isArray(body?.projectIds)
    ? (body.projectIds as unknown[]).filter(n => typeof n === 'number' && Number.isFinite(n)) as number[]
    : []

  const db = useDb(event)

  // Validate all project IDs exist
  if (projectIds.length > 0) {
    const found = await db.select({ id: projects.id }).from(projects).where(inArray(projects.id, projectIds))
    if (found.length !== projectIds.length) {
      throw createError({ statusCode: 400, message: 'One or more project IDs are invalid' })
    }
  }

  // Check if user already exists
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (existing) {
    // Directly assign to projects
    for (const projectId of projectIds) {
      await db
        .insert(projectMembers)
        .values({ projectId, userId: existing.id, role: 'editor' })
        .onConflictDoNothing()
    }
    // Upgrade role if admin was requested
    if (role === 'admin' && existing.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, existing.id))
    }
    return { status: 'assigned', user: { id: existing.id, email: existing.email } }
  }

  // User doesn't exist yet — upsert invite
  const [invite] = await db
    .insert(userInvites)
    .values({ email, role: role as 'admin' | 'member', projectIds: JSON.stringify(projectIds) })
    .onConflictDoUpdate({
      target: userInvites.email,
      set: { role: role as 'admin' | 'member', projectIds: JSON.stringify(projectIds) },
    })
    .returning()

  return { status: 'invited', invite: { id: invite.id, email: invite.email } }
})
