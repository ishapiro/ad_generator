<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div v-if="pending" class="text-slate-500">Loading…</div>
    <div v-else-if="!config">
      <p class="text-red-500">Ad config not found.</p>
      <NuxtLink :to="adsListUrl" class="text-blue-600 hover:underline">← Back to list</NuxtLink>
    </div>

    <template v-else>
      <!-- ── Header ── -->
      <div class="mb-6">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <NuxtLink :to="adsListUrl" class="text-sm text-slate-500 hover:text-slate-700">← All Ad Profiles</NuxtLink>
          <div class="flex flex-wrap gap-3">
            <button
              v-if="isTemplateBased && !templateChanged && textTemplateLayers.length > 0"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="showGenerateCopyModal = true"
            >
              Generate All Copy with AI
            </button>
            <NuxtLink
              v-if="isTemplateBased"
              :to="`/ads/reconfigure/${id}`"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Fields
            </NuxtLink>
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
          <!-- Left: thumbnail — shows latest generated ad if available, otherwise template preview -->
          <div class="xl:sticky xl:top-6 xl:self-start">
            <div style="overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0; background: #f1f5f9;">
              <img
                v-if="previewImageSrc"
                :src="previewImageSrc"
                :alt="previewCaption"
                style="display: block; width: 100%; height: auto; max-width: none;"
              />
              <div v-else class="flex h-40 items-center justify-center text-xs text-slate-400">
                Loading preview…
              </div>
            </div>
            <p class="mt-2 text-center text-xs text-slate-400">{{ previewCaption }}</p>
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
                  <span
                    v-if="layer.type === 'image' && layerRatio(layer.layer)"
                    class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500"
                  >
                    {{ layerRatio(layer.layer) }}
                  </span>
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
                      :project-id="config?.projectId ?? undefined"
                      :layer-width="templateLiveLayers.find(l => l.layer === layer.layer)?.width"
                      :layer-height="templateLiveLayers.find(l => l.layer === layer.layer)?.height"
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
    :project-id="config?.projectId ?? undefined"
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
                  <button
                    type="button"
                    class="text-sm text-violet-600 hover:underline"
                    @click="openReview(ad.r2Key!)"
                  >
                    AI Review
                  </button>
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

  <!-- ── AI Review Modal ── -->
  <div
    v-if="reviewingAdKey"
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
    @click.self="closeReview"
  >
    <div class="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
      <!-- Header -->
      <div class="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-800">AI Ad Review</h2>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          @click="closeReview"
        >
          ✕
        </button>
      </div>

      <!-- Scrollable body -->
      <div class="overflow-y-auto p-6 space-y-5">
        <!-- Ad thumbnail -->
        <div style="max-width: 260px; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0;">
          <img
            :src="`/api/images/${reviewingAdKey}`"
            alt="Ad being reviewed"
            style="display: block; width: 100%; height: auto; max-width: none;"
          />
        </div>

        <!-- Prompt field -->
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-slate-700">Review Prompt</label>
          <!-- Preset buttons -->
          <div class="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
              @click="applyPreset('conversion')"
            >
              Conversion Review
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              @click="applyPreset('design')"
            >
              Colors &amp; Design Review
            </button>
          </div>
          <textarea
            v-model="reviewPrompt"
            rows="7"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <p class="mt-1 text-xs text-slate-400">
            Text field values and character counts are automatically appended to this prompt before sending.
          </p>
        </div>

        <!-- Submit button -->
        <button
          type="button"
          :disabled="reviewing || !reviewPrompt.trim()"
          class="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-50"
          @click="submitReview"
        >
          {{ reviewing ? 'Reviewing…' : 'Review Ad' }}
        </button>

        <!-- Error -->
        <p v-if="reviewError" class="text-sm text-red-600">{{ reviewError }}</p>

        <!-- AI response -->
        <div v-if="reviewResult" class="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-violet-500">AI Feedback</p>
            <button
              type="button"
              class="rounded px-2 py-0.5 text-xs font-medium text-violet-600 hover:bg-violet-100"
              @click="popOutReview"
            >
              Pop Out ↗
            </button>
          </div>
          <div class="prose prose-sm max-w-none text-slate-800" v-html="parsedReview" />
          <p v-if="reviewModel" class="mt-3 text-xs text-slate-400">Generated using {{ reviewModel }}</p>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
import { marked } from 'marked'

