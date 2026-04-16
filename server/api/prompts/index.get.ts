import { desc, inArray } from 'drizzle-orm'
import { savedPrompts } from '~/server/utils/db/schema'
import { getUserProjectIds, requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const db = useDb(event)
  const projectIds = await getUserProjectIds(event, session)

  if (projectIds === null) {
    return db.select().from(savedPrompts).orderBy(desc(savedPrompts.createdAt))
  }
  if (projectIds.length === 0) return []
  return db.select().from(savedPrompts).where(inArray(savedPrompts.projectId, projectIds)).orderBy(desc(savedPrompts.createdAt))
})
