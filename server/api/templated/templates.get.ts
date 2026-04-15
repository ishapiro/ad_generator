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

  const checked = await Promise.all(
    data.map(async (tpl) => {
      if (!tpl.thumbnail) {
        console.log(`[templated] template "${tpl.name}" thumbnail: (none)`)
        return { ...tpl, thumbnailReady: false }
      }
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 5000)
        const r = await fetch(tpl.thumbnail, { method: 'HEAD', signal: ctrl.signal })
        clearTimeout(timer)
        const ready = r.ok
        console.log(`[templated] template "${tpl.name}" thumbnail: ${tpl.thumbnail} — ${ready ? 'ready' : `not ready (${r.status})`}`)
        return { ...tpl, thumbnailReady: ready }
      } catch {
        console.log(`[templated] template "${tpl.name}" thumbnail: ${tpl.thumbnail} — not ready (fetch error)`)
        return { ...tpl, thumbnailReady: false }
      }
    })
  )

  return checked
})
