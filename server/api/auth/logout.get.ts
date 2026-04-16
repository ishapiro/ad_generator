import { clearSessionCookie } from '~/server/utils/session'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event) as { sessionCookieName: string }
  clearSessionCookie(event, config.sessionCookieName)
  return sendRedirect(event, '/login')
})