interface LayerSelection {
  layer: string
  type: string
  value?: string
  prompt?: string
  r2Key?: string
  imageMode?: string
  included?: boolean
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
  projectId: number | null
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
  width?: number
  height?: number
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
    { key: `ad-config-${id}`, server: false },
  ),
  useFetch<SavedPrompt[]>('/api/prompts', { server: false }),
])

const promptLibrary = ref<SavedPrompt[]>(promptsRes.data.value ?? [])

const config = computed(() => data.value?.config ?? null)
const adsListUrl = computed(() => config.value?.projectId ? `/ads?projectId=${config.value.projectId}` : '/ads')
const generatedAds = computed(() => data.value?.generatedAds ?? [])

const latestCompleteAd = computed(() =>
  generatedAds.value.find(a => a.status === 'complete' && a.r2Key) ?? null,
)

const previewImageSrc = computed(() =>
  latestCompleteAd.value ? `/api/images/${latestCompleteAd.value.r2Key}` : (templateThumbnail.value ?? null),
)

const previewCaption = computed(() =>
  latestCompleteAd.value ? 'Latest generated ad' : 'Original Templated.io template',
)

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
      templateLayers.value = (JSON.parse(c.templateLayers) as LayerSelection[]).filter(l => l.type === 'text' || l.type === 'image')
    } catch {
      templateLayers.value = []
    }
  }

  if (c.templateId && !templateThumbnail.value) {
    try {
      const tpl = await $fetch<TemplatedTemplate>(`/api/templated/templates/${c.templateId}`, { query: { projectId: c.projectId } })
      templateThumbnail.value = tpl.thumbnail ?? null
      templateWidth.value = tpl.width ?? null
      templateHeight.value = tpl.height ?? null
      templateLiveLayers.value = tpl.layers ?? []
    } catch {
      // thumbnail is optional — don't block the page
    }
  }
}, { immediate: true })

