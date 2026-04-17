import { eq } from 'drizzle-orm'
import { projects } from '~/server/utils/db/schema'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const templateId = getRouterParam(event, 'id')
  if (!templateId) throw createError({ statusCode: 400, message: 'Missing template id' })

  const projectId = Number(getQuery(event).projectId)
  if (!Number.isFinite(projectId)) throw createError({ statusCode: 400, message: 'Missing or invalid projectId' })

  const db = useDb(event)
  const [project] = await db
    .select({ templatedApiKey: projects.templatedApiKey })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)

  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  const apiKey = project.templatedApiKey
  if (!apiKey) throw createError({ statusCode: 400, message: 'This project has no Templated.io API key set.' })

  const res = await fetch(`https://api.templated.io/v1/template/${templateId}?includeLayers=true`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw createError({ statusCode: res.status, message: `Templated API error: ${err}` })
  }
  const data = await res.json() as { thumbnail?: string; updatedAt?: string; [key: string]: unknown }

  if (data.thumbnail && data.updatedAt) {
    data.thumbnail = `${data.thumbnail}?v=${encodeURIComponent(data.updatedAt)}`
  }
  return data
})
