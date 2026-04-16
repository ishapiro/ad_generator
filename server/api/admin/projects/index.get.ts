import { projects } from '~/server/utils/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb(event)
  const all = await db
    .select()
    .from(projects)
    .orderBy(projects.name)
  return { projects: all }
})
