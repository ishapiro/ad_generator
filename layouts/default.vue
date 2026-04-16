<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-wide px-4">
        <div class="flex h-16 items-center justify-between">
          <NuxtLink to="/" class="flex min-w-0 items-center gap-3">
            <div style="width: 36px; height: 36px; flex-shrink: 0;">
              <img
                src="/cogitations-logo-only.svg"
                alt="Cogitations logo"
                style="display: block; width: 36px; height: 36px; max-width: none;"
              />
            </div>
            <span class="hidden text-lg font-semibold text-slate-900 md:block">Cogitations Media/Ad Management</span>
            <span class="text-base font-semibold text-slate-900 md:hidden">Ad Manager</span>
          </NuxtLink>

          <!-- Desktop nav -->
          <nav class="hidden items-center gap-6 md:flex">
            <NuxtLink
              to="/"
              class="text-sm font-medium text-slate-600 hover:text-slate-900"
              active-class="text-blue-600 font-semibold"
              :class="{ 'text-blue-600 font-semibold': route.path === '/' }"
            >
              Projects
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
              v-if="user?.role === 'admin'"
              to="/admin"
              class="text-sm font-medium text-slate-600 hover:text-slate-900"
              active-class="text-blue-600 font-semibold"
            >
              Admin
            </NuxtLink>
            <NuxtLink
              to="/about"
              class="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              About
            </NuxtLink>
            <div v-if="user" class="flex items-center gap-3 border-l border-slate-200 pl-6">
              <span class="text-sm text-slate-600">{{ user.name ?? user.email }}</span>
              <a
                href="/api/auth/logout"
                class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Sign out
              </a>
            </div>
          </nav>

          <!-- Mobile hamburger button -->
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile dropdown menu -->
      <div v-if="mobileMenuOpen" class="border-t border-slate-100 bg-white md:hidden">
        <nav class="mx-auto max-w-wide space-y-1 px-4 py-3">
          <NuxtLink
            to="/"
            class="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            active-class="bg-blue-50 text-blue-700"
            @click="mobileMenuOpen = false"
          >
            Projects
          </NuxtLink>
          <a
            href="https://app.templated.io"
            target="_blank"
            rel="noopener noreferrer"
            class="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="mobileMenuOpen = false"
          >
            templated.io ↗
          </a>
          <NuxtLink
            v-if="user?.role === 'admin'"
            to="/admin"
            class="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            active-class="bg-blue-50 text-blue-700"
            @click="mobileMenuOpen = false"
          >
            Admin
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="mobileMenuOpen = false"
          >
            About
          </NuxtLink>
          <div v-if="user" class="border-t border-slate-100 pt-2">
            <p class="px-3 py-1 text-xs text-slate-500">{{ user.email }}</p>
            <a
              href="/api/auth/logout"
              class="block rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              @click="mobileMenuOpen = false"
            >
              Sign out
            </a>
          </div>
        </nav>
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
const route = useRoute()
const mobileMenuOpen = ref(false)
watch(() => route.path, () => { mobileMenuOpen.value = false })

const user = useState<{ id: number; email: string; name: string | null; role: string } | null>('auth-user')
</script>
