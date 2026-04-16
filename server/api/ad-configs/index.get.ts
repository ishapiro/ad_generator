import { and, desc, inArray } from 'drizzle-orm'
import { adConfigs } from '~/server/utils/db/schema'
import { getUserProjectIds, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb(event)

  const projectIds = await getUserProjectIds(event, session)

  // null = admin sees all
  if (projectIds === null) {
    const list = await db.select().from(adConfigs).orderBy(desc(adConfigs.createdAt))
    return { adConfigs: list }
  }

  if (projectIds.length === 0) return { adConfigs: [] }

  const list = await db
    .select()
    .from(adConfigs)
    .where(inArray(adConfigs.projectId, projectIds))
    .orderBy(desc(adConfigs.createdAt))

  return { adConfigs: list }
})
