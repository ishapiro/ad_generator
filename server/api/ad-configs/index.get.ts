import { desc, eq, inArray } from 'drizzle-orm'
import { adConfigs } from '~/server/utils/db/schema'
import { getUserProjectIds, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb(event)

  const filterProjectId = getQuery(event).projectId ? Number(getQuery(event).projectId) : null
  const projectIds = await getUserProjectIds(event, session)

  // admin — optionally narrow to a specific project
  if (projectIds === null) {
    const list = filterProjectId
      ? await db.select().from(adConfigs).where(eq(adConfigs.projectId, filterProjectId)).orderBy(desc(adConfigs.createdAt))
      : await db.select().from(adConfigs).orderBy(desc(adConfigs.createdAt))
    return { adConfigs: list }
  }

  if (projectIds.length === 0) return { adConfigs: [] }

  // user — restrict to their projects, optionally narrowed further
  const allowedIds = filterProjectId && projectIds.includes(filterProjectId)
    ? [filterProjectId]
    : projectIds

  const list = await db
    .select()
    .from(adConfigs)
    .where(inArray(adConfigs.projectId, allowedIds))
    .orderBy(desc(adConfigs.createdAt))

  return { adConfigs: list }
})
