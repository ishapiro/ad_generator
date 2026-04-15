<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div v-if="pending" class="text-slate-500">Loading…</div>
    <div v-else-if="!config">
      <p class="text-red-500">Ad config not found.</p>
      <NuxtLink to="/ads" class="text-blue-600 hover:underline">← Back to list</NuxtLink>
    </div>

    <template v-else>
      <!-- ── Header ── -->
      <div class="mb-6">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <NuxtLink to="/ads" class="text-sm text-slate-500 hover:text-slate-700">← All Ad Profiles</NuxtLink>
          <div class="flex flex-wrap gap-3">
            <button
              v-if="isTemplateBased && !templateChanged && textTemplateLayers.length > 0"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="showGenerateCopyModal = true"
            >
              Generate All Copy with AI
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="showGeneratedModal = true"
            >
              Completed ({{ generatedAds.length }})
            </button>
            <div class="relative" :title="templateChanged ? 'Reconfigure fields before generating' : isDirty ? 'Save your changes before generating' : undefined">
              <button
                type="button"
                :disabled="saving || !isDirty"
                class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="save"
              >
                {{ saving ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
            <div class="relative" :title="templateChanged ? 'Reconfigure fields before generating' : isDirty ? 'Save your changes before generating' : undefined">
              <button
                type="button"
                :disabled="generating || isDirty || templateChanged"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                @click="generate"
              >
                {{ generating ? 'Generating…' : 'Generate Ad' }}
              </button>
            </div>
          </div>
        </div>
        <p v-if="copyModel" class="text-xs text-slate-400">Copy generated using {{ copyModel }}</p>
        <p v-if="copyError" class="text-sm text-red-600">{{ copyError }}</p>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Customizing Existing Ad Profile to Generate Ad Media</p>
        <h1 class="mt-0.5 text-2xl font-bold text-slate-900">{{ form.name || 'Untitled' }}</h1>
      </div>

      <!-- Error banner -->
      <div v-if="errorMsg" class="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMsg }}
      </div>

      <!-- Template-changed warning -->
      <div v-if="templateChanged" class="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-4">
        <p class="text-sm font-semibold text-amber-900">The Templated.io template has changed since this Ad Profile was created.</p>
        <p class="mt-1 text-sm text-amber-800">
          The template's fields no longer match what's stored in this profile. You'll need to remap your content to the updated layout before generating a new ad.
          Your existing values will be carried over wherever field names still match.
        </p>
        <NuxtLink
          :to="`/ads/reconfigure/${id}`"
          class="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Reconfigure Fields →
        </NuxtLink>
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
            <p class="mt-2 text-center text-xs text-slate-400">Original Templated.io Template</p>
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

            <!-- One card per layer — entire section hidden when collapsed -->
            <template v-if="!layersCollapsed">
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

                <!-- Card body -->
                <div class="border-t border-slate-100 px-5 pb-5 pt-4">
                  <!-- Text layer -->
                  <template v-if="layer.type !== 'image'">
                    <div class="relative">
                      <textarea
                        v-model="layer.value"
                        rows="2"
                        :placeholder="`Text for '${layer.layer}'…`"
                        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        class="absolute right-2 top-2 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600"
                        title="Rewrite with AI"
                        @click="aiModalLayer = layer.layer"
                      >
                        AI
                      </button>
                    </div>
                  </template>

                  <!-- Image layer -->
                  <template v-else>
                    <ImageLayerInput
                      :layer-name="layer.layer"
                      :prompt="layer.prompt ?? ''"
                      :r2-key="layer.r2Key ?? ''"
                      :image-mode="(layer.imageMode as 'generate' | 'upload') ?? 'generate'"
                      :saved-prompts="promptLibrary"
                      :profile-id="id"
                      @update:prompt="layer.prompt = $event"
                      @update:r2-key="layer.r2Key = $event"
                      @update:image-mode="layer.imageMode = $event"
                      @prompt-saved="promptLibrary.unshift($event)"
                      @prompt-deleted="promptLibrary = promptLibrary.filter(p => p.id !== $event)"
                    />
                  </template>
                </div>
              </div>
            </template>
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
              <input v-model="form.name" type="text" class="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label class="text-sm font-medium text-slate-700">Headline</label>
                <button type="button" class="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600" @click="openLegacyAiModal('Headline', 'headline')">AI</button>
              </div>
              <input v-model="form.headline" type="text" class="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label class="text-sm font-medium text-slate-700">Subheadline</label>
                <button type="button" class="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600" @click="openLegacyAiModal('Subheadline', 'subheadline')">AI</button>
              </div>
              <input v-model="form.subheadline" type="text" class="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label class="text-sm font-medium text-slate-700">Body Copy</label>
                <button type="button" class="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600" @click="openLegacyAiModal('Body Copy', 'bodyText')">AI</button>
              </div>
              <textarea v-model="form.bodyText" rows="3" class="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <div class="mb-1 flex items-center justify-between">
                <label class="text-sm font-medium text-slate-700">CTA Button Text</label>
                <button type="button" class="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600" @click="openLegacyAiModal('CTA Button Text', 'ctaText')">AI</button>
              </div>
              <input v-model="form.ctaText" type="text" class="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Background Color / Description</label>
              <input v-model="form.backgroundDescription" type="text" placeholder="dark navy" class="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Hero Image Prompt</label>
              <textarea v-model="form.heroImagePrompt" rows="5" class="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-slate-800">Bullet Steps</h2>
            <BulletStepEditor v-model="form.bulletSteps" />
          </div>
        </div>
      </template>

    </template>
  </div>

  <!-- ── Generate All Copy Modal ── -->
  <GenerateCopyModal
    v-if="showGenerateCopyModal"
    :show="showGenerateCopyModal"
    :template-name="config?.name ?? ''"
    :fields="textTemplateLayers.map(l => ({ name: l.layer, value: l.value ?? '', type: l.type }))"
    @update:show="val => { showGenerateCopyModal = val }"
    @generated="onCopyGenerated"
  />

  <!-- ── AI Copy Modal ── -->
  <AiCopyModal
    v-if="aiModalLayer"
    :show="!!aiModalLayer"
    :field-name="aiModalLabel || aiModalLayer"
    :current-value="aiModalCurrentValue"
    :template-name="config?.name ?? ''"
    :other-fields="aiOtherFields"
    @update:show="val => { if (!val) { aiModalLayer = ''; aiModalLabel = '' } }"
    @accept="applyAiSuggestion"
  />

  <!-- ── Image Viewer Modal ── -->
  <div
    v-if="viewingImageKey"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
    @click.self="viewingImageKey = null"
  >
    <div style="width: 80vw; height: 80vh; position: relative; display: flex; flex-direction: column; background: #fff; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
      <!-- Close button -->
      <button
        type="button"
        style="position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; background: rgba(255,255,255,0.9); border-radius: 0.5rem; padding: 0.375rem 0.625rem; font-size: 0.875rem; line-height: 1; color: #475569; border: 1px solid #e2e8f0;"
        @click="viewingImageKey = null"
      >
        ✕ Close
      </button>
      <!-- Image -->
      <img
        :src="`/api/images/${viewingImageKey}`"
        alt="Generated ad"
        style="display: block; width: 100%; height: 100%; object-fit: contain; max-width: none; padding-top: 1.5rem; padding-bottom: 1.5rem;"
      />
    </div>
  </div>

  <!-- ── Generated Ads Modal ── -->
  <div
    v-if="showGeneratedModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="closeModal"
  >
    <div class="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
      <!-- Sticky header -->
      <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-800">Generated Ads</h2>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          @click="closeModal"
        >
          ✕
        </button>
      </div>

      <!-- Scrollable grid -->
      <div class="overflow-y-auto p-6">
        <div v-if="!generatedAds.length" class="py-10 text-center text-slate-400">
          No ads generated yet. Click "Generate Ad" to create one.
        </div>
        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="ad in generatedAds"
            :key="ad.id"
            class="overflow-hidden rounded-xl border bg-white shadow-sm transition"
            :class="ad.id === highlightedAdId
              ? 'border-blue-500 ring-2 ring-blue-400 ring-offset-2'
              : 'border-slate-200'"
          >
            <!-- Status bar -->
            <div class="flex flex-wrap items-center gap-2 px-4 py-3">
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
                  <button
                    type="button"
                    class="text-sm text-blue-600 hover:underline"
                    @click="viewingImageKey = ad.r2Key"
                  >
                    Zoom
                  </button>
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

            <!-- Image fills card edge to edge -->
            <img
              v-if="ad.status === 'complete' && ad.r2Key"
              :src="`/api/images/${ad.r2Key}`"
              alt="Generated ad"
              class="w-full"
            />
            <div v-else-if="ad.status === 'error'" class="mx-4 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {{ ad.errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
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

interface TemplatedLayer {
  layer: string
  type: string
  description?: string
}

interface TemplatedTemplate {
  id: string
  thumbnail?: string
  width?: number
  height?: number
  layers?: TemplatedLayer[]
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
const templateLiveLayers = ref<TemplatedLayer[]>([])

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
      templateLiveLayers.value = tpl.layers ?? []
    } catch {
      // thumbnail is optional — don't block the page
    }
  }
}, { immediate: true })

