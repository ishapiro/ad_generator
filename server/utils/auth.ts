import { and, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { projectMembers } from '~/server/utils/db/schema'
import { getSessionCookie, verifySession, type SessionPayload } from '~/server/utils/session'

export async function getOptionalSession(event: H3Event): Promise<SessionPayload | null> {
  const config = useRuntimeConfig(event)
  const { sessionSecret, sessionCookieName } = config as {
    sessionSecret: string
    sessionCookieName: string
  }
  if (!sessionSecret) return null
  const token = getSessionCookie(event, sessionCookieName)
  if (!token) return null
  const payload = await verifySession(token, sessionSecret)
  return typeof payload === 'object' && payload !== null ? payload : null
}

export async function requireSession(event: H3Event): Promise<SessionPayload> {
  const session = await getOptionalSession(event)
  if (!session) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return session
}

export async function requireAdmin(event: H3Event): Promise<SessionPayload> {
  const session = await requireSession(event)
  if (session.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return session
}

/**
 * Require that the current user has access to the given project.
 * Admins bypass — they always have access.
 */
export async function requireProjectAccess(
  event: H3Event,
  projectId: number,
): Promise<SessionPayload> {
  const session = await requireSession(event)
  if (session.role === 'admin') return session

  const db = useDb(event)
  const rows = await db
    .select({ id: projectMembers.id })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, session.sub),
      ),
    )
    .limit(1)

  if (!rows[0]) {
    throw createError({ statusCode: 403, message: 'You do not have access to this project' })
  }
  return session
}

/**
 * Return the list of project IDs the current user has access to.
 * Admins get null (meaning: all projects).
 */
export async function getUserProjectIds(
  event: H3Event,
  session: SessionPayload,
): Promise<number[] | null> {
  if (session.role === 'admin') return null
  const db = useDb(event)
  const rows = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, session.sub))
  return rows.map(r => r.projectId)
}
