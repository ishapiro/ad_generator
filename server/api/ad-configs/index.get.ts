import { desc } from 'drizzle-orm'
import { adConfigs } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const list = await db.select().from(adConfigs).orderBy(desc(adConfigs.createdAt))
  return { adConfigs: list }
})
