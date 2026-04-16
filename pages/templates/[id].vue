<template>
  <div class="mx-auto max-w-wide px-4 py-10">
    <div class="mb-6">
      <NuxtLink to="/templates" class="text-sm text-slate-500 hover:text-slate-700">← Back to Templates</NuxtLink>
    </div>

    <div v-if="pending" class="text-slate-500">Loading template…</div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      Failed to load template: {{ error.message }}
    </div>

    <template v-else-if="template">
      <NuxtLink to="/ads" class="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">← Back to Ad Profiles</NuxtLink>
      <h1 class="mb-1 text-2xl font-bold text-slate-900">Create Ad Profile — {{ template.name }}</h1>
      <p class="mb-2 text-sm text-slate-500">
        Fill in the fields below to configure this template's content. Text layers accept your ad copy directly.
        Image layers let you either upload an image or write a prompt for AI generation — the image is generated when you click <strong class="font-medium">Generate Ad</strong> from the Ad Profile.
      </p>
      <p class="mb-8 text-xs text-slate-400">
        {{ template.width ?? '?' }} × {{ template.height ?? '?' }}px
        <span v-if="layers.length" class="ml-1">· {{ layers.length }} layers</span>
      </p>

      <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <!-- Left: template preview — sticky so it stays in view while scrolling layers -->
        <div class="xl:sticky xl:top-6 xl:self-start">
          <div style="max-width: 320px; overflow: hidden; border-radius: 0.75rem; border: 1px solid #e2e8f0; background: #f8fafc;">
            <img
              v-if="template.thumbnail"
              :src="template.thumbnail"
              :alt="template.name"
              style="display: block; width: 100%; height: auto; max-width: none;"
            />
            <div v-else class="flex h-48 items-center justify-center text-sm text-slate-400">No preview</div>
          </div>
          <p class="mt-3 text-xs text-slate-400">
            Template preview. The actual ad is rendered by Templated.io using your configured values.
          </p>
        </div>

        <!-- Right: layer configuration -->
        <div class="space-y-4">
          <!-- Variation name -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label class="mb-1 block text-sm font-semibold text-slate-700">Ad Profile Name <span class="text-red-500">*</span></label>
            <input
              v-model="variationName"
              type="text"
              placeholder="e.g. Spring Sale – Dark Navy"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p class="mt-1 text-xs text-slate-400">A descriptive name to identify this ad profile in your list.</p>
          </div>

          <!-- One card per layer -->
          <div
            v-for="layer in layers"
            :key="layer.layer"
            class="rounded-xl border bg-white shadow-sm transition-opacity"
            :class="layerIncluded[layer.layer] !== false ? 'border-slate-200' : 'border-slate-100 opacity-60'"
          >
            <div class="flex items-center gap-2 px-5 py-3">
              <span
                class="shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                :class="layer.type === 'image' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
              >
                {{ layer.type === 'image' ? 'Image' : 'Text' }}
              </span>
              <span class="font-medium text-slate-800">{{ layer.layer }}</span>
              <span v-if="layer.description" class="ml-1 text-xs text-slate-400">· {{ layer.description }}</span>
              <button
                type="button"
                class="ml-auto rounded px-2 py-0.5 text-xs font-medium transition-colors"
                :class="layerIncluded[layer.layer] !== false
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600'
                  : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'"
                @click="layerIncluded[layer.layer] = layerIncluded[layer.layer] === false"
              >
                {{ layerIncluded[layer.layer] !== false ? 'Included' : 'Excluded' }}
              </button>
            </div>

            <!-- Card body — hidden when excluded -->
            <template v-if="layerIncluded[layer.layer] !== false">
              <div class="border-t border-slate-100 px-5 pb-5 pt-4">
                <!-- Text layer -->
                <template v-if="layer.type !== 'image'">
                  <div class="relative">
                    <textarea
                      v-model="layerValues[layer.layer]"
                      rows="2"
                      :placeholder="`Enter text for '${layer.layer}'…`"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-2 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600"
                      title="Rewrite with AI"
                      @click="openAiModal(layer.layer)"
                    >
                      AI
                    </button>
                  </div>
                </template>

                <!-- Image layer -->
                <template v-else>
                  <ImageLayerInput
                    :layer-name="layer.layer"
                    :prompt="layerValues[layer.layer]"
                    :r2-key="layerR2Keys[layer.layer]"
                    :image-mode="layerModes[layer.layer]"
                    :saved-prompts="promptLibrary"
                    @update:prompt="layerValues[layer.layer] = $event"
                    @update:r2-key="layerR2Keys[layer.layer] = $event"
                    @update:image-mode="layerModes[layer.layer] = $event"
                    @prompt-saved="promptLibrary.unshift($event)"
                    @prompt-deleted="promptLibrary = promptLibrary.filter(p => p.id !== $event)"
                  />
                </template>
              </div>
            </template>
          </div>

          <!-- Error + submit -->
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>

          <div class="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              :disabled="creating || !variationName.trim()"
              class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
              @click="createVariation"
            >
              {{ creating ? 'Creating…' : 'Create Ad Profile →' }}
            </button>
            <button
              v-if="textLayers.length > 0"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              @click="showGenerateCopyModal = true"
            >
              Generate All Copy with AI
            </button>
          </div>
          <p v-if="copyModel" class="text-xs text-slate-400">Copy generated using {{ copyModel }}</p>
          <p v-if="copyError" class="text-sm text-red-600">{{ copyError }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- Generate All Copy Modal -->
  <GenerateCopyModal
    v-if="showGenerateCopyModal"
    :show="showGenerateCopyModal"
    :template-name="template?.name ?? ''"
    :fields="textLayers.map(l => ({ name: l.layer, value: layerValues[l.layer] ?? '', type: l.type }))"
    @update:show="val => { showGenerateCopyModal = val }"
    @generated="onCopyGenerated"
  />

  <!-- AI Copy Modal -->
  <AiCopyModal
    v-if="aiModalField"
    :show="!!aiModalField"
    :field-name="aiModalField"
    :current-value="layerValues[aiModalField] ?? ''"
    :template-name="template?.name ?? ''"
    :other-fields="otherTextFieldsForModal"
    @update:show="val => { if (!val) aiModalField = '' }"
    @accept="val => { layerValues[aiModalField] = val; aiModalField = '' }"
  />
</template>

<script setup lang="ts">
interface TemplatedLayer {
  layer: string
  type: string
  description?: string
  text?: string       // current text content from the template
  image_url?: string
}

interface TemplatedTemplate {
  id: string
  name: string
  thumbnail?: string
  width?: number
  height?: number
  layersCount?: number
  layers?: TemplatedLayer[]
}

interface SavedPrompt {
  id: number
  name: string
  prompt: string
}

const route = useRoute()
const id = route.params.id as string

const [{ data, pending, error }, promptsData] = await Promise.all([
  useFetch<TemplatedTemplate>(`/api/templated/templates/${id}`),
  useFetch<SavedPrompt[]>('/api/prompts'),
])

const template = computed(() => data.value ?? null)
const layers = computed(() => data.value?.layers ?? [])
const promptLibrary = ref<SavedPrompt[]>(promptsData.data.value ?? [])

// Per-layer state keyed by layer name
const layerValues = reactive<Record<string, string>>({})
const layerR2Keys = reactive<Record<string, string>>({})
const layerModes = reactive<Record<string, 'generate' | 'upload'>>({})
const layerIncluded = reactive<Record<string, boolean>>({})

watch(layers, (ls) => {
  for (const l of ls) {
    if (!(l.layer in layerValues)) {
      layerValues[l.layer] = l.type !== 'image' ? (l.text ?? '') : ''
    }
    if (!(l.layer in layerR2Keys)) layerR2Keys[l.layer] = ''
    if (!(l.layer in layerModes)) layerModes[l.layer] = 'generate'
    if (!(l.layer in layerIncluded)) layerIncluded[l.layer] = true
  }
}, { immediate: true })

function defaultVariationName(templateName: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
    + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  return `${templateName} ${stamp}`
}

const variationName = ref('')

watch(template, (t) => {
  if (t && !variationName.value) variationName.value = defaultVariationName(t.name)
}, { immediate: true })
const creating = ref(false)
const createError = ref<string | null>(null)

// AI copy generation
const aiModalField = ref('')
const showGenerateCopyModal = ref(false)
const copyError = ref<string | null>(null)
const copyModel = ref('')

const textLayers = computed(() => layers.value.filter(l => l.type !== 'image'))

const otherTextFieldsForModal = computed(() =>
  textLayers.value
    .filter(l => l.layer !== aiModalField.value)
    .map(l => ({ name: l.layer, value: layerValues[l.layer] ?? '' })),
)

function openAiModal(layerName: string) {
  aiModalField.value = layerName
}

function onCopyGenerated(payload: { suggestions: Array<{ name: string; value: string }>; model: string }) {
  for (const s of payload.suggestions) {
    if (s.name in layerValues) layerValues[s.name] = s.value
  }
  copyModel.value = payload.model
}

async function createVariation() {
  createError.value = null
  creating.value = true
  try {
    const templateLayers = layers.value
      .map(l => {
        const included = layerIncluded[l.layer] !== false
        if (l.type !== 'image') {
          return { layer: l.layer, type: l.type, value: layerValues[l.layer]?.trim(), included }
        }
        return {
          layer: l.layer,
          type: l.type,
          imageMode: layerModes[l.layer],
          included,
          ...(layerModes[l.layer] === 'upload'
            ? { r2Key: layerR2Keys[l.layer] }
            : { prompt: layerValues[l.layer]?.trim() }),
        }
      })

    await $fetch('/api/ad-configs', {
      method: 'POST',
      body: { name: variationName.value.trim(), templateId: id, templateLayers },
    })

    clearNuxtData('ad-configs-index')
    await navigateTo('/ads')
  } catch (e: unknown) {
    createError.value =
      e && typeof e === 'object' && 'data' in e
        ? (e as { data: { message?: string } }).data?.message ?? 'Failed to create variation'
        : 'Failed to create variation'
  } finally {
    creating.value = false
  }
}
</script>
