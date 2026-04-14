<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div v-if="pending" class="text-slate-500">Loading…</div>
    <div v-else-if="!config">
      <p class="text-red-500">Ad config not found.</p>
      <NuxtLink to="/" class="text-blue-600 hover:underline">← Back to list</NuxtLink>
    </div>
    <template v-else>
      <!-- Header -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <NuxtLink to="/" class="text-sm text-slate-500 hover:text-slate-700">← Back</NuxtLink>
        <h1 class="flex-1 text-2xl font-bold text-slate-900">{{ form.name || 'Untitled' }}</h1>
        <button
          type="button"
          :disabled="saving"
          class="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
        <button
          type="button"
          :disabled="generating"
          class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          @click="generate"
        >
          {{ generating ? 'Generating…' : 'Generate Ad' }}
        </button>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMsg }}
      </div>

      <!-- Form + Bullet Steps -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Left: text fields -->
        <div class="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-800">Ad Content</h2>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Config Name</label>
            <input v-model="form.name" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Headline</label>
            <input v-model="form.headline" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Subheadline</label>
            <input v-model="form.subheadline" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Body Copy</label>
            <textarea v-model="form.bodyText" rows="3" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">CTA Button Text</label>
            <input v-model="form.ctaText" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Background Color / Description</label>
            <input v-model="form.backgroundDescription" type="text" placeholder="dark navy" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Hero Image Prompt</label>
            <textarea v-model="form.heroImagePrompt" rows="5" class="input-field" />
          </div>
        </div>

        <!-- Right: bullet steps -->
        <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Bullet Steps</h2>
          <BulletStepEditor v-model="form.bulletSteps" />
        </div>
      </div>

      <!-- Generated Ads Preview -->
      <div class="mt-8">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Generated Ads</h2>

        <div v-if="!generatedAds.length" class="rounded border border-dashed border-slate-200 py-8 text-center text-slate-400">
          No ads generated yet. Click "Generate Ad" above.
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="ad in generatedAds"
            :key="ad.id"
            class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="mb-3 flex items-center gap-3">
              <span
                :class="{
                  'bg-yellow-100 text-yellow-800': ad.status === 'generating' || ad.status === 'pending',
                  'bg-green-100 text-green-800': ad.status === 'complete',
                  'bg-red-100 text-red-800': ad.status === 'error',
                }"
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              >
                {{ ad.status }}
              </span>
              <span class="text-xs text-slate-400">{{ new Date(ad.createdAt ?? '').toLocaleString() }}</span>
              <a
                v-if="ad.status === 'complete' && ad.r2Key"
                :href="`/api/images/${ad.r2Key}`"
                target="_blank"
                download
                class="ml-auto text-sm text-blue-600 hover:underline"
              >
                Download
              </a>
            </div>

            <div v-if="ad.status === 'complete' && ad.r2Key">
              <img
                :src="`/api/images/${ad.r2Key}`"
                alt="Generated ad"
                class="max-w-full rounded border border-slate-100"
              />
            </div>
            <div v-else-if="ad.status === 'error'" class="rounded bg-red-50 p-3 text-sm text-red-700">
              {{ ad.errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface BulletStep {
  icon: string
  label: string
}

interface AdConfig {
  id: number
  name: string
  headline: string
  subheadline: string
  bodyText: string
  ctaText: string
  heroImagePrompt: string
  backgroundDescription: string
  bulletSteps: string
  createdAt: Date | null
  updatedAt: Date | null
}

interface GeneratedAd {
  id: number
  adConfigId: number
  status: string
  r2Key: string | null
  errorMessage: string | null
  createdAt: Date | null
}

const route = useRoute()
const id = Number(route.params.id)

const { data, pending, refresh } = await useFetch<{ config: AdConfig; generatedAds: GeneratedAd[] }>(
  `/api/ad-configs/${id}`,
)

const config = computed(() => data.value?.config ?? null)
const generatedAds = computed(() => data.value?.generatedAds ?? [])

const form = reactive({
  name: '',
  headline: '',
  subheadline: '',
  bodyText: '',
  ctaText: '',
  heroImagePrompt: '',
  backgroundDescription: '',
  bulletSteps: [] as BulletStep[],
})

watch(
  config,
  (c) => {
    if (!c) return
    form.name = c.name
    form.headline = c.headline
    form.subheadline = c.subheadline
    form.bodyText = c.bodyText
    form.ctaText = c.ctaText
    form.heroImagePrompt = c.heroImagePrompt
    form.backgroundDescription = c.backgroundDescription
    try {
      form.bulletSteps = JSON.parse(c.bulletSteps || '[]')
    } catch {
      form.bulletSteps = []
    }
  },
  { immediate: true },
)

const saving = ref(false)
const generating = ref(false)
const errorMsg = ref('')

async function save() {
  saving.value = true
  errorMsg.value = ''
  try {
    await $fetch(`/api/ad-configs/${id}`, { method: 'PUT', body: form })
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function generate() {
  generating.value = true
  errorMsg.value = ''
  try {
    await $fetch(`/api/ad-configs/${id}/generate`, { method: 'POST' })
    await refresh()
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Generation failed'
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.input-field {
  @apply w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}
</style>
