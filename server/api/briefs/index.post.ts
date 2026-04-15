import { savedBriefs } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; brief?: string }>(event)
  const name = body?.name?.trim()
  const brief = body?.brief?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'name is required' })
  if (!brief) throw createError({ statusCode: 400, message: 'brief is required' })

  const db = useDb(event)
  const [inserted] = await db
    .insert(savedBriefs)
    .values({ name, brief, createdAt: new Date() })
    .returning()

  if (!inserted) throw createError({ statusCode: 500, message: 'Failed to save brief' })
  return inserted
})