// Detect when the Templated.io template's layer structure has changed since the profile was saved.
// Both sides filter to text/image only — shape layers are excluded from profiles and must not trigger a false positive.
const templateChanged = computed(() => {
  if (!isTemplateBased.value || !templateLiveLayers.value.length || !templateLayers.value.length) return false
  const editableLive = templateLiveLayers.value.filter(l => l.type === 'text' || l.type === 'image')
  const live = editableLive.map(l => `${l.layer}::${l.type}`).sort().join(',')
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

// ── Layer aspect ratio display ──
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }

function layerRatio(layerName: string): string {
  const live = templateLiveLayers.value.find(l => l.layer === layerName)
  if (!live?.width || !live?.height) return ''
  const d = gcd(live.width, live.height)
  const rw = live.width / d
  const rh = live.height / d
  return rw <= 20 && rh <= 20 ? `${rw}:${rh}` : `${live.width}×${live.height}`
}

// ── Collapse state ──
const layersCollapsed = ref(true)

const saving = ref(false)
const generating = ref(false)
const errorMsg = ref('')
const showGeneratedModal = ref(false)
const highlightedAdId = ref<number | null>(null)
const viewingImageKey = ref<string | null>(null)

// ── AI ad review ──
const REVIEW_PRESETS = {
  conversion: `You are a senior Direct Response Copywriter and Conversion Rate Optimization (CRO) specialist with 15 years of experience running high-performing Meta, Google, and LinkedIn ad campaigns.

Analyze the ad image and evaluate it against proven direct response principles:
- Clarity of value proposition: does the viewer instantly understand the offer?
- Headline strength: is it specific, benefit-driven, and scroll-stopping?
- CTA effectiveness: is it clear, urgent, and low-friction?
- Credibility signals: social proof, trust indicators, or specificity of claims
- Visual hierarchy: does the eye flow naturally toward the CTA?
- Message-to-market fit: does the copy speak directly to the target audience's pain or desire?

Provide exactly 3–5 specific, actionable recommendations to increase click-through and conversion rate. For each recommendation:
1. Name the specific element to change
2. Explain why it is underperforming
3. Give a concrete rewrite or improvement example

Be direct and specific. Do not give generic or obvious advice.`,

  design: `You are a senior brand designer and visual communication specialist with 15 years of experience creating high-converting digital advertisements across Meta, Google, and LinkedIn.

Analyze the ad image and evaluate it against professional design and visual communication principles:
- Color palette: harmony, contrast ratios, brand consistency, and emotional tone
- Typography: hierarchy, readability, font pairing, and size relationships between headline, body, and CTA
- Visual hierarchy: does the eye flow naturally from the primary message to the supporting elements to the CTA?
- Layout and whitespace: balance, breathing room, and spatial relationships between elements
- Image quality and relevance: does the visual reinforce or distract from the message?
- Overall polish: does the ad look professional and trustworthy at a glance?

Provide exactly 3–5 specific, actionable recommendations to improve the visual design. For each recommendation:
1. Name the specific design element
2. Explain the current issue and its impact on performance
3. Give a concrete improvement with specifics (e.g., suggested color contrast, font size, spacing adjustment)

Be direct and specific. Do not give generic or obvious advice.`,
}

const reviewingAdKey = ref<string | null>(null)
const reviewPrompt = ref(REVIEW_PRESETS.conversion)
const reviewing = ref(false)
const reviewResult = ref<string | null>(null)
const reviewError = ref<string | null>(null)
const reviewModel = ref('')
const parsedReview = computed(() => reviewResult.value ? marked(reviewResult.value) as string : '')

function openReview(r2Key: string) {
  reviewingAdKey.value = r2Key
  reviewPrompt.value = REVIEW_PRESETS.conversion
  reviewResult.value = null
  reviewError.value = null
  reviewModel.value = ''
}

function closeReview() {
  reviewingAdKey.value = null
}


function popOutReview() {
  if (!reviewResult.value || !reviewingAdKey.value) return
  const imageUrl = `${window.location.origin}/api/images/${reviewingAdKey.value}`
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ad Review</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 620px; margin: 2rem auto; padding: 0 1.25rem 3rem; color: #1e293b; line-height: 1.6; }
    img { display: block; width: 100%; height: auto; border-radius: 0.75rem; border: 1px solid #e2e8f0; margin-bottom: 1.75rem; }
    h1 { font-size: 1.1rem; font-weight: 700; color: #5b21b6; margin-bottom: 1.25rem; letter-spacing: -0.01em; }
    h2, h3 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.4em; color: #0f172a; }
    p { margin: 0.65em 0; }
    ul, ol { padding-left: 1.4rem; margin: 0.5em 0; }
    li { margin-bottom: 0.35em; }
    strong { font-weight: 600; color: #0f172a; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
  </style>
</head>
<body>
  <img src="${imageUrl}" alt="Reviewed ad" />
  <h1>AI Ad Review</h1>
  ${parsedReview.value}
</body>
</html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'width=700,height=820,scrollbars=yes,resizable=yes')
  closeReview()
}

function applyPreset(key: keyof typeof REVIEW_PRESETS) {
  reviewPrompt.value = REVIEW_PRESETS[key]
}

async function submitReview() {
  if (!reviewingAdKey.value) return
  reviewing.value = true
  reviewError.value = null
  reviewResult.value = null

  // Append text field lengths so the AI knows to keep suggestions in range
  const textFields = templateLayers.value.filter(
    l => l.included !== false && l.type !== 'image' && l.value?.trim(),
  )
  let fullPrompt = reviewPrompt.value.trim()
  if (textFields.length > 0) {
    const lines = textFields
      .map(l => `- ${l.layer}: "${l.value}" (${l.value!.trim().length} chars)`)
      .join('\n')
    fullPrompt += `\n\nCurrent text field values and lengths — keep any suggested copy revisions approximately these character counts:\n${lines}`
  }

  try {
    const res = await $fetch<{ review: string; model: string }>('/api/ai/review-ad', {
      method: 'POST',
      body: { r2Key: reviewingAdKey.value, prompt: fullPrompt },
    })
    reviewResult.value = res.review
    reviewModel.value = res.model
  } catch (e: unknown) {
    reviewError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Review failed'
        : 'Review failed'
  } finally {
    reviewing.value = false
  }
}

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
    // Auto-save unsaved changes before generating so the server reads the
    // current image selections and the media library "in use" state is correct.
    if (isDirty.value) {
      if (isTemplateBased.value) {
        await $fetch(`/api/ad-configs/${id}`, {
          method: 'PUT',
          body: { name: form.name, templateLayers: templateLayers.value },
        })
      } else {
        await $fetch(`/api/ad-configs/${id}`, { method: 'PUT', body: form })
      }
      savedSnapshot.value = takeSnapshot()
    }
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
