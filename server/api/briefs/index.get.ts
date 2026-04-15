import { desc } from 'drizzle-orm'
import { savedBriefs } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  return db.select().from(savedBriefs).orderBy(desc(savedBriefs.createdAt))
})
