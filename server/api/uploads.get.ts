import { desc } from 'drizzle-orm'
import { uploadedImages } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb(event)
  return db.select().from(uploadedImages).orderBy(desc(uploadedImages.createdAt))
})
