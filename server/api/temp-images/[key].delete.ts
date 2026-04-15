import { useR2 } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const secret = getRequestHeader(event, 'x-internal-secret')
  if (!secret || secret !== (cfg.adgenPassword as string)) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const key = getRouterParam(event, 'key')
  if (!key) throw createError({ statusCode: 400, message: 'Missing key' })
  if (!key.startsWith('tmp-')) {
    throw createError({ statusCode: 400, message: 'Only tmp- keys may be deleted via this endpoint' })
  }

  const r2 = useR2(event)
  await r2.delete(key)
  console.log(`[temp-images] deleted ${key}`)
  return { ok: true }
})
