<template>
  <!-- Password gate -->
  <div v-if="!authed" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80">
    <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
      <div style="width: 48px; height: 48px; margin: 0 auto 1.25rem;">
        <img
          src="/cogitations-logo-only.svg"
          alt="Cogitations logo"
          style="display: block; width: 48px; height: 48px; max-width: none;"
        />
      </div>
      <h1 class="text-center text-xl font-semibold text-slate-900">Cogitations Media/Ad Management</h1>
      <p class="mt-3 text-center text-sm text-slate-600">
        This is a private application for the exclusive use of the
        <span class="font-medium text-slate-800">Cogitations family of companies</span>.
        Please enter the access password to continue.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="submitPassword">
        <input
          v-model="password"
          type="password"
          placeholder="Access password"
          autocomplete="current-password"
          required
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p v-if="authError" class="text-sm text-red-600">{{ authError }}</p>
        <button
          type="submit"
          :disabled="submitting || !password.trim()"
          class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {{ submitting ? 'Verifying…' : 'Enter' }}
        </button>
      </form>
    </div>
  </div>

  <div class="flex min-h-screen flex-col">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-wide px-4">
        <div class="flex h-16 items-center">
          <div class="flex w-full items-center justify-between">
            <NuxtLink to="/" class="flex items-center gap-3">
              <div style="width: 36px; height: 36px; flex-shrink: 0;">
                <img
                  src="/cogitations-logo-only.svg"
                  alt="Cogitations logo"
                  style="display: block; width: 36px; height: 36px; max-width: none;"
                />
              </div>
              <span class="text-lg font-semibold text-slate-900">Cogitations Media/Ad Management</span>
            </NuxtLink>
            <nav class="flex items-center gap-6">
              <NuxtLink
                to="/ads"
                class="text-sm font-medium text-slate-600 hover:text-slate-900"
                active-class="text-blue-600 font-semibold"
              >
                Ads
              </NuxtLink>
              <NuxtLink
                to="/media"
                class="text-sm font-medium text-slate-600 hover:text-slate-900"
                active-class="text-blue-600 font-semibold"
              >
                Media
              </NuxtLink>
              <a
                href="https://app.templated.io"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                templated.io
              </a>
              <NuxtLink
                to="/about"
                class="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                About
              </NuxtLink>
            </nav>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-slate-200 bg-slate-50">
      <div class="mx-auto max-w-wide px-4 py-6">
        <div class="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p class="text-sm text-slate-500">© Cogitations 2026</p>
          <NuxtLink to="/privacy" class="text-sm text-slate-500 hover:text-slate-700 hover:underline">
            Privacy Policy
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const authedCookie = useCookie('adgen_authed', { maxAge: 60 * 60 * 24 * 7 })
const authed = ref(!!authedCookie.value)

const password = ref('')
const submitting = ref(false)
const authError = ref<string | null>(null)

async function submitPassword() {
  authError.value = null
  submitting.value = true
  try {
    await $fetch('/api/auth/verify', { method: 'POST', body: { password: password.value } })
    authedCookie.value = '1'
    authed.value = true
  } catch (e: unknown) {
    authError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Incorrect password'
        : 'Incorrect password'
  } finally {
    submitting.value = false
  }
}
</script>