// Detect when the Templated.io template's layer structure has changed since the profile was saved
const templateChanged = computed(() => {
  if (!isTemplateBased.value || !templateLiveLayers.value.length || !templateLayers.value.length) return false
  const live = templateLiveLayers.value.map(l => `${l.layer}::${l.type}`).sort().join(',')
  const stored = templateLayers.value.map(l => `${l.layer}::${l.type}`).sort().join(',')
  return live !== stored
})

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
    // Capture baseline after both watches have populated their state
    nextTick(() => { savedSnapshot.value = takeSnapshot() })
  },
  { immediate: true },
)

// ── Dirty tracking ──
const savedSnapshot = ref('')

function takeSnapshot(): string {
  return JSON.stringify({
    name: form.name,
    layers: templateLayers.value,
    headline: form.headline,
    subheadline: form.subheadline,
    bodyText: form.bodyText,
    ctaText: form.ctaText,
    heroImagePrompt: form.heroImagePrompt,
    backgroundDescription: form.backgroundDescription,
    bulletSteps: form.bulletSteps,
  })
}

const isDirty = computed(() => savedSnapshot.value !== '' && takeSnapshot() !== savedSnapshot.value)

// ── Collapse state ──
const layersCollapsed = ref(true)

const saving = ref(false)
const generating = ref(false)
const errorMsg = ref('')
const showGeneratedModal = ref(false)
const highlightedAdId = ref<number | null>(null)
const viewingImageKey = ref<string | null>(null)

