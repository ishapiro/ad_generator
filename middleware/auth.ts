export default defineNuxtRouteMiddleware(async (to) => {
  const { data } = await useFetch<{ user: { id: number; email: string; name: string | null; role: string } | null }>(
    '/api/auth/session',
    { key: 'auth-session' },
  )
  useState('auth-user', () => data.value?.user ?? null)
  if (!data.value?.user) {
    return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath))
  }
})
