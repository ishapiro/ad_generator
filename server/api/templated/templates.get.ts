export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const apiKey = cfg.templatedApiKey as string
  if (!apiKey) throw createError({ statusCode: 500, message: 'Missing NUXT_TEMPLATED_API_KEY' })

  const res = await fetch('https://api.templated.io/v1/templates', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw createError({ statusCode: res.status, message: `Templated API error: ${err}` })
  }
  const data = await res.json() as Array<{ id: string; name: string; thumbnail?: string }>
  for (const tpl of data) {
    console.log(`[templated] template "${tpl.name}" thumbnail: ${tpl.thumbnail ?? '(none)'}`)
  }
  return data
})
