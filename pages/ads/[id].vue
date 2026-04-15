<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div v-if="pending" class="text-slate-500">Loading…</div>
    <div v-else-if="!config">
      <p class="text-red-500">Ad config not found.</p>
      <NuxtLink to="/" class="text-blue-600 hover:underline">← Back to list</NuxtLink>
    </div>

    <template v-else>
      <!-- ── Header ── -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <NuxtLink to="/" class="text-sm text-slate-500 hover:text-slate-700">← All Ad Profiles</NuxtLink>

        <span v-if="config.templateId" class="text-sm text-slate-300">|</span>
        <NuxtLink
          v-if="config.templateId"
          :to="`/templates/${config.templateId}`"
          class="text-sm text-blue-500 hover:underline"
        >
          Template ↗
        </NuxtLink>

        <h1 class="flex-1 text-xl font-bold text-slate-900">{{ form.name || 'Untitled' }}</h1>

        <button
          type="button"
          :disabled="saving"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
        <button
          type="button"
          :disabled="generating"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          @click="generate"
        >
          {{ generating ? 'Generating…' : 'Generate Ad' }}
        </button>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMsg }}
      </div>

      <!-- ══ TEMPLATE-BASED EDITOR ══ -->
      <template v-if="isTemplateBased">
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
          <!-- Left: template thumbnail -->
          <div class="xl:sticky xl:top-6 xl:self-start">
            <div class="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img
                v-if="templateThumbnail"
                :src="templateThumbnail"
                alt="Template preview"
                :width="templateWidth ?? 1080"
                :height="templateHeight ?? 1080"
                class="w-full h-auto"
              />
              <div v-else class="flex h-40 items-center justify-center text-xs text-slate-400">
                Loading preview…
              </div>
            </div>
          </div>

          <!-- Right: layer editor -->
          <div class="space-y-4">
            <!-- Variation name -->
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <label class="mb-1 block text-sm font-semibold text-slate-700">Ad Profile Name</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <!-- Section toggle -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-600">{{ templateLayers.length }} layer{{ templateLayers.length !== 1 ? 's' : '' }}</span>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                @click="layersCollapsed = !layersCollapsed"
              >
                {{ layersCollapsed ? '▼ Expand Fields' : '▲ Collapse Fields' }}
              </button>
            </div>

            <!-- One card per layer -->
            <div
              v-for="layer in templateLayers"
              :key="layer.layer"
              class="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <!-- Card header -->
              <div class="flex items-center gap-2 px-5 py-3">
                <span
                  class="shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                  :class="layer.type === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                >
                  {{ layer.type === 'image' ? 'Image' : 'Text' }}
                </span>
                <span class="font-medium text-slate-800">{{ layer.layer }}</span>
              </div>

              <!-- Expandable body -->
              <div v-if="!layersCollapsed" class="border-t border-slate-100 px-5 pb-5 pt-4">
                <!-- Text layer -->
                <template v-if="layer.type !== 'image'">
                  <textarea
                    v-model="layer.value"
                    rows="2"
                    :placeholder="`Text for '${layer.layer}'…`"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </template>

                <!-- Image layer -->
                <template v-else>
                  <ImageLayerInput
                    :layer-name="layer.layer"
                    :prompt="layer.prompt ?? ''"
                    :r2-key="layer.r2Key ?? ''"
                    :image-mode="(layer.imageMode as 'generate' | 'upload') ?? 'generate'"
                    :saved-prompts="promptLibrary"
                    @update:prompt="layer.prompt = $event"
                    @update:r2-key="layer.r2Key = $event"
                    @update:image-mode="layer.imageMode = $event"
                    @prompt-saved="promptLibrary.unshift($event)"
                    @prompt-deleted="promptLibrary = promptLibrary.filter(p => p.id !== $event)"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ══ LEGACY EDITOR ══ -->
      <template v-else>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-slate-800">Bullet Steps</h2>
            <BulletStepEditor v-model="form.bulletSteps" />
          </div>
        </div>
      </template>

      <!-- ── Generated Ads ── -->
      <div class="mt-10">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Generated Ads</h2>

        <div v-if="!generatedAds.length" class="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-400">
          No ads generated yet. Click "Generate Ad" above.
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="ad in generatedAds"
            :key="ad.id"
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <!-- Status bar -->
            <div class="flex items-center gap-3 px-5 py-3">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-yellow-100 text-yellow-800': ad.status === 'generating' || ad.status === 'pending',
                  'bg-emerald-100 text-emerald-800': ad.status === 'complete',
                  'bg-red-100 text-red-800': ad.status === 'error',
                }"
              >
                {{ ad.status }}
              </span>
              <span class="text-xs text-slate-400">{{ new Date(ad.createdAt ?? '').toLocaleString() }}</span>
              <div class="ml-auto flex gap-3">
                <template v-if="ad.status === 'complete' && ad.r2Key">
                  <a :href="`/api/images/${ad.r2Key}`" target="_blank" class="text-sm text-blue-600 hover:underline">
                    View
                  </a>
                  <a :href="`/api/images/${ad.r2Key}`" target="_blank" download class="text-sm text-blue-600 hover:underline">
                    Download
                  </a>
                </template>
                <button
                  type="button"
                  class="text-sm text-red-500 hover:text-red-700"
                  @click="deleteGeneratedAd(ad.id)"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Full-width image — no card padding so it fills edge to edge -->
            <img
              v-if="ad.status === 'complete' && ad.r2Key"
              :src="`/api/images/${ad.r2Key}`"
              alt="Generated ad"
              class="w-full"
            />
            <div v-else-if="ad.status === 'error'" class="mx-5 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {{ ad.errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface LayerSelection {
  layer: string
  type: string
  value?: string
  prompt?: string
  r2Key?: string
  imageMode?: string
}

