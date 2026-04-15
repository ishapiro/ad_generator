export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const password = body?.password?.trim()

  if (!password) {
    throw createError({ statusCode: 400, message: 'Password is required' })
  }

  if (password !== useRuntimeConfig().adgenPassword) {
    throw createError({ statusCode: 401, message: 'Incorrect password' })
  }

  setCookie(event, 'adgen_authed', '1', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
  })

  return { ok: true }
})
