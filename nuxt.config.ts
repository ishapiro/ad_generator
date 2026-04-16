// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-20',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    falKey: '',           // NUXT_FAL_KEY in .dev.vars
    templatedApiKey: '',  // NUXT_TEMPLATED_API_KEY in .dev.vars
    geminiApiKey: '',     // NUXT_GEMINI_API_KEY in .dev.vars / Wrangler secret
    publicBaseUrl: '',    // NUXT_PUBLIC_BASE_URL — production: https://adgen.cogitations.com
    tempStorageUrl: 'https://adgen.cogitations.com', // NUXT_TEMP_STORAGE_URL
    // Google OAuth
    oauthRedirectOrigin: '',  // NUXT_OAUTH_REDIRECT_ORIGIN — optional, e.g. http://localhost:8787
    googleClientId: '',       // NUXT_GOOGLE_CLIENT_ID
    googleClientSecret: '',   // NUXT_GOOGLE_CLIENT_SECRET
    // Session
    sessionSecret: '',        // NUXT_SESSION_SECRET — random string for JWT signing
    sessionCookieName: 'adgen_session',
    sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
  },
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.plugin === 'nuxt:module-preload-polyfill') return
          warn(warning)
        },
      },
    },
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: false,
    },
    imports: {
      // Workaround: unimport dedupeImports fires a false-positive warning when
      // @nuxt/nitro-server registers useAppConfig with priority:-1 and the Math.max
      // fallback makes the priority diff equal to 0. Suppress only that message.
      warn: (msg: string) => {
        if (msg.includes('Duplicated imports "useAppConfig"')) return
        console.warn(msg)
      },
    },
  },
  tailwindcss: {},
})
