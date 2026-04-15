import { useR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  if (!key) throw createError({ statusCode: 400, message: 'Missing image key' })

  const r2 = useR2(event)
  const object = await r2.get(key)

  if (!object) {
    console.warn(`[images] 404 key=${key}`)
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  const contentType = object.httpMetadata?.contentType ?? 'image/jpeg'
  console.log(`[images] serving key=${key} contentType=${contentType}`)

  // Buffer the entire body rather than streaming — more reliable for external callers
  const arrayBuffer = await object.arrayBuffer()

  setResponseHeader(event, 'Content-Type', contentType)

  if (getQuery(event).download) {
    const filename = key.split('/').pop() ?? key
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  } else {
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  }

  return new Uint8Array(arrayBuffer)
})
