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
  return res.json()
})