// ── AI copy generation ──
const aiModalLayer = ref('')   // template layer name OR legacy field key, '' = closed
const aiModalLabel = ref('')   // human-readable label for legacy fields
const showGenerateCopyModal = ref(false)
const copyError = ref('')
const copyModel = ref('')

// For template-based: the value in the currently open layer
const aiModalCurrentValue = computed(() => {
  if (!aiModalLayer.value) return ''
  if (isTemplateBased.value) {
    return templateLayers.value.find(l => l.layer === aiModalLayer.value)?.value ?? ''
  }
  // Legacy: aiModalLayer holds the form field key
  return (form as Record<string, unknown>)[aiModalLayer.value] as string ?? ''
})

const textTemplateLayers = computed(() =>
  templateLayers.value.filter(l => l.type !== 'image'),
)

// Other fields passed as context to the AI modal
const aiOtherFields = computed(() => {
  if (isTemplateBased.value) {
    return textTemplateLayers.value
      .filter(l => l.layer !== aiModalLayer.value)
      .map(l => ({ name: l.layer, value: l.value ?? '' }))
  }
  // Legacy: provide all text fields except the one being edited
  const legacyFields: Array<{ name: string; value: string }> = [
    { name: 'Headline', value: form.headline },
    { name: 'Subheadline', value: form.subheadline },
    { name: 'Body Copy', value: form.bodyText },
    { name: 'CTA Button Text', value: form.ctaText },
  ]
  return legacyFields.filter(f => f.name !== (aiModalLabel.value || aiModalLayer.value))
})

function openLegacyAiModal(label: string, fieldKey: string) {
  aiModalLabel.value = label
  aiModalLayer.value = fieldKey
}

function applyAiSuggestion(value: string) {
  if (isTemplateBased.value) {
    const layer = templateLayers.value.find(l => l.layer === aiModalLayer.value)
    if (layer) layer.value = value
  } else {
    ;(form as Record<string, unknown>)[aiModalLayer.value] = value
  }
  aiModalLayer.value = ''
  aiModalLabel.value = ''
}

function onCopyGenerated(payload: { suggestions: Array<{ name: string; value: string }>; model: string }) {
  for (const s of payload.suggestions) {
    const layer = templateLayers.value.find(l => l.layer === s.name)
    if (layer) layer.value = s.value
  }
  copyModel.value = payload.model
}

function closeModal() {
  showGeneratedModal.value = false
  highlightedAdId.value = null
}

onMounted(() => {
  if (route.query.showGenerated === 'true') {
    showGeneratedModal.value = true
  }
})

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
    savedSnapshot.value = takeSnapshot()
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function deleteGeneratedAd(genId: number) {
  if (!confirm('Delete this generated ad?')) return
  await $fetch(`/api/generated-ads/${genId}`, { method: 'DELETE' })
  await refresh()
}

async function generate() {
  generating.value = true
  errorMsg.value = ''
  try {
    const newAd = await $fetch<GeneratedAd>(`/api/ad-configs/${id}/generate`, { method: 'POST' })
    await refresh()
    highlightedAdId.value = newAd.id
    showGeneratedModal.value = true
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