interface SavedPrompt {
  id: number
  name: string
  prompt: string
}

interface BulletStep {
  icon: string
  label: string
}

interface AdConfig {
  id: number
  name: string
  templateId: string | null
  templateLayers: string | null
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

interface TemplatedTemplate {
  id: string
  thumbnail?: string
  width?: number
  height?: number
}

const route = useRoute()
const id = Number(route.params.id)

const [{ data, pending, refresh }, promptsRes] = await Promise.all([
  useFetch<{ config: AdConfig; generatedAds: GeneratedAd[] }>(
    `/api/ad-configs/${id}`,
    { key: `ad-config-${id}` },
  ),
  useFetch<SavedPrompt[]>('/api/prompts'),
])

const promptLibrary = ref<SavedPrompt[]>(promptsRes.data.value ?? [])

const config = computed(() => data.value?.config ?? null)
const generatedAds = computed(() => data.value?.generatedAds ?? [])

// Detect mode
const isTemplateBased = computed(() => !!config.value?.templateId && config.value?.templateLayers !== null)

// ── Template-based state ──
// Mutable copy of templateLayers for in-place editing
const templateLayers = ref<LayerSelection[]>([])

// Fetch the template thumbnail if this is a template-based config
const templateThumbnail = ref<string | null>(null)
const templateWidth = ref<number | null>(null)
const templateHeight = ref<number | null>(null)

watch(config, async (c) => {
  if (!c) return

  if (c.templateLayers) {
    try {
      templateLayers.value = JSON.parse(c.templateLayers)
    } catch {
      templateLayers.value = []
    }
  }

  if (c.templateId && !templateThumbnail.value) {
    try {
      const tpl = await $fetch<TemplatedTemplate>(`/api/templated/templates/${c.templateId}`)
      templateThumbnail.value = tpl.thumbnail ?? null
      templateWidth.value = tpl.width ?? null
      templateHeight.value = tpl.height ?? null
    } catch {
      // thumbnail is optional — don't block the page
    }
  }
}, { immediate: true })

// ── Shared form (name lives here for both modes) ──
const form = reactive({
  name: '',
  // Legacy fields
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

// ── Collapse state ──
const layersCollapsed = ref(false)

const saving = ref(false)
const generating = ref(false)
const errorMsg = ref('')

async function save() {
  saving.value = true
  errorMsg.value = ''
  try {
    if (isTemplateBased.value) {
      await $fetch(`/api/ad-configs/${id}`, {
        method: 'PUT',
        body: { name: form.name, templateLayers: templateLayers.value },
      })
    } else {
      await $fetch(`/api/ad-configs/${id}`, { method: 'PUT', body: form })
    }
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function deleteGeneratedAd(genId: number) {
  if (!confirm('Delete this generated ad?')) return
  await $fetch(`/api/generated-ads/${genId}`, { method: 'DELETE' })
  if (data.value) {
    data.value.generatedAds = data.value.generatedAds.filter(a => a.id !== genId)
  }
}

async function generate() {
  generating.value = true
  errorMsg.value = ''
  try {
    await $fetch(`/api/ad-configs/${id}/generate`, { method: 'POST' })
    await refresh()
  } catch (e: unknown) {
    errorMsg.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Generation failed'
        : 'Generation failed'
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
