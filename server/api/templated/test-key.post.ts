import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireSession(event)
  const body = await readBody<{ apiKey?: string }>(event)
  const apiKey = body?.apiKey?.trim()
  if (!apiKey) throw createError({ statusCode: 400, message: 'API key is required' })

  const res = await fetch('https://api.templated.io/v1/templates', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (res.ok) return { valid: true }

  const messages: Record<number, string> = {
    401: 'Invalid API key — check that you copied it correctly from your Templated.io account.',
    403: 'This API key does not have permission to access templates.',
    404: 'API key not recognized by Templated.io — it may have been deleted or regenerated.',
    429: 'Templated.io rate limit reached — please wait a moment and try again.',
  }
  return { valid: false, message: messages[res.status] ?? `Templated.io returned an unexpected error (${res.status}). Please try again or contact support.` }
})
