import { eq } from 'drizzle-orm'
import { users, type User } from '~/server/utils/db/schema'
import { createSession, setSessionCookie } from '~/server/utils/session'
import { getOAuthRedirectUri } from '~/server/utils/oauth-redirect'
import { getRequestURL } from 'h3'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as {
    googleClientId: string
    googleClientSecret: string
    sessionSecret: string
    sessionCookieName: string
    sessionMaxAge: number
  }
  const { googleClientId, googleClientSecret, sessionSecret, sessionCookieName, sessionMaxAge } = config

  if (!googleClientId || !googleClientSecret || !sessionSecret) {
    throw createError({ statusCode: 500, message: 'Auth not configured' })
  }

  const query = getQuery(event)
  const code = query.code as string
  const error = query.error as string | undefined
  if (error) return sendRedirect(event, '/login?error=' + encodeURIComponent(error))
  if (!code) return sendRedirect(event, '/login?error=no_code')

  const requestUrl = getRequestURL(event)
  const redirectUri = getOAuthRedirectUri(event)

  console.log(
    '[auth/callback] Token exchange',
    'requestOrigin=', requestUrl.origin,
    'redirectUri=', redirectUri,
  )

  let tokenRes: { access_token: string }
  try {
    tokenRes = await $fetch<{ access_token: string }>(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
  } catch (e) {
    const err = e as any
    console.error('[auth/callback] Token exchange failed', 'message=', err?.message, 'data=', err?.data)
    return sendRedirect(event, '/login?error=token_exchange_failed')
  }

  let userinfoRes: { sub?: string; id?: string; email?: string; name?: string; [k: string]: unknown }
  try {
    // @ts-expect-error - external URL, not a Nuxt API route
    userinfoRes = await $fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    }) as { sub?: string; id?: string; email?: string; name?: string; [k: string]: unknown }
  } catch (e) {
    console.error('[auth/callback] Userinfo fetch failed', e)
    return sendRedirect(event, '/login?error=missing_userinfo')
  }

  const googleSubRaw = userinfoRes?.sub ?? userinfoRes?.id
  const googleSub = googleSubRaw != null ? String(googleSubRaw) : ''
  const email = userinfoRes?.email != null ? String(userinfoRes.email) : ''
  if (!googleSub || !email) {
    console.error('[auth/callback] missing_userinfo')
    return sendRedirect(event, '/login?error=missing_userinfo')
  }
  const name = userinfoRes?.name != null ? String(userinfoRes.name) : null

  const db = useDb(event)
  const now = new Date()

  let user: User

  // 1) Look up by Google sub (existing linked account)
  const existingBySub = await db.select().from(users).where(eq(users.googleSub, googleSub)).limit(1)

  if (existingBySub.length > 0) {
    user = existingBySub[0]
    await db
      .update(users)
      .set({ email, name, lastLoginAt: now })
      .where(eq(users.id, user.id))
    user = { ...user, email, name, lastLoginAt: now }
  } else {
    // 2) New user — first ever login gets admin role
    const existingAny = await db.select({ id: users.id }).from(users).limit(1)
    const isFirstUser = existingAny.length === 0

    console.log('[auth/callback] New user email=', email, 'isFirstUser=', isFirstUser)
    const [inserted] = await db
      .insert(users)
      .values({
        email,
        name,
        googleSub,
        role: isFirstUser ? 'admin' : 'member',
        createdAt: now,
        lastLoginAt: now,
      })
      .returning()
    if (!inserted) {
      throw createError({ statusCode: 500, message: 'Failed to create user' })
    }
    user = inserted
    console.log('[auth/callback] Created user id=', user.id, 'role=', user.role)
  }

  if (user.suspended) {
    console.warn('[auth/callback] Suspended user attempted login id=', user.id)
    return sendRedirect(event, '/login?error=account_suspended')
  }

  const token = await createSession(
    {
      sub: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role as 'admin' | 'member',
      googleSub: user.googleSub,
    },
    sessionSecret,
    sessionMaxAge,
  )
  setSessionCookie(event, sessionCookieName, token, sessionMaxAge)
  return sendRedirect(event, '/')
})
