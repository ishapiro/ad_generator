import { mimeToExt, useR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const secret = getRequestHeader(event, 'x-internal-secret')
  if (!secret || secret !== (cfg.sessionSecret as string)) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const contentType = getRequestHeader(event, 'content-type') ?? 'image/png'
  const body = await readRawBody(event, false)
  if (!body) throw createError({ statusCode: 400, message: 'No body provided' })

  const r2 = useR2(event)
  const ext = mimeToExt(contentType)
  const key = `tmp-${crypto.randomUUID()}.${ext}`
  await r2.put(key, body, { httpMetadata: { contentType } })

  const publicBaseUrl = ((cfg.publicBaseUrl as string) || '').replace(/\/$/, '')
  if (!publicBaseUrl) {
    throw createError({
      statusCode: 500,
      message: 'NUXT_PUBLIC_BASE_URL must be set on the production Worker for temp-images to return a reachable URL',
    })
  }

  const url = `${publicBaseUrl}/api/images/${key}`
  console.log(`[temp-images] stored ${key}, url=${url}`)
  return { key, url }
})
