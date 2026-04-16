export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing template id' })

  const cfg = useRuntimeConfig(event)
  const apiKey = cfg.templatedApiKey as string
  if (!apiKey) throw createError({ statusCode: 500, message: 'Missing NUXT_TEMPLATED_API_KEY' })

  const res = await fetch(`https://api.templated.io/v1/template/${id}?includeLayers=true`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw createError({ statusCode: res.status, message: `Templated API error: ${err}` })
  }
  const data = await res.json() as { thumbnail?: string; updatedAt?: string; [key: string]: unknown }

  // Append updatedAt as a cache-busting param so browsers re-fetch after template edits.
  if (data.thumbnail && data.updatedAt) {
    data.thumbnail = `${data.thumbnail}?v=${encodeURIComponent(data.updatedAt)}`
  }
  return data
})
