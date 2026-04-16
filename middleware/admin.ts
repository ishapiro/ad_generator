export default defineNuxtRouteMiddleware(() => {
  const user = useState<{ role: string } | null>('auth-user')
  if (!user.value) return navigateTo('/login')
  if (user.value.role !== 'admin') return navigateTo('/')
})
