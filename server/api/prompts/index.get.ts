import { desc } from 'drizzle-orm'
import { savedPrompts } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  return db.select().from(savedPrompts).orderBy(desc(savedPrompts.createdAt))
})
