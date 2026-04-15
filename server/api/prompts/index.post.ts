import { savedPrompts } from '~/server/utils/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; prompt?: string }>(event)
  const name = body?.name?.trim()
  const prompt = body?.prompt?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'name is required' })
  if (!prompt) throw createError({ statusCode: 400, message: 'prompt is required' })

  const db = useDb(event)
  const [inserted] = await db
    .insert(savedPrompts)
    .values({ name, prompt, createdAt: new Date() })
    .returning()

  if (!inserted) throw createError({ statusCode: 500, message: 'Failed to save prompt' })
  return inserted
})
