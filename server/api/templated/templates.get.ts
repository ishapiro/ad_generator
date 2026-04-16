import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSession(event)
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
  const data = await res.json() as Array<{ id: string; name: string; thumbnail?: string; updatedAt?: string; [key: string]: unknown }>

  // Append updatedAt as a cache-busting query param so browsers re-fetch
  // the thumbnail whenever the template is saved in Templated.io.
  return data.map(tpl => ({
    ...tpl,
    thumbnail: tpl.thumbnail && tpl.updatedAt
      ? `${tpl.thumbnail}?v=${encodeURIComponent(tpl.updatedAt)}`
      : tpl.thumbnail,
  }))
})
